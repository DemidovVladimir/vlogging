// Stages public/ for the Modal City navigation release: the hash-verified 166-file baseline
// (previous/, production b0bd4027-f710-4779-928b-a56355ebb169) plus a way to reach the trainer at
// /modal-city/ (served by the separate Worker tengu-modal-city, not by this Pages project):
//   - both catalogs: a "Тренажёр" / "Trainer" link in the header nav, after "Выпуски" / "Episodes",
//     and the catalog.css cache key, because catalog.css gains a 320-374 px rule that tightens the
//     header so the extra tab fits without sideways scrolling;
//   - all 8 viewers: a second link beside "← На главную" / "← Home" in the episode menu, and the
//     site.css cache key, because site.css gains the one rule that lays the two links out.
// Each change is an exact-once replacement, and the build proves nothing else moved.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const previous = path.join(root, 'previous'), out = path.join(root, 'public');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => fs.readFileSync(path.join(out, f), 'utf8');
const write = (f, b) => fs.writeFileSync(path.join(out, f), b);
const once = (text, part) => text.split(part).length - 1;
// Replace exactly one occurrence, and prove that undoing it gives back the original.
function swap(file, text, from, to) {
  assert.equal(once(text, from), 1, `Expected one ${JSON.stringify(from.slice(0, 60))} in ${file}`);
  const next = text.replace(from, to);
  assert.equal(next.replace(to, from), text, 'Replacement is not reversible in ' + file);
  return next;
}

// --- The baseline.
const receipt = JSON.parse(fs.readFileSync(path.join(previous, 'deployment-record.json'), 'utf8'));
assert.equal(receipt.deploymentId, 'b0bd4027-f710-4779-928b-a56355ebb169', 'Reconcile a newer baseline before rebuilding');
const baseline = JSON.parse(fs.readFileSync(path.join(previous, 'build-manifest.json'), 'utf8')).files;
assert.equal(Object.keys(baseline).length, 166);
fs.rmSync(out, {recursive: true, force: true});
for (const [file, meta] of Object.entries(baseline)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(sha(bytes), meta.sha256, 'Baseline drift: ' + file);
  fs.mkdirSync(path.dirname(path.join(out, file)), {recursive: true});
  write(file, bytes);
}
const changed = [];
const key = file => `/${file}?v=${sha(fs.readFileSync(path.join(out, file))).slice(0, 12)}`;

// --- site.css: the menu's two top links share a row and wrap on narrow screens.
const oldCss = key('site/site.css');
assert.equal(oldCss, '/site/site.css?v=374cfcf770a6');
const css = read('site/site.css');
assert(css.endsWith('}\n') && !css.includes('episode-menu__links'));
write('site/site.css', css.slice(0, -1) + '.episode-menu__links{display:flex;flex-wrap:wrap;column-gap:28px}\n');
changed.push('site/site.css');
const newCss = key('site/site.css');

// --- Viewers' menus.
const TRAINER = '/modal-city/';
const home = {
  ru: '<a class="episode-menu__home" href="/">← На главную · все выпуски</a>',
  en: '<a class="episode-menu__home" href="/en/">← Home · all episodes</a>',
};
// The trainer is in English only, so the Russian pages say so and mark the link's language.
const menuLink = {
  ru: `<a class="episode-menu__home" href="${TRAINER}" hreflang="en">Тренажёр Modal City (на английском): Vim, tmux, терминал →</a>`,
  en: `<a class="episode-menu__home" href="${TRAINER}">Modal City trainer: Vim, tmux, terminal →</a>`,
};
const slugs = fs.readdirSync(path.join(out, 'episodes')).sort();
assert.deepEqual(slugs, ['agent-context', 'chaos-kb', 'emudhra-ca-compromise', 'tengu-cluster']);
for (const lang of ['ru', 'en']) for (const slug of slugs) {
  const file = (lang === 'en' ? 'en/' : '') + 'episodes/' + slug + '/index.html';
  let html = read(file);
  html = swap(file, html, home[lang], `<div class="episode-menu__links">${home[lang]}${menuLink[lang]}</div>`);
  html = swap(file, html, `<link rel="stylesheet" href="${oldCss}">`, `<link rel="stylesheet" href="${newCss}">`);
  write(file, html); changed.push(file);
}

// --- catalog.css: below 375 px the header gives up 24 px of padding and gaps for the extra tab.
const oldCatalogCss = key('site/catalog.css');
assert.equal(oldCatalogCss, '/site/catalog.css?v=c36fc2a39817');
const catalogCss = read('site/catalog.css');
assert(catalogCss.endsWith('}\n') && !catalogCss.includes('max-width:374px'));
write('site/catalog.css', catalogCss.slice(0, -1) + '@media(max-width:374px){.catalog-header__inner{padding:12px 14px;gap:8px}.catalog-header nav{gap:10px}.catalog-languages a,.catalog-languages span{padding:9px 6px}}\n');
changed.push('site/catalog.css');
const newCatalogCss = key('site/catalog.css');

// --- Catalogs' header nav.
const nav = {
  ru: ['<a href="#episodes" aria-current="page">Выпуски</a>', `<a href="${TRAINER}" hreflang="en">Тренажёр</a>`],
  en: ['<a href="#episodes" aria-current="page">Episodes</a>', `<a href="${TRAINER}">Trainer</a>`],
};
for (const lang of ['ru', 'en']) {
  const file = (lang === 'en' ? 'en/' : '') + 'index.html';
  const [episodes, trainer] = nav[lang];
  let html = swap(file, read(file), episodes, episodes + trainer);
  html = swap(file, html, `href="${oldCatalogCss}"`, `href="${newCatalogCss}"`);
  write(file, html); changed.push(file);
}

// --- Inventory: same files as the baseline; only the 12 above differ.
const walk = (dir, prefix = '') => fs.readdirSync(dir).flatMap(n => {
  const s = fs.lstatSync(path.join(dir, n)); assert(!s.isSymbolicLink());
  return s.isDirectory() ? walk(path.join(dir, n), prefix + n + '/') : [prefix + n];
}).sort();
assert.deepEqual(walk(out), Object.keys(baseline).sort(), 'Unexpected staging file: review before publishing');
const inventory = Object.fromEntries(walk(out).map(f => { const b = fs.readFileSync(path.join(out, f)); return [f, {bytes: b.length, sha256: sha(b)}]; }));
for (const [file, meta] of Object.entries(baseline)) assert.equal(inventory[file].sha256 === meta.sha256, !changed.includes(file), 'Unexpected change state: ' + file);
fs.writeFileSync(path.join(root, 'build-manifest.json'), JSON.stringify({builtAt: new Date().toISOString(), baselineDeploymentId: receipt.deploymentId, files: inventory}, null, 2) + '\n');
const report = {changed: changed.sort(), added: [], preserved: Object.keys(baseline).length - changed.length, siteCss: [oldCss, newCss], catalogCss: [oldCatalogCss, newCatalogCss]};
fs.writeFileSync(path.join(root, 'change-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Built ${Object.keys(inventory).length} public files: ${changed.length} changed (site.css, catalog.css, 8 menus, 2 catalogs), ${report.preserved} unchanged; ${oldCss} -> ${newCss}, ${oldCatalogCss} -> ${newCatalogCss}.`);
