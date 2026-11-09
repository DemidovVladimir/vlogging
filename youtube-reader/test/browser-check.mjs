// Browser check in headless Google Chrome (playwright-core from neovim_pro/tools, as the TENGU
// release checks use). Every request carries the given auth headers, so the same script runs
// locally (signed test token) and in production (Access service token).
//   node test/browser-check.mjs <base> <headers-json-file> <video-url> <screenshot-dir>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { runner } from './checks.mjs';
import { exportFilename } from '../src/core.js';

const PW = process.env.PLAYWRIGHT_DIR || '/Users/vladimirdemidov/development/neovim_pro/tools/node_modules/playwright-core';
const { chromium } = await import(join(PW, 'index.mjs'));
const [base, headersFile, videoUrl, shots] = process.argv.slice(2);
const headers = JSON.parse(readFileSync(headersFile, 'utf8'));
mkdirSync(shots, { recursive: true });

const { check, results } = runner();
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const newContext = (opts = {}) => browser.newContext({ extraHTTPHeaders: headers, acceptDownloads: true, viewport: { width: 1440, height: 900 }, ...opts });
const consoleErrors = [];
const apiLog = [];
const watch = (page) => {
  page.on('response', (r) => { if (r.url().includes('/api/')) apiLog.push(`${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`); });
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('dialog', (d) => d.accept());
};

