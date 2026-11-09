// Browser QA for the staged or live site around EP.05: the RU/EN Chaos Substrate viewers' navigation,
// both catalogs, the 05 entry in all eight older menus, the EP.04 guide and the legacy root link.
// The deck itself (every scene and phase, controls, sizes, intro sound) is checked by
// ../tengu-chaos-substrate-episode/verify.cjs against the same origin.
// Writes qa/<host>/verify.json; exits non-zero on any failure.
// Usage: PLAYWRIGHT_DIR=<node_modules/playwright> node verify.mjs http://127.0.0.1:4182
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {episodes, published, added, route} from './episodes.mjs';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_DIR);
const origin = process.argv[2] || 'http://127.0.0.1:4182';
const root = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
const results = [];
async function check(name, fn, viewport = {width: 1440, height: 900}) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
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
const ids = episodes.map(ep => ep.id);
const deck = lang => route(lang, added.slug);

for (const lang of ['ru', 'en']) {
  const other = lang === 'ru' ? 'en' : 'ru';
  await check(`${lang} 05: menu lists 05–01, current is 05, the deck is inert until Escape`, async page => {
    await page.goto(origin + deck(lang) + '#slide-3');
    await page.waitForFunction(() => ready && currentScene.id === 'slide-3');
    await page.locator('[data-open-menu]').click();
    const items = page.locator('#episodeMenu .episode-menu__list a');
    assert.deepEqual(await items.locator('b').allTextContents(), ids);
    assert.equal(await page.locator('#episodeMenu [aria-current=page]').getAttribute('href'), deck(lang));
    assert.equal(await page.evaluate(() => document.querySelector('#deck').inert), true);
    await page.keyboard.press('ArrowDown'); // must not move the deck behind the open menu
    assert.equal(await page.evaluate(() => currentScene.id), 'slide-3');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#episodeMenu').evaluate(d => d.open), false);
    await page.waitForFunction(() => document.querySelector('#deck').inert === false, null, {timeout: 2000});
  });
  await check(`${lang} 05: the language link opens the same slide in ${other}`, async page => {
    await page.goto(origin + deck(lang) + '#slide-4');
    await page.waitForFunction(() => ready && currentScene.id === 'slide-4');
    await page.locator('[data-episode-language]').click();
    await page.waitForLoadState('load');
    await page.waitForFunction(() => typeof ready !== 'undefined' && ready);
    assert.equal(new URL(page.url()).pathname, deck(other));
    assert.equal(new URL(page.url()).hash, '#slide-4');
    assert.equal(await page.evaluate(() => document.documentElement.lang), other);
  });
  await check(`${lang} 05: H hides the navigation for recording and ?record=1 keeps it hidden`, async page => {
    await page.goto(origin + deck(lang) + '#slide-2');
    await page.waitForFunction(() => ready);
    await page.keyboard.press('h');
    assert.equal(await page.locator('.site-nav').isVisible(), false);
    assert.equal(new URL(page.url()).searchParams.get('record'), '1');
    await page.reload();
    await page.waitForFunction(() => ready);
    assert.equal(await page.locator('.site-nav').isVisible(), false);
    await page.keyboard.press('h');
    assert.equal(await page.locator('.site-nav').isVisible(), true);
  });
  await check(`${lang} 05: no link to a script, plan or local address`, async page => {
    await page.goto(origin + deck(lang));
    const hrefs = await page.locator('a[href]').evaluateAll(l => l.map(a => a.getAttribute('href')));
    for (const h of hrefs) assert(!/script|SCRIPT|STORY|localhost|127\.0\.0\.1|file:/.test(h), h);
    assert(hrefs.includes(route(lang, 'chaos-kb')) || hrefs.some(h => h.endsWith('/episodes/chaos-kb/')), 'link to EP.04');
  });
  await check(`${lang} catalog: 05 is the feature, 04–01 are cards, count 05`, async page => {
    await page.goto(origin + route(lang));
    assert.equal(await page.locator('.catalog-count b').textContent(), '05');
    assert(await page.locator('.catalog-count').textContent().then(t => t.includes(lang === 'ru' ? 'ВЫПУСКОВ' : 'EPISODES')));
    assert.equal(await page.locator('.episode-feature h2').textContent(), added[lang].title);
    assert.deepEqual(await page.locator('.episode-card__art').evaluateAll(l => l.map(x => x.dataset.id)), published.map(ep => ep.id));
    assert.equal(await page.locator('.episode-card--memory .episode-open').getAttribute('href'), route(lang, 'chaos-kb'));
    const broken = await page.locator('img').evaluateAll(l => l.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
    assert.deepEqual(broken, []);
    await page.locator('.episode-feature .episode-open').click();
    await page.waitForLoadState('load');
    assert.equal(new URL(page.url()).pathname, deck(lang));
  });
  for (const viewport of [{width: 320, height: 640}, {width: 390, height: 844}, {width: 768, height: 1024}, {width: 1920, height: 1080}]) {
    await check(`${lang} catalog at ${viewport.width}×${viewport.height}: no sideways scroll`, async page => {
      await page.goto(origin + route(lang));
      for (const img of await page.locator('img[loading=lazy]').all()) await img.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    }, viewport);
  }
  for (const ep of published) {
    await check(`${lang} ${ep.slug}: menu shows 05 first, keeps its own current item, opens 05`, async page => {
      await page.goto(origin + route(lang, ep.slug));
      await page.locator('[data-open-menu]').click();
      assert.deepEqual(await page.locator('#episodeMenu .episode-menu__list a b').allTextContents(), ids);
      assert.equal(await page.locator('#episodeMenu [aria-current=page]').getAttribute('href'), route(lang, ep.slug));
      await page.locator('#episodeMenu .episode-menu__list a').first().click();
      await page.waitForLoadState('load');
      assert.equal(new URL(page.url()).pathname, deck(lang));
    });
  }
}
await check('legacy root link still reaches EP.01', async page => {
  await page.goto(origin + '/?x=1#slide-3');
  await page.waitForURL(/agent-context/);
  assert.equal(new URL(page.url()).pathname, '/episodes/agent-context/');
  assert.equal(new URL(page.url()).search, '?x=1');
  assert.equal(new URL(page.url()).hash, '#slide-3');
});
await browser.close();

const failed = results.filter(r => !r.ok);
const out = path.join(root, 'qa', new URL(origin).hostname);
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'verify.json'), JSON.stringify({origin, checkedAt: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results}, null, 2) + '\n');
console.log(`${results.length - failed.length}/${results.length} passed`);
for (const f of failed) console.log('FAIL', f.name, '\n  ', f.error, f.problems?.length ? '\n   ' + f.problems.join('\n   ') : '');
process.exit(failed.length ? 1 : 0);
