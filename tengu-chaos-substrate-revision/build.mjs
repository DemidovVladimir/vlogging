// Stages public/ for EP.05 revision 9: the hash-verified 218-file baseline (previous/, production
// f10900f3-6682-4105-8776-9506d561d077) with the RU and EN Chaos Substrate viewers replaced from an
// explicit allowlist out of ../tengu-chaos-substrate-episode/<lang>/dist. Revision 9 also renames the
// episode (chaos 1.2 removed the Merkle tree): the exact old title becomes the new one in every menu and
// catalog, and the two catalog cards get a new description and art label. Every other byte of every
// other page stays as it is live; the build proves it by undoing the renames. build-manifest.json and
// change-report.json record the result. No network, no private files.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {added, route} from './episodes.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const previous = path.join(root, 'previous'), out = path.join(root, 'public');
const source = path.resolve(root, '../tengu-chaos-substrate-episode');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, b) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, b); };
const once = (text, part) => text.split(part).length - 1;
function swap(where, text, from, to) {
  assert.equal(once(text, from), 1, `Expected one ${JSON.stringify(from.slice(0, 70))} in ${where}`);
  return text.replace(from, to);
}

// --- The baseline: production deployment f10900f3-6682-4105-8776-9506d561d077, as saved in previous/.
const receipt = JSON.parse(read(path.join(previous, 'deployment-record.json')));
assert.equal(receipt.deploymentId, 'f10900f3-6682-4105-8776-9506d561d077', 'Reconcile a newer baseline before rebuilding');
const baseline = JSON.parse(read(path.join(previous, 'build-manifest.json'))).files;
assert.equal(Object.keys(baseline).length, 218);
fs.rmSync(out, {recursive: true, force: true});
for (const [file, meta] of Object.entries(baseline)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(sha(bytes), meta.sha256, 'Baseline drift: ' + file);
  write(path.join(out, file), bytes);
}

// --- The revised viewers. Same allowlist as revision 7: everything the viewer references must be
// on it, and nothing outside the two EP.05 folders may change.
const code = ['index.html', 'app.js', 'journey.js', 'styles.css', 'atlas.css', 'episode.css'];
const fonts = ['literata.ttf', 'manrope-cyrillic.woff2', 'manrope-latin.woff2', 'plex-cyrillic-400.woff2', 'plex-cyrillic-600.woff2', 'plex-latin-400.woff2', 'plex-latin-600.woff2'].map(f => 'assets/fonts/' + f);
const shared = ['field-dark.jpg', 'field-light.jpg', 'serving-people-v18.png', 'tengu-kaiju-complete-v33.png', 'tengu-kaiju-v23.png', 'tengu-mark-simplified.svg', 'tengu-robot-v23.png'].map(f => 'assets/' + f);
const own = {
  ru: ['tengu-logo-sting.mp4', 'tengu-logo-sting-poster.png', 'tengu-wordmark-horizontal.svg'],
  en: ['tengu-logo-sting-en.mp4', 'tengu-logo-sting-poster-en.png', 'tengu-wordmark-horizontal-en.svg'],
};
const licenses = ['IBMPlexMono-OFL.txt', 'Literata-OFL.txt', 'Manrope-OFL.txt'].map(f => 'licenses/' + f);
const privateMarks = ['script.html', 'SCRIPT-', 'STORY-PLAN', 'SOURCES.md', 'localhost', '127.0.0.1', '/Users/', '/private/', 'scriptContent', 'Career.md', 'Profile.md', 'Molecule'];
const touched = [];

// --- Revision 9: the new title everywhere the old one stood, and the catalog cards.
const titles = [
  ['Chaos Substrate: память кода и дерево Меркла', 'Chaos Substrate: память кода без дерева Меркла'],
  ['Chaos Substrate: code memory and the Merkle tree', 'Chaos Substrate: code memory without a Merkle tree'],
];
const retitle = t => titles.reduce((x, [from, to]) => x.split(from).join(to), t);
const untitle = t => titles.reduce((x, [from, to]) => x.split(to).join(from), t);
const cards = {
  'index.html': [
    ['<p>Как агент отвечает на вопросы о коде по индексу, а не перечитывая файлы, — и как дерево Меркла показывает, что изменилось и что уже известно.</p>',
     '<p>Как агент отвечает на вопросы о коде по индексу, а не перечитывая файлы, — и почему каждому результату хватает хеша своего входа, без дерева Меркла.</p>'],
    ['<span>MERKLE ROOT</span><strong>chaos add</strong>', '<span>ХЕШ ВХОДА</span><strong>chaos add</strong>'],
  ],
  'en/index.html': [
    ['<p>How an agent answers questions about code from an index instead of rereading files, and how a Merkle tree shows what changed and what is already known.</p>',
     '<p>How an agent answers questions about code from an index instead of rereading files, and why each result needs only the hash of its own input, not a Merkle tree.</p>'],
    ['<span>MERKLE ROOT</span><strong>chaos add</strong>', '<span>INPUT HASH</span><strong>chaos add</strong>'],
  ],
};