const created = [];
try {
  let context = await newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
  let page = await context.newPage();
  watch(page);

  await check('page loads with its stylesheet and script applied', async () => {
    const responses = [];
    page.on('response', (r) => responses.push({ url: r.url(), status: r.status(), type: r.headers()['content-type'] }));
    await page.goto(base, { waitUntil: 'networkidle' });
    const style = await page.evaluate(() => ({
      bg: getComputedStyle(document.body).backgroundColor,
      sidebar: getComputedStyle(document.querySelector('.sidebar')).position,
      button: getComputedStyle(document.querySelector('#extract-button')).backgroundColor,
      rules: [...document.styleSheets].reduce((n, s) => n + s.cssRules.length, 0),
      account: document.querySelector('#account-line').textContent,
    }));
    assert.equal(style.sidebar, 'fixed');
    assert.ok(style.rules > 100, `css rules ${style.rules}`);
    assert.notEqual(style.account, 'Checking sign-in…');
    const css = responses.find((r) => r.url.endsWith('/style.css'));
    const js = responses.find((r) => r.url.endsWith('/app.js'));
    assert.equal(css.status, 200); assert.match(css.type, /^text\/css/);
    assert.equal(js.status, 200); assert.match(js.type, /javascript/);
    await page.screenshot({ path: join(shots, '1-home.png') });
    return { body: style.bg, button: style.button, cssRules: style.rules, account: style.account };
  });

  let title;
  await check('extracting a real video shows text with timestamp links', async () => {
    await page.fill('#video-url', videoUrl);
    await page.click('#extract-button');
    await page.waitForSelector('#reader:not([hidden])', { timeout: 60_000 });
    title = await page.textContent('#reader-title');
    const rows = await page.$$eval('.transcript-paragraph', (els) => els.length);
    const links = await page.$$eval('.transcript-paragraph > a', (els) => els.map((a) => a.href));
    assert.ok(rows > 0);
    assert.ok(links.length > 0 && links.every((h) => /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}&t=\d+s$/.test(h)), links[0]);
    const id = await page.evaluate(() => localStorage.getItem('margin-current'));
    created.push(id);
    await page.screenshot({ path: join(shots, '2-reader.png') });
    return { title, paragraphs: rows, firstLink: links[0], source: await page.textContent('#source-note') };
  });

  await check('search in the transcript highlights matches', async () => {
    const word = (await page.$eval('.transcript-paragraph p', (p) => p.textContent)).split(/\s+/).find((w) => w.replace(/\W/g, '').length >= 4).replace(/\W/g, '');
    await page.fill('#transcript-search', word);
    const count = await page.textContent('#search-count');
    const marks = await page.$$eval('mark', (els) => els.length);
    assert.match(count, /^\d+ passages?$/);
    assert.ok(marks > 0);
    await page.fill('#transcript-search', 'zzzz-not-there');
    assert.match(await page.textContent('.search-empty'), /No passages containing/);
    await page.fill('#transcript-search', '');
    return `"${word}": ${count}, ${marks} highlights`;
  });

  await check('timeline view lists every caption', async () => {
    await page.click('#timeline-view');
    const rows = await page.$$eval('.transcript-paragraph', (els) => els.length);
    const doc = await page.evaluate(async (id) => (await fetch(`/api/library/${id}`)).json(), created[0]);
    assert.equal(rows, doc.segments.length);
    await page.click('#read-view');
    return `${rows} rows`;
  });

  await check('copy puts the full text on the clipboard', async () => {
    await page.click('#copy-button');
    await page.waitForSelector('#toast:not([hidden])');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const doc = await page.evaluate(async (id) => (await fetch(`/api/library/${id}`)).json(), created[0]);
    assert.equal(text, doc.segments.map((s) => s.text).join('\n'));
    return `${text.length} characters`;
  });

  for (const [format, pattern] of [['txt', /\n\n/], ['md', /^# /], ['srt', /^1\n\d{2}:\d{2}:\d{2},\d{3} --> /]]) {
    await check(`export ${format} downloads a file`, async () => {
      const [download] = await Promise.all([page.waitForEvent('download'), page.selectOption('#export-format', format)]);
      const path = join(shots, `export.${format}`);
      const failure = await download.failure();
      if (failure) throw new Error(`download failed: ${failure} (${download.url()})`);
      await download.saveAs(path);
      const text = readFileSync(path, 'utf8');
      assert.match(text, pattern);
      const expected = decodeURIComponent(exportFilename({ title, id: created[0] }, format).split("UTF-8''")[1]);
      assert.equal(download.suggestedFilename(), expected);
      return `${download.suggestedFilename()} (${text.length} bytes)`;
    });
  }

  await check('importing a VTT file adds it to the library', async () => {
    const file = join(shots, 'Browser import.vtt');
    writeFileSync(file, 'WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nImported through the browser.\n');
    await page.setInputFiles('#import-file', file);
    await page.waitForFunction(() => document.querySelector('#reader-title').textContent === 'Browser import');
    created.push(await page.evaluate(() => localStorage.getItem('margin-current')));
    assert.equal(await page.textContent('.transcript-paragraph p'), 'Imported through the browser.');
    assert.equal(await page.$eval('#original-link', (a) => a.hidden), true);
  });

  await check('reload keeps the styling and reopens the current transcript', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#reader:not([hidden])');
    assert.equal(await page.textContent('#reader-title'), 'Browser import');
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).position), 'fixed');
  });

  await check('a new browser profile (browser closed and reopened) still sees the saved transcripts', async () => {
    await context.close();
    context = await newContext();
    page = await context.newPage();
    watch(page);
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('.library-item').length > 0);
    const titles = await page.$$eval('.library-item-title', (els) => els.map((e) => e.textContent));
    assert.ok(titles.includes(title), JSON.stringify(titles));
    assert.ok(titles.includes('Browser import'));
    await page.click(`.library-item[title="${title.replace(/"/g, '\\"')}"]`);
    await page.waitForSelector('#reader:not([hidden])');
    await page.screenshot({ path: join(shots, '3-reopened.png') });
    return `${titles.length} items`;
  });

  await check('narrow screen (400 px) has no sideways scrolling', async () => {
    await page.setViewportSize({ width: 400, height: 860 });
    await page.reload({ waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `overflow ${overflow}px`);
    await page.screenshot({ path: join(shots, '4-narrow.png') });
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await check('removing a transcript in the UI deletes it', async () => {
    await page.goto(base, { waitUntil: 'networkidle' });
    for (const id of created) {
      await page.evaluate((i) => localStorage.setItem('margin-current', i), id);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('#reader:not([hidden])');
      await page.click('#delete-button');
      try { await page.waitForSelector('#reader[hidden]', { state: 'attached', timeout: 10_000 }); }
      catch { throw new Error(`reader still open; toast: ${await page.textContent('#toast')}`); }
      // Checked outside the page, so the expected 404 does not appear in the page console.
      const status = (await page.request.get(new URL(`/api/library/${id}`, base).href, { maxRedirects: 0 })).status();
      assert.equal(status, 404);
    }
    return `${created.length} removed`;
  });

  await check('no script errors in the console', async () => {
    assert.deepEqual(consoleErrors, []);
  });
  await context.close();
} catch (e) {
  results.push({ name: 'harness', ok: false, error: String(e && e.stack) });
  console.log(`FAIL harness - ${e && e.stack}`);
} finally {
  await browser.close();
}
writeFileSync(join(shots, 'browser-results.json'), JSON.stringify(results, null, 2));
writeFileSync(join(shots, 'browser-api-log.txt'), apiLog.join('\n') + '\n');
if (results.some((r) => !r.ok)) console.log('API responses seen by the browser:\n' + apiLog.slice(-25).join('\n'));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
