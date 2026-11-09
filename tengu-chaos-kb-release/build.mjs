// Stages public/ for the EP.04 release: the hash-verified 144-file baseline (previous/), the RU
// and EN chaos-kb guide, the 04 entry at the top of every viewer's menu and both catalogs.
// Old viewers change only by that one <li>; build-manifest.json and change-report.json record
// the result. No network, no private files: public/ holds exactly the allowlist below.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {episodes, published, added, route} from './episodes.mjs';
import {catalog} from './catalog.mjs';
import {guide} from './render.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const previous = path.join(root, 'previous'), out = path.join(root, 'public'), pages = path.join(root, 'pages');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, b) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, b); };
const once = (text, part) => text.split(part).length - 1;

// --- The baseline: production deployment 164c89c5-ad6a-483f-bc55-d65e570dcceb, as saved in previous/.
const receipt = JSON.parse(read(path.join(previous, 'deployment-record.json')));
assert.equal(receipt.deploymentId, '164c89c5-ad6a-483f-bc55-d65e570dcceb', 'Reconcile a newer baseline before rebuilding');
const baseline = JSON.parse(read(path.join(previous, 'build-manifest.json'))).files;
assert.equal(Object.keys(baseline).length, 144);
fs.rmSync(out, {recursive: true, force: true});
for (const [file, meta] of Object.entries(baseline)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(sha(bytes), meta.sha256, 'Baseline drift: ' + file);
  write(path.join(out, file), bytes);
}
// The shared navigation assets stay as they are; their cache keys are their own hashes.
const key = file => `/${file}?v=${sha(fs.readFileSync(path.join(out, file))).slice(0, 12)}`;
const siteCss = key('site/site.css'), siteJs = key('site/site.js'), catalogCss = key('site/catalog.css');
assert.deepEqual([siteCss, siteJs, catalogCss], ['/site/site.css?v=374cfcf770a6', '/site/site.js?v=45a08ed50593', '/site/catalog.css?v=c36fc2a39817']);

// --- Menus. The item markup is the one tengu-site-navigation generated; checked against every viewer.
const item = (lang, ep, current) => `<li><a href="${route(lang, ep.slug)}"${current ? ' aria-current="page"' : ''}><b>${ep.id}</b><span><small>${esc(ep[lang].topic)}</small><strong>${esc(ep[lang].title)}</strong></span><span aria-hidden="true">↗</span></a></li>`;
const list = (lang, items, slug) => `<ol class="episode-menu__list">${items.map(ep => item(lang, ep, ep.slug === slug)).join('')}</ol>`;
const changed = [];
for (const lang of ['ru', 'en']) for (const ep of published) {
  const file = route(lang, ep.slug).slice(1) + 'index.html';
  const old = read(path.join(out, file));
  assert.equal(once(old, list(lang, published, ep.slug)), 1, 'Unexpected menu in ' + file);
  const html = old.replace(list(lang, published, ep.slug), list(lang, episodes, ep.slug));
  assert.equal(html.replace(item(lang, added, false), ''), old, 'More than the 04 item changed in ' + file);
  write(path.join(out, file), html); changed.push(file);
}

// --- The guide inherits the viewers' navigation envelope: the head snippet and everything from
// <nav class="site-nav"> to site.js, taken from EP.03 (already carrying 04) with the current item moved.
const files = new Set(Object.keys(baseline));
const assets = ['plain', 'persona', 'plain-2', 'persona-2', 'persona-3', 'briefed', 'cc-kb-unused', 'cc-kb-claude-md'];
for (const lang of ['ru', 'en']) {
  const donor = read(path.join(out, route(lang, 'emudhra-ca-compromise').slice(1) + 'index.html'));
  const headPart = donor.match(/<link rel="stylesheet" href="\/site\/site\.css[^"]*"><script>[^<]*<\/script>(?=<\/head>)/)?.[0];
  const navPart = donor.match(/<nav class="site-nav"[^]*?<script src="\/site\/site\.js[^"]*"><\/script>(?=<\/body>)/)?.[0];
  assert(headPart && navPart, 'No navigation envelope in the EP.03 ' + lang + ' viewer');
  const other = lang === 'ru' ? 'en' : 'ru';
  let nav = navPart.replace(list(lang, episodes, 'emudhra-ca-compromise'), list(lang, episodes, 'chaos-kb'));
  // Only the language link: /episodes/x/ is also a substring of /en/episodes/x/ in the menu.
  const switchTo = slug => `<a href="${route(other, slug)}" data-episode-language="${route(other, slug)}"`;
  assert.equal(once(nav, switchTo('emudhra-ca-compromise')), 1);
  nav = nav.replace(switchTo('emudhra-ca-compromise'), switchTo('chaos-kb'));
  assert.equal(once(nav, 'aria-current="page"'), 1);
  assert.equal(once(nav, 'emudhra-ca-compromise/'), 1, 'EP.03 should stay only as a menu item');
  const dir = route(lang, 'chaos-kb').slice(1);
  const own = {};
  for (const name of ['guide.css', 'guide.js']) {
    const bytes = fs.readFileSync(path.join(pages, name));
    write(path.join(out, dir, name), bytes); files.add(dir + name);
    own[name] = `${name}?v=${sha(bytes).slice(0, 12)}`;
  }
  for (const name of assets) {
    write(path.join(out, dir, 'assets', name + '.jpg'), fs.readFileSync(path.join(pages, 'assets', name + '.jpg')));
    files.add(`${dir}assets/${name}.jpg`);
  }
  let html = guide(lang, {css: own['guide.css'], js: own['guide.js']});
  assert.equal(once(html, '</head>'), 1); assert.equal(once(html, '</body>'), 1);
  html = html.replace('</head>', headPart + '</head>').replace('</body>', nav + '</body>');
  for (const name of assets) assert(html.includes(`assets/${name}.jpg`), 'Unused image ' + name);
  write(path.join(out, dir, 'index.html'), html); files.add(dir + 'index.html');
}

// --- Catalogs: the generator must still give the live pages for 01–03 before it adds 04.
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
for (const [file, meta] of Object.entries(baseline)) if (!changed.includes(file)) assert.equal(inventory[file].sha256, meta.sha256, 'Unrelated content changed: ' + file);
write(path.join(root, 'build-manifest.json'), JSON.stringify({builtAt: new Date().toISOString(), baselineDeploymentId: receipt.deploymentId, files: inventory}, null, 2) + '\n');
const report = {changed: changed.sort(), added: [...files].filter(f => !baseline[f]).sort(), preserved: Object.keys(baseline).length - changed.length};
write(path.join(root, 'change-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Built ${files.size} public files: ${report.added.length} added, ${report.changed.length} changed (6 menus, 2 catalogs), ${report.preserved} unchanged.`);
