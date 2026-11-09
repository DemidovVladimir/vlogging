// Browser QA for the EP.04 guide revision of 27.10.2026 (served by `node serve.mjs public <port>`): the
// RU/EN guide with its revised words, the 04 card in both catalogs and 04 in the other four viewers'
// menus. Writes qa/<host>/verify.json; exits non-zero on any failure.
// Usage: PLAYWRIGHT_DIR=<node_modules/playwright> node verify.mjs http://127.0.0.1:4183
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_DIR);
const origin = process.argv[2] || 'http://127.0.0.1:4183';
const root = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
const results = [];
async function check(name, fn, viewport = {width: 1440, height: 900}) {
  const context = await browser.newContext({viewport, permissions: ['clipboard-read', 'clipboard-write']});
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
const guides = {ru: '/episodes/chaos-kb/', en: '/en/episodes/chaos-kb/'};
const viewers = ['agent-context', 'tengu-cluster', 'emudhra-ca-compromise', 'chaos-substrate'];
const menu = ['05', '04', '03', '02', '01'];

for (const [lang, url] of Object.entries(guides)) {
  const other = lang === 'ru' ? 'en' : 'ru';
  await check(`${lang} guide: rail follows the parts, language link keeps the part`, async page => {
    await page.goto(origin + url);
    assert.equal(await page.locator('#sectionIndex').textContent(), '00');
    await page.locator('#install').scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#sectionIndex').textContent(), '03');
    assert.equal(new URL(page.url()).hash, '#install');
    const href = await page.locator('[data-episode-language]').getAttribute('href');
    assert.equal(href, guides[other] + '#install');
    await page.locator('[data-episode-language]').click();
    await page.waitForLoadState('load');
    assert.equal(new URL(page.url()).pathname, guides[other]);
    assert.equal(new URL(page.url()).hash, '#install');
    assert.equal(await page.evaluate(() => document.documentElement.lang), other);
  });
  await check(`${lang} guide: menu lists 05–01, current is 04, Escape closes it`, async page => {
    await page.goto(origin + url);
    await page.locator('[data-open-menu]').click();
    const items = page.locator('#episodeMenu .episode-menu__list a');
    assert.equal(await items.count(), 5);
    assert.deepEqual(await items.locator('b').allTextContents(), menu);
    assert.equal(await page.locator('#episodeMenu [aria-current=page]').getAttribute('href'), url);
    assert.equal(await page.evaluate(() => document.querySelector('#deck').inert), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#episodeMenu').evaluate(d => d.open), false);
    // site.js clears inert in the dialog's `close` event, which fires a task after Escape.
    await page.waitForFunction(() => document.querySelector('#deck').inert === false, null, {timeout: 2000});
  });
  await check(`${lang} guide: H hides the navigation and the address keeps ?record=1`, async page => {
    await page.goto(origin + url);
    await page.keyboard.press('h');
    assert.equal(await page.locator('.site-nav').isVisible(), false);
    assert.equal(new URL(page.url()).searchParams.get('record'), '1');
    await page.keyboard.press('h');
    assert.equal(await page.locator('.site-nav').isVisible(), true);
  });
  await check(`${lang} guide: copy buttons copy only the commands`, async page => {
    await page.goto(origin + url);
    const block = page.locator('#install .code').nth(1);
    await block.locator('.copy').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'cargo install --git https://github.com/DemidovVladimir/chaos-substrate --branch v2 --locked chaos-kb\nchaos-kb --version');
    assert.equal(await block.locator('.copy').textContent(), lang === 'ru' ? 'Скопировано' : 'Copied');
    assert.equal(await page.locator('pre[data-copy]').count(), await page.locator('.copy').count());
  });
  await check(`${lang} guide: the contents lists 01–08 and every entry lands on its part`, async page => {
    await page.goto(origin + url);
    const toc = await page.locator('.toc a').evaluateAll(l => l.map(a => [a.querySelector('b').textContent, a.getAttribute('href')]));
    assert.equal(toc.length, 8);
    assert.equal(await page.locator('.rail__meta span').last().textContent(), '08');
    for (const [n, href] of toc) assert.equal(await page.locator(href).getAttribute('data-part'), n, href);
    assert.deepEqual(toc[4], ['05', '#brief']);
  });
  await check(`${lang} guide: the brief part shows the searcher's calls, the block and the three builders`, async page => {
    await page.emulateMedia({reducedMotion: 'reduce'}); // the deep link jumps instead of scrolling smoothly
    await page.goto(origin + url + '#brief');
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#sectionIndex').textContent(), '05');
    const blocks = await page.locator('#brief .code pre').evaluateAll(l => l.map(p => p.textContent));
    assert(blocks[0].includes('"score": 0.28241580724716187'), 'kb_topics answer');
    assert(blocks[1].includes('"id": "Taste.md:3-5"'), 'kb_read answer');
    assert(!blocks[0].includes('"root"') && !blocks[1].includes('"root"'), 'no vault root in the answers');
    assert(blocks[2].startsWith("[Brief from agent `searcher`: what the user's knowledge base says that matters for this request]"), 'the block');
    assert(blocks[3].includes('searcher = "searcher"'), 'config');
    assert.deepEqual(await page.locator('#brief .table--trio tbody td:first-child code').allTextContents(), ['plain', 'persona', 'briefed']);
    assert.deepEqual(await page.locator('#brief .shot img').evaluateAll(l => l.map(i => i.getAttribute('src'))), ['assets/persona-3.jpg', 'assets/briefed.jpg']);
  });
  await check(`${lang} guide: the check demo walks the real paths`, async page => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.goto(origin + url);
    const states = () => page.locator('.check-flow li').evaluateAll(l => l.map(x => x.dataset.state));
    const visible = () => page.locator('.answer:not([hidden])').getAttribute('data-presence');
    assert.deepEqual(await states(), ['yes', 'skip', 'skip']); assert.equal(await visible(), 'exact');
    await page.locator('[data-check="1"]').click();
    assert.deepEqual(await states(), ['no', 'done', 'yes']); assert.equal(await visible(), 'similar');
    await page.locator('[data-check="3"]').click();
    assert.deepEqual(await states(), ['no', 'done', 'no']); assert.equal(await visible(), 'absent');
    assert.equal(await page.locator('[data-check="3"]').getAttribute('aria-pressed'), 'true');
  });
  await check(`${lang} guide: the revised words (no vault root, seven tools, forget and dashboard)`, async page => {
    await page.goto(origin + url);
    const text = await page.locator('main').textContent();
    for (const bad of ['Merkle', 'Меркл', '"root"', '59f41e6f5ce1579a70434a1c0c27fcfb021c4e420aac090b8b97a627063b775b']) assert(!text.includes(bad), bad);
    assert.equal(await page.locator('#how .card h3').nth(1).textContent(), lang === 'ru' ? 'Отпечатки и хеши заметок' : 'Fingerprints and note hashes');
    assert.equal(await page.locator('#connect .lead code').count(), 8);
    assert(await page.locator('#connect .lead').textContent().then(t => t.includes('kb_forget')));
    const commands = await page.locator('#daily .table--daily tbody td:nth-child(2) code').allTextContents();
    assert.equal(commands.length, 10);
    assert(commands.includes('chaos-kb forget "…" --note Health') && commands.includes('chaos-kb dashboard'));
    assert(await page.locator('#install .code pre').nth(2).textContent().then(t => t.includes('"removed": []') && !t.includes('root')));
    assert(await page.locator('#repeat .install li').first().textContent().then(t => t.includes('"stored": true')));
    assert(await page.locator('.guide-footer').textContent().then(t => t.includes('ed73a5e0c80651cf6f8c19b8e8c3942186a5f109') && t.includes('27.10.2026')));
  });
  for (const viewport of [{width: 320, height: 640}, {width: 390, height: 844}, {width: 768, height: 1024}, {width: 1280, height: 720}, {width: 1920, height: 1080}]) {
    await check(`${lang} guide at ${viewport.width}×${viewport.height}: no sideways scroll, images and fonts load`, async page => {
      await page.goto(origin + url);
      for (const img of await page.locator('img[loading=lazy]').all()) await img.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      const broken = await page.locator('img').evaluateAll(l => l.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src));
      assert.deepEqual(broken, []);
      assert.equal(await page.evaluate(async () => { await document.fonts.ready; return ['Manrope', 'Plex', 'Literata'].every(f => document.fonts.check(`16px ${f}`)); }), true);
    }, viewport);
  }
}

