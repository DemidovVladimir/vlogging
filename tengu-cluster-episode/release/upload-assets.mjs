// Upload only the audited public allowlist with a short-lived Pages JWT on stdin.
// Protocol/hash: Cloudflare workers-sdk, Wrangler 4.151.3, pages/upload.ts and deploy-helpers.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import readline from 'node:readline';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const build = JSON.parse(fs.readFileSync(path.join(root, 'build-manifest.json'), 'utf8'));
assert(process.env.TENGU_BLAKE3_PATH, 'Set TENGU_BLAKE3_PATH to the installed blake3-wasm package directory');
const require = createRequire(import.meta.url);
const blake3 = require(process.env.TENGU_BLAKE3_PATH);
const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain' };
function list(dir, prefix = '') {
  assert(!fs.lstatSync(dir).isSymbolicLink());
  return fs.readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name), rel = prefix + name, stat = fs.lstatSync(full);
    assert(!stat.isSymbolicLink());
    return stat.isDirectory() ? list(full, rel + '/') : [rel];
  }).sort();
}
assert.deepEqual(list(publicDir), Object.keys(build.files).sort(), 'Unexpected public file: rebuild and review before uploading');
const files = Object.entries(build.files).map(([file, expected]) => {
  const data = fs.readFileSync(path.join(publicDir, file));
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'), expected.sha256, file + ' changed after audit');
  const extension = path.extname(file);
  const value = data.toString('base64');
  return { file, size: data.length, key: blake3.hash(value + extension.slice(1)).toString('hex').slice(0, 32), value, metadata: { contentType: mimeTypes[extension] || 'application/octet-stream' }, base64: true };
}).filter(x => !['_headers', '_redirects'].includes(x.file));
assert(files.length === 85, 'The reviewed bilingual public inventory changed');

console.log('READY_FOR_UPLOAD_TOKEN (stdin only; no token is logged or saved)');
const input = readline.createInterface({ input: process.stdin, terminal: false });
let jwt;
for await (const line of input) { jwt = JSON.parse(line).jwt; break; }
input.close();
assert(typeof jwt === 'string' && jwt.split('.').length === 3, 'Expected short-lived Pages upload JWT');
async function api(endpoint, body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch('https://api.cloudflare.com/client/v4/pages/assets/' + endpoint, {
      method: 'POST', redirect: 'error',
      headers: { Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
    });
    const result = await response.json();
    if (response.ok && result.success) return result.result;
    if (response.status >= 500 && attempt < 2) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    throw new Error(`Pages ${endpoint}: HTTP ${response.status}; codes ${(result.errors || []).map(e => e.code).join(',')}`);
  }
}
const missing = new Set(await api('check-missing', { hashes: files.map(f => f.key) }));
const pending = files.filter(f => missing.has(f.key));
// Small batches keep memory bounded and avoid oversized requests.
let bucket = [], bytes = 0, uploaded = 0;
async function flush() {
  if (!bucket.length) return;
  await api('upload', bucket.map(({ key, value, metadata, base64 }) => ({ key, value, metadata, base64 })));
  uploaded += bucket.length;
  console.log(`Uploaded ${uploaded}/${pending.length} assets`);
  bucket = []; bytes = 0;
}
for (const file of pending) {
  if (bytes + file.size > 5 * 1024 * 1024) await flush();
  bucket.push(file); bytes += file.size;
}
await flush();
await api('upsert-hashes', { hashes: files.map(f => f.key) });
jwt = undefined;
const manifest = Object.fromEntries(files.map(f => ['/' + f.file, f.key]));
fs.writeFileSync(path.join(root, 'upload-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('PASS: public assets uploaded; upload-manifest.json saved outside public/.');
