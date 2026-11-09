import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {episodes, route} from './episodes.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.resolve(root, '../tengu-cloudflare-pages');
const previous = path.join(root, 'previous');
const output = path.join(root, 'public');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, data) => {fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, data);};
const receipt = JSON.parse(read(path.join(baseline, 'deployment-record.json')));
// This release changes navigation only, against the inspected, immutable snapshot.
assert.equal(receipt.deploymentId, 'e56daf0f-c3bf-42b6-89c5-51f21e5d0de8', 'Reconcile a newer baseline before rebuilding');
if (!fs.existsSync(previous)) {
  const inventory = JSON.parse(read(path.join(baseline, 'build-manifest.json')));
  for (const [file, meta] of Object.entries(inventory.files)) {
    const bytes = fs.readFileSync(path.join(baseline, 'public', file));
    assert.equal(hash(bytes), meta.sha256, 'Baseline drift: ' + file);
    write(path.join(previous, 'public', file), bytes);
  }
  for (const name of ['build-manifest.json', 'deployment-record.json', 'README-RU.md', 'upload-manifest.json']) {
    write(path.join(previous, name), fs.readFileSync(path.join(baseline, name)));
  }
}
const oldManifest = JSON.parse(read(path.join(previous, 'build-manifest.json')));
const allowed = new Set(Object.keys(oldManifest.files));
for (const [file, meta] of Object.entries(oldManifest.files)) {
  const bytes = fs.readFileSync(path.join(previous, 'public', file));
  assert.equal(hash(bytes), meta.sha256, 'Snapshot drift: ' + file);
  write(path.join(output, file), bytes);
}
const assets = {};
for (const name of ['site.js', 'site.css', 'catalog.css']) {
  const bytes = fs.readFileSync(path.join(root, name));
  const target = `site/${name}`;
  allowed.add(target); write(path.join(output, target), bytes);
  assets[name] = '/' + target + '?v=' + hash(bytes).slice(0,12);
}
function menu(lang, ep) {
  const ru = lang === 'ru', other = ru ? 'en' : 'ru';
  return `<nav class="site-nav" aria-label="${ru ? 'Навигация по сайту' : 'Site navigation'}"><button type="button" data-open-menu aria-haspopup="dialog" aria-controls="episodeMenu" aria-expanded="false"><i class="site-menu-icon" aria-hidden="true"></i>${ru ? 'Выпуски' : 'Episodes'}</button><a href="${route(other,ep.slug)}" data-episode-language="${route(other,ep.slug)}" hreflang="${other}" lang="${other}" aria-label="${ru ? 'This episode in English' : 'Этот выпуск на русском'}">${other.toUpperCase()}</a></nav>
<dialog class="episode-menu" id="episodeMenu" aria-labelledby="episodeMenuTitle"><div class="episode-menu__head"><h2 id="episodeMenuTitle">${ru ? 'Выпуски TENGU' : 'TENGU episodes'}</h2><button class="episode-menu__close" type="button" data-close-menu aria-label="${ru ? 'Закрыть меню' : 'Close menu'}" autofocus>×</button></div><a class="episode-menu__home" href="${route(lang)}">← ${ru ? 'На главную · все выпуски' : 'Home · all episodes'}</a><ol class="episode-menu__list">${episodes.map(item => `<li><a href="${route(lang,item.slug)}"${item.slug === ep.slug ? ' aria-current="page"' : ''}><b>${item.id}</b><span><small>${esc(item[lang].topic)}</small><strong>${esc(item[lang].title)}</strong></span><span aria-hidden="true">↗</span></a></li>`).join('')}</ol><div class="episode-menu__foot"><button type="button" data-record>${ru ? 'Скрыть меню для записи' : 'Hide navigation for recording'}</button><p><kbd>H</kbd> — ${ru ? 'скрыть / показать меню' : 'hide / show navigation'}<br><kbd>P</kbd> — ${ru ? 'пауза анимации' : 'pause animation'}</p></div></dialog><p class="site-status" id="siteStatus" role="status" aria-live="polite"></p>`;
}
const changed = [];
for (const lang of ['ru','en']) for (const ep of episodes) {
  const original = ep.id === '01' ? (lang === 'ru' ? 'index.html' : 'en/index.html') : route(lang, ep.slug).slice(1)+'index.html';
  const target = route(lang,ep.slug).slice(1)+'index.html';
  let html = read(path.join(previous, 'public', original));
  if (ep.id === '01') {
    // Resolve legacy viewer dependencies against their original location, not its new URL.
    const oldBase = new URL(original, 'https://tengucluster.com/');
    html = html.replace(/\b(src|href|poster)="([^"#][^"]*)"/g, (all, attr, value) => {
      if (value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value)) return all;
      const u = new URL(value, oldBase);
      assert(Object.hasOwn(oldManifest.files, u.pathname.slice(1)), 'Unknown legacy dependency: ' + value);
      return `${attr}="${u.pathname}${u.search}${u.hash}"`;
    });
    html = html.replace(/(<meta property="og:url" content=")[^"]+/, '$1https://tengucluster.com'+route(lang,ep.slug));
    html = html.replace('</head>', `<link rel="canonical" href="https://tengucluster.com${route(lang,ep.slug)}"><link rel="alternate" hreflang="ru" href="https://tengucluster.com${route('ru',ep.slug)}"><link rel="alternate" hreflang="en" href="https://tengucluster.com${route('en',ep.slug)}"></head>`);
  } else changed.push(target);
  html = html.replace('</head>', `<link rel="stylesheet" href="${assets['site.css']}"><script>if(new URLSearchParams(location.search).get('record')==='1')document.documentElement.classList.add('is-recording');</script></head>`);
  html = html.replace('</body>', `${menu(lang,ep)}<script src="${assets['site.js']}"></script></body>`);
  allowed.add(target); write(path.join(output,target),html);
}
function catalog(lang) {
  const ru = lang === 'ru', other = ru ? 'en' : 'ru', feature = episodes[0], f = feature[lang];
  const title = ru ? 'Выпуски TENGU' : 'TENGU episodes';
  const desc = ru ? 'ИИ, агенты и безопасность — интерактивные разборы. Выберите тему и исследуйте её шаг за шагом.' : 'AI, agents and security — interactive explainers. Pick a topic and explore it step by step.';
  const open = ru ? 'Открыть презентацию' : 'Open presentation';
  const art = `<div class="security-art" aria-hidden="true"><img src="/assets/tengu-kaiju-complete-v33.png" width="1024" height="1536" alt="" fetchpriority="high"><div class="trust-document"><span>TLS / CERTIFICATE</span><strong>eMudhra</strong><i></i><i></i><em>${ru ? 'ДОВЕРЯТЬ?' : 'TRUSTED?'}</em></div><span class="security-art__tag">TENGU / FIELD STUDY 03</span></div>`;
  const cards = episodes.slice(1).map(ep => `<article class="episode-card episode-card--${ep.kind}"><div class="episode-card__art" data-id="${ep.id}" aria-hidden="true"><img src="/assets/${ep.kind==='cluster' ? 'tengu-robot-v23.png' : 'tengu-kaiju-v23.png'}" width="768" height="1024" alt="" loading="lazy"></div><div><span class="episode-label">${esc(ep[lang].topic)}</span><h3><a href="${route(lang,ep.slug)}">${esc(ep[lang].title)}</a></h3><p>${esc(ep[lang].description)}</p><a class="episode-open" href="${route(lang,ep.slug)}" aria-label="${open}: ${esc(ep[lang].title)}">${open}<span aria-hidden="true">→</span></a></div></article>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11110f"><title>${title} — AI, agents & security</title><meta name="description" content="${desc}"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website"><meta property="og:url" content="https://tengucluster.com${route(lang)}"><meta property="og:image" content="https://tengucluster.com/assets/tengu-logo-sting-poster${ru?'':'-en'}.png"><link rel="canonical" href="https://tengucluster.com${route(lang)}"><link rel="alternate" hreflang="ru" href="https://tengucluster.com/"><link rel="alternate" hreflang="en" href="https://tengucluster.com/en/"><link rel="icon" href="/assets/tengu-mark-simplified.svg" type="image/svg+xml"><link rel="stylesheet" href="${assets['catalog.css']}"><script>if(/^#(?:slide-\\d+|intro)$/.test(location.hash))location.replace('${route(lang,'agent-context')}'+location.search+location.hash);</script></head><body><a class="catalog-skip" href="#episodes">${ru ? 'К выпускам' : 'Skip to episodes'}</a><header class="catalog-header"><div class="catalog-header__inner"><a class="catalog-brand" href="${route(lang)}" aria-label="TENGU — ${ru?'главная':'home'}"><img src="/assets/tengu-mark-simplified.svg" width="39" height="39" alt=""><span>TENGU</span></a><nav aria-label="${ru?'Навигация':'Navigation'}"><a href="#episodes" aria-current="page">${ru?'Выпуски':'Episodes'}</a><div class="catalog-languages" aria-label="${ru?'Язык':'Language'}">${['ru','en'].map(l=>l===lang?`<span aria-current="true">${l.toUpperCase()}</span>`:`<a href="${route(l)}" hreflang="${l}" lang="${l}" aria-label="${l==='en'?'English':'Русский'}">${l.toUpperCase()}</a>`).join('')}</div></nav></div></header><main class="catalog-main" id="episodes"><div class="catalog-intro"><div><span class="catalog-kicker">TENGU / FIELD MANUAL</span><h1>${title}</h1><p>${desc}</p></div><div class="catalog-count"><b>03</b>${ru?'ВЫПУСКА / RU + EN':'EPISODES / RU + EN'}</div></div><article class="episode-feature"><div class="episode-feature__copy"><span class="episode-label"><b>${ru?'ПОСЛЕДНИЙ ВЫПУСК':'LATEST EPISODE'} / 03</b><br>${esc(f.topic)}</span><h2>${esc(f.title)}</h2><p>${esc(f.description)}</p><a class="episode-open" href="${route(lang,feature.slug)}" aria-label="${open}: ${esc(f.title)}">${open}<span aria-hidden="true">→</span></a></div>${art}</article><div class="catalog-section-head"><h2>${ru?'Другие выпуски':'More episodes'}</h2><span>01—02 / ${ru?'АРХИВ':'ARCHIVE'}</span></div><div class="episode-grid">${cards}</div><details class="catalog-help"><summary>${ru?'Как смотреть презентации и управлять анимацией':'How to explore a presentation and control animations'}</summary><p>${ru?'Это интерактивные материалы к видео, а не видеоплеер. Откройте выпуск и нажмите «Начать презентацию»: заставка запустится со звуком. Листайте экраны колёсиком или клавишами <kbd>↑</kbd> <kbd>↓</kbd>. <kbd>←</kbd> <kbd>→</kbd> — шаги анимации; <kbd>P</kbd> — пауза; <kbd>R</kbd> — сначала; <kbd>−</kbd> <kbd>+</kbd> — скорость. Кнопка «Выпуски» откроет другие темы. <kbd>H</kbd> скрывает и возвращает меню сайта для записи.':'These are interactive companions to videos, not video players. Open an episode and select “Start presentation” to play the intro with sound. Scroll or use <kbd>↑</kbd> <kbd>↓</kbd> to move between screens. <kbd>←</kbd> <kbd>→</kbd> step through animations; <kbd>P</kbd> pauses; <kbd>R</kbd> restarts; <kbd>−</kbd> <kbd>+</kbd> change the speed. “Episodes” opens other topics. <kbd>H</kbd> hides or restores site navigation for recording.'}</p></details></main><footer class="catalog-footer"><img src="/assets/tengu-wordmark-horizontal${ru?'':'-en'}.svg" alt="TENGU" width="160" height="45"><span>${ru?'ПРАКТИЧЕСКИЙ ИИ. ПОНЯТНЫЕ СИСТЕМЫ.':'PRACTICAL AI. UNDERSTANDABLE SYSTEMS.'}</span></footer></body></html>`;
}
for (const lang of ['ru','en']) {
  const file = route(lang).slice(1)+'index.html';
  write(path.join(output,file),catalog(lang)); changed.push(file);
}
function list(dir, prefix='') {return fs.readdirSync(dir).flatMap(n=>{const s=fs.lstatSync(path.join(dir,n));assert(!s.isSymbolicLink());return s.isDirectory()?list(path.join(dir,n),prefix+n+'/'):[prefix+n];}).sort();}
assert.deepEqual(list(output), [...allowed].sort(), 'Unexpected staging file: review before publishing');
const files = Object.fromEntries([...allowed].sort().map(file=>{const b=fs.readFileSync(path.join(output,file));return [file,{bytes:b.length,sha256:hash(b)}];}));
for (const [file, meta] of Object.entries(oldManifest.files)) if(!changed.includes(file)) assert.equal(files[file].sha256,meta.sha256,'Unrelated content changed');
write(path.join(root,'build-manifest.json'),JSON.stringify({builtAt:new Date().toISOString(),baselineDeploymentId:receipt.deploymentId,files},null,2)+'\n');
write(path.join(root,'change-report.json'),JSON.stringify({changed:changed.sort(),added:[...allowed].filter(f=>!oldManifest.files[f]).sort(),preserved:Object.keys(oldManifest.files).length-changed.length},null,2)+'\n');
console.log(`Built ${allowed.size} public files; ${changed.length} existing HTML entries changed. Slide runtimes, media, scripts and skill untouched.`);
