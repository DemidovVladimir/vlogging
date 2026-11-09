// Browser QA for this release's change: the trainer link in both catalogs' header nav and in all
// 8 viewers' episode menus, at phone to desktop widths. Writes qa/<host>/verify-trainer.json and,
// with SHOTS=<dir>, screenshots. The regression suite for everything else is verify.mjs.
// Usage: PLAYWRIGHT_DIR=<node_modules/playwright-core> node verify-trainer.mjs http://127.0.0.1:4181
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_DIR);
const origin = process.argv[2] || 'http://127.0.0.1:4181';
const root = path.dirname(fileURLToPath(import.meta.url));
const shots = process.env.SHOTS;
const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
const results = [];
async function check(name, fn, viewport = {width: 1440, height: 900}) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror ' + e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push('console ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });
  try {
    await fn(page);
    assert.deepEqual(problems, []);
    results.push({name, ok: true});
  } catch (e) {
    results.push({name, ok: false, error: String(e.message || e).split('\n').slice(0, 6).join(' '), problems});
  }
  await context.close();
}
const shot = async (page, name) => { if (shots) { fs.mkdirSync(shots, {recursive: true}); await page.screenshot({path: path.join(shots, name + '.png')}); } };
const inView = box => box && box.x >= 0 && box.y >= 0 && box.x + box.width <= innerWidth + 0.5;
const sizes = [{width: 320, height: 640}, {width: 390, height: 844}, {width: 768, height: 1024}, {width: 1280, height: 720}, {width: 1920, height: 1080}];
const label = {ru: 'Тренажёр', en: 'Trainer'};
const slugs = ['tengu-cluster', 'agent-context', 'emudhra-ca-compromise', 'chaos-kb'];

for (const lang of ['ru', 'en']) {
  const prefix = lang === 'en' ? '/en' : '';
  for (const viewport of sizes) {
    await check(`${lang} catalog at ${viewport.width}px: the trainer tab sits in the header, on one line, nothing scrolls sideways`, async page => {
      await page.goto(origin + prefix + '/');
      await page.evaluate(() => document.fonts.ready);
      const tab = page.locator('.catalog-header nav > a[href="/modal-city/"]');
      assert.equal(await tab.count(), 1);
      assert.equal((await tab.textContent()).trim(), label[lang]);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      const geo = await page.evaluate(() => {
        const r = el => el.getBoundingClientRect().toJSON();
        const nav = document.querySelector('.catalog-header nav');
        return {tab: r(nav.querySelector('a[href="/modal-city/"]')), first: r(nav.querySelector('a[href="#episodes"]')), langs: r(nav.querySelector('.catalog-languages')), brand: r(document.querySelector('.catalog-brand')), vw: innerWidth};
      });
      assert(geo.tab.x + geo.tab.width <= geo.vw && geo.langs.x + geo.langs.width <= geo.vw, 'header item off screen');
      assert(Math.abs(geo.tab.y + geo.tab.height / 2 - (geo.first.y + geo.first.height / 2)) < 2, 'the tab is not on the Episodes line');
      assert(geo.tab.height < 50, 'the tab label wraps');
      assert(geo.brand.x + geo.brand.width <= geo.first.x, 'brand and nav overlap');
      await shot(page, `catalog-${lang}-${viewport.width}`);
    }, viewport);
  }
  await check(`${lang} catalog: the tab leads to /modal-city/`, async page => {
    await page.goto(origin + prefix + '/');
    assert.equal(await page.locator('.catalog-header nav > a[href="/modal-city/"]').getAttribute('hreflang'), lang === 'ru' ? 'en' : null);
    assert.equal(await page.locator('a[href="/modal-city/"]').count(), 1);
  });
  for (const slug of slugs) {
    for (const viewport of [{width: 320, height: 640}, {width: 1280, height: 720}]) {
      await check(`${lang} ${slug} at ${viewport.width}px: the menu offers home and the trainer`, async page => {
        await page.goto(`${origin}${prefix}/episodes/${slug}/`);
        await page.locator('[data-open-menu]').click();
        const links = page.locator('#episodeMenu .episode-menu__links > a');
        assert.deepEqual(await links.evaluateAll(l => l.map(a => a.getAttribute('href'))), [prefix + '/', '/modal-city/']);
        const css = await page.locator('#episodeMenu .episode-menu__links').evaluate(el => getComputedStyle(el).display);
        assert.equal(css, 'flex', 'site.css rule not applied');
        for (const a of await links.all()) assert(await a.evaluate(el => { const b = el.getBoundingClientRect(); const d = el.closest('dialog').getBoundingClientRect(); return b.width > 0 && b.left >= d.left && b.right <= d.right; }), 'link outside the dialog');
        assert.equal(await page.locator('#episodeMenu .episode-menu__list a').count(), 4);
        await shot(page, `menu-${lang}-${slug}-${viewport.width}`);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#episodeMenu').evaluate(d => d.open), false);
      }, viewport);
    }
  }
}
await browser.close();
const failed = results.filter(r => !r.ok);
const out = path.join(root, 'qa', new URL(origin).hostname);
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'verify-trainer.json'), JSON.stringify({origin, checkedAt: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results}, null, 2) + '\n');
console.log(`${results.length - failed.length}/${results.length} passed`);
for (const f of failed) console.log('FAIL', f.name, '\n  ', f.error, f.problems?.length ? '\n   ' + f.problems.join('\n   ') : '');
process.exit(failed.length ? 1 : 0);
