// The chaos-kb guide page (EP.04) for one language. A long, scrolling page in the viewers' rail
// and washi/sumi system; the shared site navigation (site.css, site.js, the menu) is appended
// by build.mjs exactly as in every other viewer. The words come in as an argument, so build.mjs can
// render the live content-live.mjs (and prove it reproduces the live page) and the revised content.mjs.
import {route} from './episodes.mjs';

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const attr = s => esc(s).replaceAll('"', '&quot;');
const ids = ['exercise', 'how', 'install', 'connect', 'brief', 'daily', 'trouble', 'repeat'];
const num = i => String(i).padStart(2, '0');

// A code block. Shell blocks mark `$ ` lines as commands (the copy button copies only those) and
// the rest as their output; file blocks copy everything.
function code(lines, kind = 'shell', label = '') {
  const shell = kind === 'shell';
  const commands = shell ? lines.filter(l => l.startsWith('$ ')).map(l => l.slice(2)) : lines;
  const body = lines.map(l => shell && l.startsWith('$ ')
    ? `<span class="cmd"><span class="prompt" aria-hidden="true">$ </span>${esc(l.slice(2))}</span>`
    : `<span class="${shell ? 'out' : 'src'}">${esc(l)}</span>`).join('\n');
  return `<div class="code"${label ? ` data-label="${attr(label)}"` : ''}><pre data-copy="${attr(commands.join('\n'))}"><code>${body}</code></pre></div>`;
}
const table = (head, rows, cls = '') => `<div class="table-wrap"><table class="table ${cls}"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const shot = (src, alt, w = 720, h = 470, eager = false) => `<img src="assets/${src}.jpg" width="${w}" height="${h}" alt="${attr(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async">`;
const steps = (items, blocks) => `<ol class="install">${items.map(([title, text], i) => `<li><b class="step-no">${i + 1}</b><div><h3>${title}</h3>${blocks[i] || ''}<p>${text}</p></div></li>`).join('')}</ol>`;

function section(id, index, title, cls, inner) {
  return `<section class="part ${cls}" id="${id}" data-part="${index}" data-title="${attr(title)}"><div class="part__inner">${inner}</div></section>`;
}
const head = s => `<span class="eyebrow${s.light ? ' eyebrow--light' : ''}">${s.eyebrow}</span><h2>${s.h2}</h2><p class="lead">${s.lead}</p>`;

export function guide(lang, {css, js}, {copy, facts}) {
  const t = copy[lang], ru = lang === 'ru', self = route(lang, 'chaos-kb');
  const url = `https://tengucluster.com${self}`;
  const h = t.hero, x = t.exercise, w = t.how, inst = t.install, con = t.connect, b = t.brief, d = t.daily, tr = t.trouble, rep = t.repeat;

  const hero = `<section class="part ink part--hero" id="top" data-part="00" data-title="${attr(h.h1.replace(/<[^>]+>/g, ''))}"><div class="part__inner hero">
<div class="hero__copy"><span class="eyebrow eyebrow--light">${h.eyebrow}</span><h1>${h.h1}</h1><p class="lead">${h.lead}</p>
<dl class="hero__facts">${h.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>
<div class="hero__art" aria-hidden="true"><img src="/assets/tengu-robot-v23.png" width="1086" height="1448" alt="" fetchpriority="high"><div class="note-card"><span>VAULT / TASTE.MD</span><pre>${esc(facts.tasteNote.join('\n'))}</pre><em>${h.stamp}</em></div></div>
<nav class="toc" aria-label="${t.ui.contents}"><ol>${t.toc.map((name, i) => `<li><a href="#${ids[i]}"><b>${num(i + 1)}</b><span>${name}</span></a></li>`).join('')}</ol></nav>
</div></section>`;

  const request = `<blockquote class="request" lang="en">${facts.request.map(p => `<p>${esc(p)}</p>`).join('')}</blockquote>${ru ? `<p class="translation"><span>${t.ui.translation}</span>${x.requestTranslation}</p>` : ''}`;
  const figure = r => `<figure class="shot shot--${r.agent}"><figcaption class="shot__label"><span>${r.label}</span><code>${r.agent}</code></figcaption>${shot(r.img, r.alt)}<blockquote class="reply" lang="en"><p>“${esc(r.reply)}”</p></blockquote>${ru ? `<p class="translation">${r.translation}</p>` : ''}</figure>`;
  const versus = `<div class="versus">${x.results.map(figure).join('')}</div>`;
  const s = facts.kbSearch;
  const exercise = section('exercise', '01', t.toc[0], 'paper part--grid', `${head(x)}
<ol class="steps">
<li><b class="step-no">1</b><h3>${x.steps[0][0]}</h3><p>${x.steps[0][1]}</p>${code(facts.tasteNote, 'file', 'Taste.md')}</li>
<li><b class="step-no">2</b><h3>${x.steps[1][0]}</h3><p>${x.steps[1][1]}</p>${request}</li>
<li><b class="step-no">3</b><h3>${x.steps[2][0]}</h3><p>${x.steps[2][1]}</p></li>
</ol>
${versus}
<div class="query"><h3>${x.queryTitle}</h3><p class="query__call"><code>kb_search</code> <q lang="en">${esc(s.query)}</q></p><p class="query__hit"><span aria-hidden="true">→ </span><code>${esc(s.where)}</code> · ${x.queryAnswer} <code>${s.score}</code></p><p>${x.queryText}</p></div>
<div class="rerun"><div><h3>${x.rerunTitle}</h3><p>${x.rerunText}</p></div><figure>${shot('plain-2', x.rerunAlt[0])}<figcaption><code>plain</code></figcaption></figure><figure>${shot('persona-2', x.rerunAlt[1])}<figcaption><code>persona</code></figcaption></figure></div>
<p class="part-foot">${x.foot}</p>`);

  const flow = `<ol class="check-flow">${w.steps.map(([a, b], i) => `<li data-step="${i + 1}"><b>${i + 1}</b><span>${a}</span><small>${b}</small><i class="mark" aria-hidden="true"></i></li>`).join('')}</ol>`;
  const answers = facts.checks.map((c, i) => {
    const where = c.lines ? `Taste.md › Websites · ${c.lines.includes('–') ? w.lines : w.line} ${c.lines}` : '';
    return `<div class="answer" data-answer="${i}" data-presence="${c.presence}"><p class="answer__q"><code>check</code> <q${/[а-я]/i.test(c.q) ? ' lang="ru"' : ' lang="en"'}>${esc(c.q)}</q></p><p class="answer__result"><span class="badge badge--${c.presence}">${c.presence}</span>${c.score ? `<span class="answer__score">score ${c.score}</span>` : ''}${where ? `<code>${esc(where)}</code>` : ''}</p><p>${w.checkNotes[i]}</p></div>`;
  }).join('');
  const demo = `<div class="check-demo" data-check-demo><div class="check-demo__head"><h3>${w.demoTitle}</h3><p>${w.demoLead}</p></div>
<div class="check-demo__queries" role="group" aria-label="${t.ui.queries}">${facts.checks.map((c, i) => `<button type="button" data-check="${i}" aria-pressed="${i === 0}"><code>${esc(c.q)}</code></button>`).join('')}</div>
${flow}<div class="check-demo__answers" aria-live="polite">${answers}</div></div>`;
  const lanes = `<div class="pipeline"><div class="pipeline__source"><b>${w.source[0]}</b><small>${w.source[1]}</small></div><div class="pipeline__lanes">${w.lanes.map(l => `<div class="lane"><span class="lane__label">${l.label}</span><ol>${l.chips.map(([a, b]) => `<li><b>${a}</b><small>${b}</small></li>`).join('')}</ol><span class="lane__result">${l.result}</span></div>`).join('')}</div></div>`;
  const how = section('how', '02', t.toc[1], 'ink', `${head({...w, light: true})}
${lanes}
<div class="cards">${w.cards.map(([a, b]) => `<article class="card"><h3>${a}</h3><p>${b}</p></article>`).join('')}</div>
${demo}
<div class="split"><div><h3>${w.speedTitle}</h3>${table([ru ? 'Команда' : 'Command', ru ? 'Время' : 'Time'], w.speed, 'table--speed')}<p class="small">${w.speedNote}</p></div><aside class="aside"><h3>${w.bloomTitle}</h3><p>${w.bloom}</p></aside></div>`);

  const install = section('install', '03', t.toc[2], 'paper part--grid', `${head(inst)}
${steps(inst.steps, facts.install.map(lines => code(lines)))}`);

  const clientBlocks = [code(facts.claudeCode), code(facts.codex), code(facts.tengu, 'file', 'config.toml'), code(facts.other, 'file', 'JSON')];
  const connect = section('connect', '04', t.toc[3], 'ink', `${head({...con, light: true})}
<div class="clients">${con.clients.map(([name, text], i) => `<article class="client"><h3>${name}</h3>${clientBlocks[i]}<p>${text}</p></article>`).join('')}</div>
<div class="callout"><h3>${con.calloutTitle}</h3><p>${con.callout}</p>${code([facts.claudeMdLine], 'file', 'CLAUDE.md')}</div>`);

  const briefBlocks = [facts.topics, facts.read, facts.brief].map((lines, i) => code(lines, 'file', b.blockLabels[i]));
  // Each cell carries its column name for phones, where the table header is hidden.
  const cell = (k, v) => `<span class="cell-label">${b.trioHead[k]}: </span>${v}`;
  const trio = facts.trio.map(([agent, secs, turns], i) => [`<code>${agent}</code>`, cell(1, b.trio[i][0]), cell(2, `${secs} ${b.seconds}`), cell(3, turns), cell(4, b.trio[i][1])]);
  const brief = section('brief', '05', t.toc[4], 'paper part--grid part--brief', `${head(b)}
${steps(b.steps, briefBlocks)}
<aside class="aside aside--wide"><h3>${b.cutoffTitle}</h3><p>${b.cutoff}</p></aside>
<div class="brief-result"><h3>${b.resultTitle}</h3><p>${b.resultLead}</p></div>
<div class="versus">${b.results.map(figure).join('')}</div>
${table(b.trioHead, trio, 'table--trio')}
<p class="small">${b.trioNote}</p>
<div class="brief-config"><h3>${b.configTitle}</h3><p>${b.configText}</p>${code(facts.briefConfig, 'file', 'config.toml')}</div>
<div class="rules">${b.rules.map(([a, c]) => `<article class="rule"><h3>${a}</h3><p>${c}</p></article>`).join('')}</div>
<p class="part-foot">${b.foot}</p>`);

  const daily = section('daily', '06', t.toc[5], 'paper', `${head(d)}
${table(d.head, d.rows.map(([a, b, c]) => [a, `<code>${esc(b)}</code>`, c]), 'table--daily')}
<div class="split split--even"><div><h3>${d.answersTitle}</h3><dl class="answers">${d.answers.map(([k, v]) => `<div><dt><span class="badge badge--${k}">${k}</span></dt><dd>${v}</dd></div>`).join('')}</dl></div>
<div><h3>${d.settingsTitle}</h3>${table(d.settingsHead, d.settings.map(([a, b, c]) => [a === '—' ? '—' : `<code>${a}</code>`, `<code>${b}</code>`, c]), 'table--settings')}<p class="small">${d.settingsNote}</p></div></div>`);

  const trouble = section('trouble', '07', t.toc[6], 'ink', `${head({...tr, light: true})}
${table(tr.head, facts.errors.map((m, i) => [`<code>${esc(m)}</code>`, tr.fixes[i]]), 'table--trouble')}
<p class="part-foot">${tr.note}</p>`);

  const repeat = section('repeat', '08', t.toc[7], 'paper part--grid', `${head(rep)}
${steps(rep.steps, [code(facts.remember), code(facts.folders), code(facts.sessions)])}
<div class="versus versus--cc">${rep.results.map(r => `<figure class="shot"><figcaption class="shot__label"><span>${r.label}</span></figcaption>${shot(r.img, r.alt)}<p class="shot__text">${r.text}</p></figure>`).join('')}</div>
<p class="part-foot">${rep.note}</p>
<footer class="guide-footer"><img src="/assets/tengu-wordmark-horizontal${ru ? '' : '-en'}.svg" alt="TENGU" width="160" height="45"><p>${t.footer.checked} <code>${facts.v2Commit}</code></p><p class="guide-footer__links"><a href="${facts.source}" target="_blank" rel="noopener">${t.footer.source}<span aria-hidden="true"> ↗</span></a><a href="${facts.readme}" target="_blank" rel="noopener">${t.footer.readme}<span aria-hidden="true"> ↗</span></a></p><span class="guide-footer__motto">${t.footer.motto}</span></footer>`);

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11110f"><title>${t.meta.title}</title><meta name="description" content="${attr(t.meta.description)}"><meta property="og:title" content="${attr(t.meta.title)}"><meta property="og:description" content="${attr(t.meta.description)}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:image" content="https://tengucluster.com${self}assets/persona.jpg"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="ru" href="https://tengucluster.com${route('ru', 'chaos-kb')}"><link rel="alternate" hreflang="en" href="https://tengucluster.com${route('en', 'chaos-kb')}"><link rel="icon" href="/assets/tengu-mark-simplified.svg" type="image/svg+xml"><link rel="stylesheet" href="${css}"></head><body><a class="skip" href="#exercise">${t.skip}</a><header class="rail" aria-label="TENGU / 04"><div class="rail__brand"><img src="/assets/tengu-mark-simplified.svg" alt=""><span>TENGU</span></div><div class="rail__story"><span id="storyChapter">${attr(h.h1.replace(/<[^>]+>/g, ''))}</span><div class="rail__progress" aria-hidden="true"><i id="progressFill"></i></div></div><div class="rail__meta"><span id="sectionIndex">00</span><span>/</span><span>${num(ids.length)}</span></div></header><main id="deck">
${hero}
${exercise}
${how}
${install}
${connect}
${brief}
${daily}
${trouble}
${repeat}
</main><script src="${js}" defer></script></body></html>`;
}
