#!/usr/bin/env node
// Read-only release gate. A reviewed allowlist is still required; no upload/auth.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node audit-public.mjs --public DIR --manifest FILE --ru PATH --en PATH [--previous-manifest FILE] [--allow-change PATH ...]');
  process.exit(0);
}
const options = {}, changes = new Set();
for (let i = 0; i < args.length; i += 2) {
  const key = args[i], value = args[i + 1];
  assert(['--public', '--manifest', '--ru', '--en', '--previous-manifest', '--allow-change'].includes(key), 'Unknown argument: ' + key);
  assert(value && !value.startsWith('--'), 'Missing value for ' + key);
  if (key === '--allow-change') changes.add(value);
  else { assert(!options[key], 'Duplicate argument: ' + key); options[key] = value; }
}
for (const key of ['--public', '--manifest', '--ru', '--en']) assert(options[key], 'Required ' + key);
const root = path.resolve(options['--public']);
assert(fs.lstatSync(root).isDirectory() && !fs.lstatSync(root).isSymbolicLink(), 'Public root must be a regular directory');
const extensions = new Set(['.html', '.css', '.js', '.mjs', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.woff2', '.woff', '.ttf', '.otf', '.ico']);

function safePath(file) {
  assert(typeof file === 'string' && file && !path.posix.isAbsolute(file) && !/[\\:%?#\x00-\x1f]/.test(file), 'Unsafe path: ' + file);
  assert(file.split('/').every(p => p && !p.startsWith('.')), 'Hidden/relative path: ' + file);
  assert.equal(path.posix.normalize(file), file, 'Noncanonical path: ' + file);
  const lower = file.toLowerCase(), base = path.posix.basename(lower);
  assert(!/(^|\/)(?:skills?|scripts?|notes|qa|node_modules|references|private|assets\/source)(\/|$)/.test(lower), 'Private directory: ' + file);
  assert(!/^(?:script(?:[-.]|$)|story-plan|skill(?:[-.]|$)|readme|sources|technical-handoff|recording-guide|build-manifest|upload-manifest|deployment-record|episode\.json)/.test(base), 'Private document: ' + file);
  if (['_headers', '_redirects'].includes(file)) return;
  if (path.posix.extname(lower) === '.txt') {
    assert(/(^|\/)licenses\//.test(lower) && /(?:license|ofl)/.test(base), 'Only font/license text may be public: ' + file);
  } else assert(extensions.has(path.posix.extname(lower)), 'Unreviewed file type: ' + file);
}
function walk(directory, prefix = '') {
  const result = [];
  for (const name of fs.readdirSync(directory)) {
    const full = path.join(directory, name), relative = prefix + name, stat = fs.lstatSync(full);
    assert(!stat.isSymbolicLink(), 'No symlinks: ' + relative);
    if (stat.isDirectory()) result.push(...walk(full, relative + '/'));
    else { assert(stat.isFile(), 'Not a regular file: ' + relative); result.push(relative); }
  }
  return result.sort();
}
function readManifest(filename) {
  const resolved = path.resolve(filename);
  assert(resolved !== root && !resolved.startsWith(root + path.sep), 'Inventory must remain outside public/');
  const stat = fs.lstatSync(resolved);
  assert(stat.isFile() && !stat.isSymbolicLink(), 'Manifest must be a regular file');
  const manifest = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  assert(manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files), 'Expected files inventory');
  for (const [file, metadata] of Object.entries(manifest.files)) {
    safePath(file);
    assert(Number.isSafeInteger(metadata.bytes) && metadata.bytes >= 0 && /^[a-f0-9]{64}$/.test(metadata.sha256), 'Invalid audit metadata: ' + file);
  }
  return manifest.files;
}
const files = readManifest(options['--manifest']);
assert.deepEqual(walk(root), Object.keys(files).sort(), 'Public tree differs from reviewed allowlist');
for (const required of ['404.html', '_headers', '_redirects']) assert(Object.hasOwn(files, required), 'Missing root hosting file: ' + required);
for (const [file, metadata] of Object.entries(files)) {
  const bytes = fs.readFileSync(path.join(root, file));
  assert(bytes.length <= 25 * 1024 * 1024, 'Review Pages per-file limit: ' + file);
  assert.equal(bytes.length, metadata.bytes, 'Size changed: ' + file);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), metadata.sha256, 'Hash changed: ' + file);
  if (/\.(html|css|[mc]?js|svg)$/.test(file)) {
    const text = bytes.toString('utf8');
    assert(!/sourceMappingURL|(?:file:\/\/|\/Users\/|[A-Z]:\\Users\\)|(?:SCRIPT-(?:RU|EN)|STORY-PLAN-(?:RU|EN)|SKILL)\.md/i.test(text), 'Private/local reference: ' + file);
    assert(!/\b(?:href|src)\s*=\s*["'][^"']*\bscript\.html/i.test(text), 'Public script-reader link: ' + file);
  }
}
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
for (const line of redirects.split(/\r?\n/).filter(x => x.trim() && !x.trim().startsWith('#'))) {
  assert(!/^\/\*\s+\S+\s+200\b/.test(line.trim()), 'Catch-all SPA rewrite would mask private-path 404s');
}
assert.notEqual(options['--ru'], options['--en'], 'RU and EN need separate entry points');
for (const lang of ['ru', 'en']) {
  const entry = options['--' + lang]; safePath(entry);
  assert(Object.hasOwn(files, entry) && (entry.endsWith('/index.html') || entry === 'index.html'), 'Missing entry: ' + entry);
  const html = fs.readFileSync(path.join(root, entry), 'utf8');
  assert(new RegExp('<html\\b[^>]*\\blang=["\']' + lang + '["\']', 'i').test(html), 'Wrong HTML language: ' + entry);
}
if (options['--previous-manifest']) {
  const previous = readManifest(options['--previous-manifest']);
  for (const file of changes) assert(Object.hasOwn(previous, file), 'Allowed change is not in baseline: ' + file);
  for (const [file, metadata] of Object.entries(previous)) {
    assert(Object.hasOwn(files, file), 'Previous file would be removed: ' + file);
    if (!changes.has(file)) assert.equal(files[file].sha256, metadata.sha256, 'Previous file changed without explicit authorization: ' + file);
  }
} else assert(changes.size === 0, '--allow-change requires a previous manifest');
console.log(JSON.stringify({ status: 'PASS', files: Object.keys(files).length, ru: options['--ru'], en: options['--en'], previousFilesPreserved: Boolean(options['--previous-manifest']), authorizedChanges: [...changes], uploaded: false, note: 'Inventory gate only. Review content and complete browser/live privacy QA before declaring a release.' }, null, 2));
