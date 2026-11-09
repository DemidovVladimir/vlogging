#!/usr/bin/env node
// Isolated fixture tests; no credentials, network calls or production writes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const audit = path.join(path.dirname(fileURLToPath(import.meta.url)), 'audit-public.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tengu-public-audit-'));
const baseline = {
  'index.html': '<html lang="ru"><body>Текущий выпуск</body></html>',
  'en/index.html': '<html lang="en"><body>Current episode</body></html>',
  '404.html': '<html lang="en"><body>404</body></html>',
  '_headers': '/*\n  X-Content-Type-Options: nosniff\n',
  '_redirects': '/ru / 302\n/ru/ / 302\n',
};
function inventory(files) {
  return { files: Object.fromEntries(Object.entries(files).map(([file, value]) => [file, { bytes: Buffer.byteLength(value), sha256: crypto.createHash('sha256').update(value).digest('hex') }])) };
}
let count = 0;
function test(name, change, expected, options = {}) {
  const directory = path.join(temp, String(++count)), pub = path.join(directory, 'public');
  const files = { ...baseline,
    'episodes/attention/index.html': '<html lang="ru"><body>Новый выпуск</body></html>',
    'en/episodes/attention/index.html': '<html lang="en"><body>New episode</body></html>',
  };
  change(files);
  fs.mkdirSync(pub, { recursive: true });
  for (const [file, value] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(pub, file)), { recursive: true });
    fs.writeFileSync(path.join(pub, file), value);
  }
  const manifest = path.join(directory, 'manifest.json'), previous = path.join(directory, 'previous.json');
  fs.writeFileSync(manifest, JSON.stringify(inventory(files)));
  fs.writeFileSync(previous, JSON.stringify(inventory(baseline)));
  options.after?.(pub, manifest);
  const result = spawnSync(process.execPath, [audit, '--public', pub, '--manifest', manifest,
    '--ru', 'episodes/attention/index.html', '--en', options.en || 'en/episodes/attention/index.html',
    '--previous-manifest', previous, ...(options.args || [])], { encoding: 'utf8' });
  assert.equal(result.status === 0, expected, name + '\n' + result.stdout + result.stderr);
  console.log('PASS ' + name);
}
try {
  test('new bilingual episode preserves previous release', () => {}, true);
  test('reject allowlisted private narration', f => { f['episodes/attention/SCRIPT-RU.md'] = 'private'; }, false);
  test('reject allowlisted skill archive', f => { f['assets/tengu-youtube-skill.zip'] = 'private'; }, false);
  test('reject allowlisted private reader', f => { f['episodes/attention/script.html'] = '<html>private</html>'; }, false);
  test('reject unexpected file outside inventory', () => {}, false, { after: pub => fs.writeFileSync(path.join(pub, 'extra.js'), 'unreviewed') });
  test('reject bytes changed after approval', () => {}, false, { after: pub => fs.appendFileSync(path.join(pub, 'index.html'), 'changed') });
  test('reject missing English edition', f => { delete f['en/episodes/attention/index.html']; }, false);
  test('reject wrong English language', f => { f['en/episodes/attention/index.html'] = '<html lang="ru"></html>'; }, false);
  test('reject both languages pointing to one entry', () => {}, false, { en: 'episodes/attention/index.html' });
  test('reject removal of previously published file', f => { delete f['en/index.html']; }, false);
  test('reject unapproved change to old release', f => { f['index.html'] += 'new'; }, false);
  test('allow explicitly enumerated existing-file update', f => { f['index.html'] += 'new'; }, true, { args: ['--allow-change', 'index.html'] });
  test('reject missing real 404', f => { delete f['404.html']; }, false);
  test('reject catch-all SPA fallback', f => { f['_redirects'] += '/* /index.html 200\n'; }, false, { args: ['--allow-change', '_redirects'] });
  test('reject symlinks', () => {}, false, { after: pub => fs.symlinkSync(path.join(pub, 'index.html'), path.join(pub, 'linked.html')) });
  test('reject traversal in manifest', () => {}, false, { after: (_, manifest) => {
    const content = JSON.parse(fs.readFileSync(manifest));
    content.files['../escape.html'] = content.files['index.html'];
    fs.writeFileSync(manifest, JSON.stringify(content));
  } });
  console.log(`PASS: ${count} isolated release-gate cases; production untouched.`);
} finally {
  fs.rmSync(temp, { recursive: true }); // Only this process's mkdtemp fixtures.
}
