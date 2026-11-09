// Local QA utility, never included in public/. Needs the existing Playwright runtime.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const sharp = require('sharp');
const base = (process.argv[2] || 'http://127.0.0.1:4175').replace(/\/$/, '');
// Optional per-process DNS pin for a newly created domain whose NXDOMAIN
// remains cached locally. Use only an address just verified with its
// authoritative DNS. Hostname, SNI and certificate validation are unchanged.
const resolveIp = process.env.TENGU_VERIFY_IPV4;
if (resolveIp) {
  assert(require('node:net').isIPv4(resolveIp), 'Expected an observed public IPv4');
  const dns = require('node:dns');
  const originalLookup = dns.lookup;
  dns.lookup = (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {}; }
    if (hostname !== new URL(base).hostname) return originalLookup(hostname, options, callback);
    queueMicrotask(() => options?.all
      ? callback(null, [{ address: resolveIp, family: 4 }])
      : callback(null, resolveIp, 4));
  };
}
const root = __dirname;
const qa = path.join(root, 'qa');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'build-manifest.json'), 'utf8'));
const mediaDelivery = [];
const forbidden = [
  '/script.html', '/script', '/SCRIPT-RU.md', '/STORY-PLAN-RU.md',
  '/en/script.html', '/en/script', '/en/SCRIPT-EN.md', '/en/STORY-PLAN-EN.md',
  '/SKILL.md', '/tengu-youtube-skill.zip', '/artifact-template-tengu-youtube/SKILL.md',
  '/build-manifest.json', '/build.mjs', '/README-RU.md', '/.git/config', '/.env',
];
const ids = ['intro', 'slide-1', 'slide-2', 'slide-3', 'slide-6', 'slide-7', 'slide-10', 'slide-8', 'slide-9', 'slide-12', 'slide-13', 'sources'];

