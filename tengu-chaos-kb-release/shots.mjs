// Page images from the chaos-kb exercise: each to-do site gets the same three tasks, the first
// one done, and is saved as pages/assets/<name>.jpg (720×470 at 2×, JPEG). Private tool; only
// pages/assets/*.jpg ship.
// Usage: PLAYWRIGHT_DIR=<node_modules/playwright> node shots.mjs <site index.html> <name> [<html> <name> …]
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_DIR);
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pages', 'assets');
const pairs = process.argv.slice(2);
const browser = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true});
for (let i = 0; i < pairs.length; i += 2) {
  const [site, name] = [pairs[i], pairs[i + 1]];
  const page = await browser.newPage({viewport: {width: 720, height: 470}, deviceScaleFactor: 2});
  await page.goto(pathToFileURL(path.resolve(site)).href);
  const field = page.locator('input[type=text]:visible, input:not([type]):visible, textarea:visible').first();
  for (const task of ['Change the engine oil', 'Renew the passport', 'Call mum on Sunday']) {
    await field.fill(task); await field.press('Enter'); await page.waitForTimeout(200);
  }
  const row = page.locator('li', {hasText: 'Change the engine oil'}).first();
  const box = row.locator('input[type=checkbox], [role=checkbox], button[aria-label*="toggle" i], button[aria-label*="done" i], button[aria-label*="complete" i], button[title*="toggle" i]').first();
  if (await box.count()) await box.click(); else await row.getByText('Change the engine oil').click();
  await page.mouse.move(0, 0); await page.waitForTimeout(500);
  const file = path.join(out, `${name}.jpg`);
  await page.screenshot({path: file, type: 'jpeg', quality: 82});
  console.log(file, await row.evaluate(li => li.className || li.getAttribute('aria-checked') || ''));
  await page.close();
}
await browser.close();
