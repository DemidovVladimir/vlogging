// Stages public/ for the EP.05 release: the hash-verified 166-file baseline (previous/, production
// d19c7d06-0851-432f-b55a-354fcfde01eb), the RU and EN Chaos Substrate presentation copied from an
// explicit allowlist out of ../tengu-chaos-substrate-episode/<lang>/dist, the 05 entry at the top of
// every viewer's menu and both catalogs. Old viewers change only by that one <li>; build-manifest.json
// and change-report.json record the result. No network, no private files.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {episodes, published, added, route} from './episodes.mjs';
import {catalog} from './catalog.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const previous = path.join(root, 'previous'), out = path.join(root, 'public');
const source = path.resolve(root, '../tengu-chaos-substrate-episode');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, b) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, b); };
const once = (text, part) => text.split(part).length - 1;
function swap(where, text, from, to) {
  assert.equal(once(text, from), 1, `Expected one ${JSON.stringify(from.slice(0, 70))} in ${where}`);
  return text.replace(from, to);
}

// --- The baseline: production deployment d19c7d06-0851-432f-b55a-354fcfde01eb, as saved in previous/.
const receipt = JSON.parse(read(path.join(previous, 'deployment-record.json')));
assert.equal(receipt.deploymentId, 'd19c7d06-0851-432f-b55a-354fcfde01eb', 'Reconcile a newer baseline before rebuilding');
const baseline = JSON.parse(read(path.join(previous, 'build-manifest.json'))).files;
assert.equal(Object.keys(baseline).length, 166);
fs.rmSync(out, {recursive: true, force: true});
for (const [file, meta] of Object.entries(baseline)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(sha(bytes), meta.sha256, 'Baseline drift: ' + file);
  write(path.join(out, file), bytes);
}
// The shared navigation assets stay as they are; their cache keys are their own hashes.
const key = file => `/${file}?v=${sha(fs.readFileSync(path.join(out, file))).slice(0, 12)}`;
const siteCss = key('site/site.css'), siteJs = key('site/site.js'), catalogCss = key('site/catalog.css');
assert.deepEqual([siteCss, siteJs, catalogCss], ['/site/site.css?v=73d767bccc32', '/site/site.js?v=45a08ed50593', '/site/catalog.css?v=31ea4a685ecf']);

// --- Menus. The item markup is the one tengu-site-navigation generated; checked against every viewer.
const item = (lang, ep, current) => `<li><a href="${route(lang, ep.slug)}"${current ? ' aria-current="page"' : ''}><b>${ep.id}</b><span><small>${esc(ep[lang].topic)}</small><strong>${esc(ep[lang].title)}</strong></span><span aria-hidden="true">↗</span></a></li>`;
const list = (lang, items, slug) => `<ol class="episode-menu__list">${items.map(ep => item(lang, ep, ep.slug === slug)).join('')}</ol>`;
const changed = [];
for (const lang of ['ru', 'en']) for (const ep of published) {
  const file = route(lang, ep.slug).slice(1) + 'index.html';
  const old = read(path.join(out, file));
  const html = swap(file, old, list(lang, published, ep.slug), list(lang, episodes, ep.slug));
  assert.equal(html.replace(item(lang, added, false), ''), old, 'More than the 05 item changed in ' + file);
  write(path.join(out, file), html); changed.push(file);
}