(async () => {
  fs.mkdirSync(qa, { recursive: true });
  // Verify every deployed file, not only what happens to load in the viewport.
  for (const [file, expected] of Object.entries(manifest.files)) {
    if (file.startsWith('_')) continue; // Hosting control files, not public URLs on Pages.
    const response = await fetch(base + '/' + file);
    assert.equal(response.status, 200, file);
    const data = Buffer.from(await response.arrayBuffer());
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'), expected.sha256, 'Content mismatch: ' + file);
  }
  for (const file of forbidden) {
    const response = await fetch(base + file);
    assert.equal(response.status, 404, 'Private path must be absent: ' + file);
    const body = await response.text();
    assert(!body.includes('scriptContent'), 'Private reader must not be served');
  }
  if (base.startsWith('https://')) {
    for (const url of ['/ru', '/ru/']) {
      const redirect = await fetch(base + url, { redirect: 'manual' });
      assert.equal(redirect.status, 302);
      assert.equal(new URL(redirect.headers.get('location'), base).pathname, '/');
    }
    for (const file of ['tengu-logo-sting.mp4', 'tengu-logo-sting-en.mp4']) {
      const response = await fetch(base + '/assets/' + file, { headers: { Range: 'bytes=0-1023' } });
      assert.match(response.headers.get('content-type'), /video\/mp4/);
      const data = Buffer.from(await response.arrayBuffer());
      if (response.status === 206) {
        assert.match(response.headers.get('content-range'), /^bytes 0-1023\//);
        assert.equal(data.length, 1024);
      } else {
        // HTTP servers may ignore Range. For these short intros, verify the
        // complete original file and actual browser playback instead of
        // claiming partial streaming support that the host does not provide.
        assert.equal(response.status, 200, 'Video delivery: ' + file);
        assert.equal(crypto.createHash('sha256').update(data).digest('hex'), manifest.files['assets/' + file].sha256);
      }
      mediaDelivery.push({ file, status: response.status, mode: response.status === 206 ? 'byte-range' : 'complete-file' });
    }
    console.log('Video delivery: ' + JSON.stringify(mediaDelivery));
  }
  console.log('PASS: all public content hashes, media and 16 private paths return 404.');
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    args: resolveIp ? ['--host-resolver-rules=MAP ' + new URL(base).hostname + ' ' + resolveIp] : [] });
  try {
    for (const language of ['ru', 'en']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
      await page.goto(base + (language === 'en' ? '/en/' : '/') + '#slide-1');
      await page.waitForFunction(() => ready);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      assert.deepEqual(await page.locator('.scene').evaluateAll(nodes => nodes.map(n => n.id)), ids);
      if (language === 'en') assert.doesNotMatch(await page.locator('body').innerText(), /[А-Яа-яЁё]/);
      await page.keyboard.press('Home');
      for (const id of ids.slice(1)) {
        await page.keyboard.press('ArrowDown');
        await page.waitForFunction(id => !travelState && currentScene.id === id, id);
      }
      for (const id of ids.slice(0, -1).reverse()) {
        await page.keyboard.press('ArrowUp');
        await page.waitForFunction(id => !travelState && currentScene.id === id, id);
      }
      for (const id of ids.slice(2, -1)) {
        await page.evaluate(id => scrollToScene(document.getElementById(id)), id);
        await page.keyboard.press('KeyR');
        const count = await page.evaluate(() => sceneTiming().count);
        for (let phase = 0; phase < count; phase++) {
          assert(await page.evaluate(() => animationPaused && !clockRunning));
          const frame = await page.evaluate(() => currentScene.id === 'slide-2'
            ? document.querySelector('.context-assembly').dataset.stage
            : ['slide-6', 'slide-13'].includes(currentScene.id) ? currentScene.dataset.frame : currentScene.dataset.storyStep);
          assert.equal(Number(frame), phase, language + ' ' + id + ' phase');
          await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('ArrowLeft');
        const frozen = await page.evaluate(() => animationTime());
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => animationTime()), frozen);
      }
      await page.keyboard.press('KeyP');
      assert.equal(await page.evaluate(() => animationPaused), false);
      await page.keyboard.press('Minus');
      assert.equal(await page.evaluate(() => animationRate), 0.5);
      await page.keyboard.press('Digit0');
      assert.equal(await page.evaluate(() => animationRate), 1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => { animationPaused = false; manualAnimation = false; runAnimationClock(); });
      const montage = [];
      for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        for (const [i, id] of ids.entries()) {
          await page.evaluate(id => scrollToScene(document.getElementById(id)), id);
          await page.waitForTimeout(90);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow ' + language + ' ' + id);
          if (viewport.width > 980) assert.equal(await page.locator('#' + id).evaluate(n => n.offsetHeight), viewport.height);
          assert(await page.locator('#' + id + ' img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0)), 'Images ' + id);
          const file = path.join(qa, language + '-' + viewport.width + '-' + id + '.png');
          await page.locator('#' + id).screenshot({ path: file });
          if (viewport.width === 1280) montage.push({ input: await sharp(file).resize(384, 216).toBuffer(), left: (i % 3) * 384, top: Math.floor(i / 3) * 216 });
        }
      }
      await sharp({ create: { width: 1152, height: 864, channels: 3, background: '#e9dfc9' } }).composite(montage).png().toFile(path.join(qa, language + '-overview.png'));
      assert.equal(await page.locator('.closing-logo').evaluate(n => getComputedStyle(n).filter), 'none');
      assert.equal(await page.locator('a[href*="script.html"], a[href$=".md"]').count(), 0);
      await page.keyboard.press('Home');
      await page.locator('#startButton').click();
      await page.waitForFunction(() => document.getElementById('introVideo').currentTime > 0);
      assert.equal(await page.locator('#introVideo').evaluate(v => v.videoWidth), 1920);
      assert.equal(await page.locator('#introVideo').evaluate(v => v.muted), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS ' + language.toUpperCase() + ': all scenes and phases; keyboard, pause, reverse, speed, mobile layout, fonts/images and intro playback.');
    }
  } finally { await browser.close(); }
  const report = JSON.stringify({ checkedAt: new Date().toISOString(), base, status: 'passed', languages: ['ru', 'en'], privatePaths: forbidden, mediaDelivery, dnsOverride: resolveIp || null }, null, 2) + '\n';
  fs.writeFileSync(path.join(qa, 'verification.json'), report);
  fs.writeFileSync(path.join(qa, 'verification-' + new URL(base).hostname + '.json'), report);
})().catch(error => { console.error(error); process.exitCode = 1; });