for (const lang of ['ru', 'en']) {
  const prefix = lang === 'en' ? '/en' : '';
  await check(`${lang} catalog: the 04 card opens the guide`, async page => {
    await page.goto(origin + prefix + '/');
    assert.equal(await page.locator('.catalog-count b').textContent(), '05');
    assert.deepEqual(await page.locator('.episode-card__art').evaluateAll(l => l.map(x => x.dataset.id)), ['04', '03', '02', '01']);
    assert.equal(await page.locator('.episode-card--memory .episode-open').getAttribute('href'), guides[lang]);
    await page.locator('.episode-card--memory .episode-open').click();
    await page.waitForLoadState('load');
    assert.equal(new URL(page.url()).pathname, guides[lang]);
  });
  for (const slug of viewers) {
    await check(`${lang} ${slug}: menu lists 05–01 and its 04 opens the guide`, async page => {
      await page.goto(`${origin}${prefix}/episodes/${slug}/`);
      await page.locator('[data-open-menu]').click();
      assert.deepEqual(await page.locator('#episodeMenu .episode-menu__list a b').allTextContents(), menu);
      const first = page.locator('#episodeMenu .episode-menu__list a').nth(1);
      assert.equal(await first.locator('b').textContent(), '04');
      assert.equal(await page.locator('#episodeMenu [aria-current=page]').getAttribute('href'), `${prefix}/episodes/${slug}/`);
      await first.click();
      await page.waitForLoadState('load');
      assert.equal(new URL(page.url()).pathname, guides[lang]);
    });
  }
}
await check('legacy root link still reaches EP.01', async page => {
  await page.goto(origin + '/?x=1#slide-3');
  await page.waitForURL(/agent-context/);
  assert.equal(new URL(page.url()).pathname, '/episodes/agent-context/');
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
