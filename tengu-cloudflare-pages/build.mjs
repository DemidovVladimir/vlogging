// Public viewer bundle only. Never publish the original deck's dist/ directory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(root, '../tengu-agent-context-deck');
const output = path.join(root, 'public');
const originArg = process.argv.indexOf('--origin');
if (originArg < 0 || !process.argv[originArg + 1]) {
  throw new Error('Usage: node build.mjs --origin https://YOUR-PROJECT.pages.dev');
}
const url = new URL(process.argv[originArg + 1]);
assert(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/', 'Expected a plain HTTPS origin');
const origin = url.origin;
const viewers = ['index.html', 'app.js', 'journey.js', 'styles.css', 'atlas.css', 'en/index.html', 'en/app.js', 'en/journey.js'];
// Explicit allowlist: no wildcard copying of source directories.
const assets = [
  'tengu-mark-simplified.svg', 'tengu-wordmark-horizontal.svg', 'tengu-wordmark-horizontal-en.svg',
  'tengu-kaiju-v23.png', 'tengu-robot-v23.png', 'tengu-kaiju-complete-v33.png',
  'ceramics-study-v32.png', 'field-light.jpg', 'field-dark.jpg', 'serving-people-v18.png',
  'tengu-logo-sting.mp4', 'tengu-logo-sting-en.mp4',
  'tengu-logo-sting-poster.png', 'tengu-logo-sting-poster-en.png',
  'fonts/manrope-cyrillic.woff2', 'fonts/manrope-latin.woff2',
  'fonts/plex-cyrillic-400.woff2', 'fonts/plex-cyrillic-600.woff2',
  'fonts/plex-latin-400.woff2', 'fonts/plex-latin-600.woff2', 'fonts/literata.ttf',
].map(file => 'assets/' + file);
const licenses = ['Manrope-OFL.txt', 'IBMPlexMono-OFL.txt', 'Literata-OFL.txt'].map(file => 'licenses/' + file);
const generated = ['404.html', '_headers', '_redirects'];
const allowed = [...viewers, ...assets, ...licenses, ...generated].sort();
const sha = data => crypto.createHash('sha256').update(data).digest('hex');

function filesIn(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  assert(!fs.lstatSync(dir).isSymbolicLink(), 'No symlink directories: ' + dir);
  return fs.readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name), rel = prefix + name, stat = fs.lstatSync(full);
    assert(!stat.isSymbolicLink(), 'No symlinks: ' + rel);
    return stat.isDirectory() ? filesIn(full, rel + '/') : [rel];
  }).sort();
}
// Refuse unexpected files instead of silently uploading or deleting them.
for (const file of filesIn(output)) assert(allowed.includes(file), 'Unexpected public file; review manually: ' + file);

// Verify the approved source before copying it; this guard never rewrites its lock.
execFileSync(process.execPath, [path.join(source, 'tests/frozen-ru.cjs')], { stdio: 'inherit' });
const buffers = new Map();
for (const file of [...viewers, ...assets, ...licenses]) {
  const input = path.join(source, licenses.includes(file) ? file : 'dist/' + file);
  assert(fs.lstatSync(input).isFile(), 'Not a regular source file: ' + file);
  let data = fs.readFileSync(input);
  if (file.endsWith('.html')) {
    const original = data.toString('utf8');
    const english = file.startsWith('en/');
    const pageUrl = origin + (english ? '/en/' : '/');
    const poster = origin + '/assets/tengu-logo-sting-poster' + (english ? '-en' : '') + '.png';
    const html = original
      .replace(/(<meta property="og:url" content=")[^"]+("\s*>)/, `$1${pageUrl}$2`)
      .replace(/(<meta property="og:image" content=")[^"]+("\s*>)/, `$1${poster}$2`);
    assert.equal(html.split('<body>')[1], original.split('<body>')[1], 'Viewer body must remain unchanged');
    data = Buffer.from(html);
  }
  buffers.set(file, data);
}
// A real 404 disables Pages' implicit SPA fallback. Missing private paths stay 404.
buffers.set('404.html', Buffer.from(`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>TENGU — 404</title>
<style>body{margin:0;min-height:100vh;display:grid;place-content:center;background:#11110f;color:#e9dfc9;font:18px system-ui;text-align:center}a{color:#e9dfc9;margin:0 1rem}h1{color:#c92f20}</style>
<h1>404</h1><p>Страница не найдена / Page not found</p><nav><a href="/">Русский</a><a href="/en/">English</a></nav></html>\n`));
buffers.set('_headers', Buffer.from('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n'));
buffers.set('_redirects', Buffer.from('/ru / 302\n/ru/ / 302\n'));

for (const [file, data] of buffers) {
  assert(data.length < 25 * 1024 * 1024, 'Pages file limit exceeded: ' + file);
  if (/\.(html|css|js|svg)$/.test(file)) {
    const text = data.toString('utf8');
    assert(!/\/Users\/|sourceMappingURL|candygiant32\.chatgpt\.site/.test(text), 'Private path or stale origin: ' + file);
    const refs = file.endsWith('.html')
      ? [...text.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)].map(m => m[1])
      : file.endsWith('.css') ? [...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(m => m[1]) : [];
    for (const ref of refs) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
      const clean = ref.split(/[?#]/)[0];
      let resolved = path.posix.normalize(clean.startsWith('/') ? clean.slice(1) : path.posix.join(path.posix.dirname(file), clean));
      if (resolved === '.' || resolved.endsWith('/')) resolved = (resolved === '.' ? '' : resolved) + 'index.html';
      assert(buffers.has(resolved), `Missing or non-public reference: ${file} → ${ref} (${resolved})`);
    }
  }
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
}
assert.deepEqual(filesIn(output), allowed, 'Public inventory must exactly match the allowlist');
const manifest = {
  origin, builtAt: new Date().toISOString(),
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim(),
  sourceVersions: { ru: 33, en: 34 },
  files: Object.fromEntries([...buffers].sort(([a], [b]) => a.localeCompare(b)).map(([file, data]) => [file, { bytes: data.length, sha256: sha(data) }])),
};
// Deployment records deliberately live outside the uploaded directory.
fs.writeFileSync(path.join(root, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`PASS: ${allowed.length} allowlisted public files, ${(Object.values(manifest.files).reduce((n, f) => n + f.bytes, 0) / 1024 / 1024).toFixed(1)} MiB.`);
console.log('Excluded: narration, director plans, skill packages, source history and private documents.');
console.log('Public output: ' + output);
