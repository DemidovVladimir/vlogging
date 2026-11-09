// Stages public/ for the EP.04 chaos-kb guide revision of 28.10.2026: the hash-verified 218-file
// baseline (previous/, production c2577349-a8bd-49ee-b455-d0172b047ca8) with the RU and EN guide pages
// re-rendered from content.mjs. chaos-kb 2.1 puts the notes back when the index cannot follow, the
// Claude Code exercise without the CLAUDE.md line was repeated, and 2.1.1 lets kb_read take `id`, so the
// guide says so (see content.mjs).
// Before anything changes, the same renderer with content-live.mjs must give the live pages byte for
// byte, so the only difference is the words. guide.css, guide.js, the images and every other page stay
// as they are live. build-manifest.json and change-report.json record the result. No network.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {route} from './episodes.mjs';
import {guide} from './render.mjs';
import * as live from './content-live.mjs';
import * as revised from './content.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const previous = path.join(root, 'previous'), out = path.join(root, 'public');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, b) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, b); };
const once = (text, part) => text.split(part).length - 1;

// --- The baseline: production deployment c2577349-a8bd-49ee-b455-d0172b047ca8, as saved in previous/.
const receipt = JSON.parse(read(path.join(previous, 'deployment-record.json')));
assert.equal(receipt.deploymentId, 'c2577349-a8bd-49ee-b455-d0172b047ca8', 'Reconcile a newer baseline before rebuilding');
const baseline = JSON.parse(read(path.join(previous, 'build-manifest.json'))).files;
assert.equal(Object.keys(baseline).length, 218);
fs.rmSync(out, {recursive: true, force: true});
for (const [file, meta] of Object.entries(baseline)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(sha(bytes), meta.sha256, 'Baseline drift: ' + file);
  write(path.join(out, file), bytes);
}

const pages = [];
for (const lang of ['ru', 'en']) {
  const dir = route(lang, 'chaos-kb').slice(1);
  const file = dir + 'index.html';
  const livePage = read(path.join(previous, 'public', file));
  // The page's own assets keep their bytes, so their cache keys stay.
  const own = Object.fromEntries(['guide.css', 'guide.js'].map(name => [name, `${name}?v=${sha(fs.readFileSync(path.join(out, dir, name))).slice(0, 12)}`]));
  for (const ref of Object.values(own)) assert.equal(once(livePage, `"${ref}"`), 1, `${file} does not reference ${ref}`);
  // Navigation envelope from the live page itself: the menu already carries 05 and its current title.
  const headPart = livePage.match(/<link rel="stylesheet" href="\/site\/site\.css[^"]*"><script>[^<]*<\/script>(?=<\/head>)/)?.[0];
  const navPart = livePage.match(/<nav class="site-nav"[^]*?<script src="\/site\/site\.js[^"]*"><\/script>(?=<\/body>)/)?.[0];
  assert(headPart && navPart, 'No navigation envelope in the live ' + file);
  assert.equal(once(navPart, 'aria-current="page"'), 1);
  const page = content => {
    const html = guide(lang, {css: own['guide.css'], js: own['guide.js']}, content);
    assert.equal(once(html, '</head>'), 1); assert.equal(once(html, '</body>'), 1);
    return html.replace('</head>', headPart + '</head>').replace('</body>', navPart + '</body>');
  };
  assert.equal(page(live), livePage, 'content-live.mjs no longer renders the live ' + file);
  const html = page(revised);
  assert.notEqual(html, livePage);
  // The guide's own words; the shared menu legitimately names EP.05 "…without a Merkle tree".
  const words = html.replace(navPart, '');
  for (const bad of ['Merkle', 'Меркл', '"root"', '59f41e6f5ce1579a70434a1c0c27fcfb021c4e420aac090b8b97a627063b775b', '48fc721fbbc172e0925fa27af1671de225ba927134802998b10a1568a188652b', '/Users/', '/private/', 'Career.md', 'Profile.md', 'Molecule', 'ed73a5e0c80651cf6f8c19b8e8c3942186a5f109', 'ecee6f4609326a64524daf476aee9c7b037c7edd', 'всё же меняют заметку', 'still change the note', 'мы опыт с тех пор не повторяли', 'have not repeated the exercise'])
    assert(!words.includes(bad), `${bad} in ${file}`);
  for (const img of html.match(/assets\/[a-z0-9-]+\.jpg/g)) assert(baseline[dir + img], 'Image not in the baseline: ' + dir + img);
  write(path.join(out, file), html);
  pages.push(file);
}

// --- Inventory: the same file list as the baseline; only the two guide pages may differ.
const walk = (dir, prefix = '') => fs.readdirSync(dir).flatMap(n => {
  const s = fs.lstatSync(path.join(dir, n)); assert(!s.isSymbolicLink());
  return s.isDirectory() ? walk(path.join(dir, n), prefix + n + '/') : [prefix + n];
}).sort();
assert.deepEqual(walk(out), Object.keys(baseline).sort(), 'Unexpected staging file: review before publishing');
const inventory = Object.fromEntries(Object.keys(baseline).sort().map(f => { const b = fs.readFileSync(path.join(out, f)); return [f, {bytes: b.length, sha256: sha(b)}]; }));
const changed = Object.keys(baseline).filter(f => inventory[f].sha256 !== baseline[f].sha256).sort();
assert.deepEqual(changed, [...pages].sort(), 'Only the two guide pages may change');
write(path.join(root, 'build-manifest.json'), JSON.stringify({builtAt: new Date().toISOString(), baselineDeploymentId: receipt.deploymentId, files: inventory}, null, 2) + '\n');
const report = {changed, added: [], preserved: Object.keys(baseline).length - changed.length};
write(path.join(root, 'change-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Built ${Object.keys(inventory).length} public files: ${changed.length} changed (the RU and EN guide), ${report.preserved} unchanged.`);
console.log(changed.join('\n'));