// --- The new viewers. Public files are an allowlist; everything the viewer references must be on
// it and everything on it (except the font licenses) must be referenced.
const files = new Set(Object.keys(baseline));
const code = ['index.html', 'app.js', 'journey.js', 'styles.css', 'atlas.css', 'episode.css'];
const fonts = ['literata.ttf', 'manrope-cyrillic.woff2', 'manrope-latin.woff2', 'plex-cyrillic-400.woff2', 'plex-cyrillic-600.woff2', 'plex-latin-400.woff2', 'plex-latin-600.woff2'].map(f => 'assets/fonts/' + f);
const shared = ['field-dark.jpg', 'field-light.jpg', 'serving-people-v18.png', 'tengu-kaiju-complete-v33.png', 'tengu-kaiju-v23.png', 'tengu-mark-simplified.svg', 'tengu-robot-v23.png'].map(f => 'assets/' + f);
const own = {
  ru: ['tengu-logo-sting.mp4', 'tengu-logo-sting-poster.png', 'tengu-wordmark-horizontal.svg'],
  en: ['tengu-logo-sting-en.mp4', 'tengu-logo-sting-poster-en.png', 'tengu-wordmark-horizontal-en.svg'],
};
const licenses = ['IBMPlexMono-OFL.txt', 'Literata-OFL.txt', 'Manrope-OFL.txt'].map(f => 'licenses/' + f);
const privateMarks = ['script.html', 'SCRIPT-', 'STORY-PLAN', 'SOURCES.md', 'localhost', '127.0.0.1', '/Users/', '/private/', 'scriptContent'];
const donorSlug = 'tengu-cluster'; // EP.02: the same presentation runtime, already carrying 05 in its menu.
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
  const put = (rel, bytes) => { write(path.join(out, dir, rel), bytes); files.add(dir + rel); };
  for (const f of [...assets, ...code.slice(1)]) put(f, fs.readFileSync(path.join(dist, f)));
  for (const f of licenses) put(f, fs.readFileSync(path.join(source, lang, f)));

  // The viewer inherits the navigation envelope of EP.02: the head snippet and everything from
  // <nav class="site-nav"> to site.js, with the current item and the language link moved to 05.
  const donor = read(path.join(out, route(lang, donorSlug).slice(1) + 'index.html'));
  const headPart = donor.match(/<link rel="stylesheet" href="\/site\/site\.css[^"]*"><script>[^<]*<\/script>(?=<\/head>)/)?.[0];
  const navPart = donor.match(/<nav class="site-nav"[^]*?<script src="\/site\/site\.js[^"]*"><\/script>(?=<\/body>)/)?.[0];
  assert(headPart && navPart, 'No navigation envelope in the EP.02 ' + lang + ' viewer');
  assert(headPart.includes(siteCss) && navPart.includes(siteJs));
  const other = lang === 'ru' ? 'en' : 'ru';
  let nav = swap('nav ' + lang, navPart, list(lang, episodes, donorSlug), list(lang, episodes, added.slug));
  const switchTo = slug => `<a href="${route(other, slug)}" data-episode-language="${route(other, slug)}"`;
  nav = swap('nav ' + lang, nav, switchTo(donorSlug), switchTo(added.slug));
  assert.equal(once(nav, 'aria-current="page"'), 1);
  assert.equal(once(nav, donorSlug + '/'), 1, 'EP.02 should stay only as a menu item');

  // Cache keys on the episode's own CSS and scripts, as EP.02 has them.
  const v = f => `${f}?v=${sha(fs.readFileSync(path.join(dist, f))).slice(0, 12)}`;
  let html = text['index.html'];
  html = swap(lang + ' index', html, '<link rel="stylesheet" href="episode.css">', `<link rel="stylesheet" href="${v('episode.css')}">`);
  html = swap(lang + ' index', html, '<script src="journey.js"></script>', `<script src="${v('journey.js')}"></script>`);
  html = swap(lang + ' index', html, '<script src="app.js"></script>', `<script src="${v('app.js')}"></script>`);
  html = swap(lang + ' index', html, '</head>', headPart + '</head>');
  html = swap(lang + ' index', html, '</body>', nav + '</body>');
  assert(html.startsWith(`<!doctype html>\n<html lang="${lang}">`), 'Language tag ' + lang);
  assert(html.includes(`<link rel="canonical" href="https://tengucluster.com${route(lang, added.slug)}">`), 'Canonical ' + lang);
  put('index.html', html);
}

// --- Catalogs: the generator must still give the live pages for 01–04 before it adds 05.
for (const lang of ['ru', 'en']) {
  const file = route(lang).slice(1) + 'index.html';
  assert.equal(catalog(lang, published, catalogCss), read(path.join(out, file)), 'Catalog generator drifted: ' + file);
  write(path.join(out, file), catalog(lang, episodes, catalogCss)); changed.push(file);
}

// --- Inventory.
const walk = (dir, prefix = '') => fs.readdirSync(dir).flatMap(n => {
  const s = fs.lstatSync(path.join(dir, n)); assert(!s.isSymbolicLink());
  return s.isDirectory() ? walk(path.join(dir, n), prefix + n + '/') : [prefix + n];
}).sort();
assert.deepEqual(walk(out), [...files].sort(), 'Unexpected staging file: review before publishing');
const inventory = Object.fromEntries([...files].sort().map(f => { const b = fs.readFileSync(path.join(out, f)); return [f, {bytes: b.length, sha256: sha(b)}]; }));
for (const [file, meta] of Object.entries(baseline)) assert.equal(inventory[file].sha256 === meta.sha256, !changed.includes(file), 'Unexpected change state: ' + file);
write(path.join(root, 'build-manifest.json'), JSON.stringify({builtAt: new Date().toISOString(), baselineDeploymentId: receipt.deploymentId, files: inventory}, null, 2) + '\n');
const report = {changed: changed.sort(), added: [...files].filter(f => !baseline[f]).sort(), preserved: Object.keys(baseline).length - changed.length};
write(path.join(root, 'change-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Built ${files.size} public files: ${report.added.length} added, ${report.changed.length} changed (8 menus, 2 catalogs), ${report.preserved} unchanged.`);