for (const lang of ['ru', 'en']) {
  const dist = path.join(source, lang, 'dist');
  const meta = JSON.parse(read(path.join(source, lang, 'episode.json')));
  assert.equal(meta.status, 'ready', lang + ' edition is not marked ready');
  assert.equal(meta.copiedReferenceContent, false);
  assert.equal(meta.slug, added.slug);
  const assets = [...fonts, ...shared, ...own[lang].map(f => 'assets/' + f)];
  const text = Object.fromEntries(code.map(f => [f, read(path.join(dist, f))]));
  const referenced = new Set(Object.values(text).flatMap(t => t.match(/assets\/[A-Za-z0-9_./-]+\.[a-z0-9]+/g) || []));
  assert.deepEqual([...referenced].sort(), [...assets].sort(), lang + ' viewer references differ from the allowlist');
  for (const [f, t] of Object.entries(text)) for (const mark of privateMarks) assert(!t.includes(mark), `${mark} in ${lang}/${f}`);

  const dir = route(lang, added.slug).slice(1);
  const put = (rel, bytes) => { assert(baseline[dir + rel], 'Not in the baseline: ' + dir + rel); write(path.join(out, dir, rel), bytes); touched.push(dir + rel); };
  for (const f of [...assets, ...code.slice(1)]) put(f, fs.readFileSync(path.join(dist, f)));
  for (const f of licenses) put(f, fs.readFileSync(path.join(source, lang, f)));

  // Navigation envelope from the live EP.05 viewer itself: nothing to re-point.
  const live = read(path.join(previous, 'public', dir, 'index.html'));
  const headPart = live.match(/<link rel="stylesheet" href="\/site\/site\.css[^"]*"><script>[^<]*<\/script>(?=<\/head>)/)?.[0];
  const liveNav = live.match(/<nav class="site-nav"[^]*?<script src="\/site\/site\.js[^"]*"><\/script>(?=<\/body>)/)?.[0];
  assert(headPart && liveNav, 'No navigation envelope in the live EP.05 ' + lang + ' viewer');
  const navPart = retitle(liveNav);
  assert.notEqual(navPart, liveNav, 'The EP.05 ' + lang + ' menu lost its old title');
  assert.equal(once(navPart, 'aria-current="page"'), 1);

  const v = f => `${f}?v=${sha(fs.readFileSync(path.join(dist, f))).slice(0, 12)}`;
  let html = text['index.html'];
  html = swap(lang + ' index', html, '<link rel="stylesheet" href="episode.css">', `<link rel="stylesheet" href="${v('episode.css')}">`);
  html = swap(lang + ' index', html, '<script src="journey.js"></script>', `<script src="${v('journey.js')}"></script>`);
  html = swap(lang + ' index', html, '<script src="app.js"></script>', `<script src="${v('app.js')}"></script>`);
  html = swap(lang + ' index', html, '</head>', headPart + '</head>');
  html = swap(lang + ' index', html, '</body>', navPart + '</body>');
  assert(html.startsWith(`<!doctype html>\n<html lang="${lang}">`), 'Language tag ' + lang);
  assert(html.includes(`<link rel="canonical" href="https://tengucluster.com${route(lang, added.slug)}">`), 'Canonical ' + lang);
  // The envelope must come out exactly as it is live.
  const strip = h => h.match(/<nav class="site-nav"[^]*?<script src="\/site\/site\.js[^"]*"><\/script>(?=<\/body>)/)[0];
  assert.equal(strip(html), navPart);
  put('index.html', html);
}

// --- Every other page: the old title out, the new one in; the catalog cards.
const ep05 = ['ru', 'en'].map(lang => route(lang, added.slug).slice(1));
const renamed = [];
for (const file of Object.keys(baseline).filter(f => f.endsWith('.html') && !ep05.some(d => f.startsWith(d)))) {
  const before = read(path.join(out, file));
  let after = retitle(before);
  for (const [from, to] of cards[file] || []) after = swap(file, after, from, to);
  if (after === before) continue;
  write(path.join(out, file), after);
  renamed.push(file);
}
assert.deepEqual(Object.keys(cards).filter(f => !renamed.includes(f)), [], 'A catalog card was not found');

// --- Inventory: same file list as the baseline; outside the EP.05 viewers only the renames may differ.
const walk = (dir, prefix = '') => fs.readdirSync(dir).flatMap(n => {
  const s = fs.lstatSync(path.join(dir, n)); assert(!s.isSymbolicLink());
  return s.isDirectory() ? walk(path.join(dir, n), prefix + n + '/') : [prefix + n];
}).sort();
assert.deepEqual(walk(out), Object.keys(baseline).sort(), 'Unexpected staging file: review before publishing');
const inventory = Object.fromEntries(Object.keys(baseline).sort().map(f => { const b = fs.readFileSync(path.join(out, f)); return [f, {bytes: b.length, sha256: sha(b)}]; }));
const changed = Object.keys(baseline).filter(f => inventory[f].sha256 !== baseline[f].sha256).sort();
for (const f of changed.filter(f => !ep05.some(d => f.startsWith(d)))) {
  assert(renamed.includes(f), 'Change outside EP.05: ' + f);
  let back = untitle(read(path.join(out, f)));
  for (const [from, to] of cards[f] || []) back = swap(f, back, to, from);
  assert.equal(sha(Buffer.from(back)), baseline[f].sha256, 'More than the renames changed in ' + f);
}
write(path.join(root, 'build-manifest.json'), JSON.stringify({builtAt: new Date().toISOString(), baselineDeploymentId: receipt.deploymentId, files: inventory}, null, 2) + '\n');
const report = {changed, added: [], preserved: Object.keys(baseline).length - changed.length, rewrittenUnchanged: touched.filter(f => !changed.includes(f)).length};
write(path.join(root, 'change-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Built ${Object.keys(inventory).length} public files: ${changed.length} changed (EP.05 RU+EN viewers, plus the new title in ${renamed.length} menus and catalogs), ${report.preserved} unchanged.`);
console.log(changed.join('\n'));
