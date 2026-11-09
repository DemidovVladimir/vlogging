import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scenes,slug,sources,checked} from './content.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const ref='/Users/vladimirdemidov/.codex/skills/artifact-template-tengu-youtube/assets/source';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br=s=>esc(s).replace(/\n/g,'<br>');
const num=n=>String(n).padStart(2,'0');
const links=keys=>keys.map(k=>`<a href="${esc(sources[k][1])}" target="_blank" rel="noopener">${esc(sources[k][0])}<span aria-hidden="true"> ↗</span></a>`).join('');
const line=(d,from=0,extra='')=>`<path class="connection" data-from="${from}" pathLength="100" d="${d}" ${extra}/>`;
function svgText(x,y,text,css='',size=22){const parts=text.split('|');return `<text x="${x}" y="${y}" class="${css}" text-anchor="middle" style="font-size:${size}px">${parts.map((p,i)=>`<tspan x="${x}" dy="${i?24:0}">${esc(p)}</tspan>`).join('')}</text>`;}
function node(x,y,title,sub='',from=0,w=260,extra=''){
 const rows=[''];for(const word of title.split(' ')){if((rows.at(-1)+' '+word).trim().length>Math.floor(w/12)&&rows.at(-1))rows.push(word);else rows[rows.length-1]=(rows.at(-1)+' '+word).trim();}
 return `<g class="diagram-node" data-from="${from}" ${extra}><rect x="${x-w/2}" y="${y-48}" width="${w}" height="110"/>${svgText(x,y-(rows.length>1?18:5),rows.join('|'),'',22)}${svgText(x,y+37,sub,'micro',15)}<circle class="seal" cx="${x+w/2-15}" cy="${y-32}" r="5"/></g>`;
}
const svg=(body,label,id)=>`<svg class="technical-svg" viewBox="0 0 1120 350" role="img" aria-label="${esc(label)}"><defs><marker id="arrow-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#c92f20"/></marker></defs><g style="marker-end:url(#arrow-${id})">${body}</g></svg>`;
const cross=(x,y,from)=>`<g class="strike" data-from="${from}"><path d="M${x-13} ${y-13}l26 26m0-26l-26 26"/></g>`;
const cap=(s,l)=>`<p class="phase-caption" data-caption>${esc(s.frames[l][0])}</p>`;
const mobile=(s,l)=>{
 const a=s.labels[l],ru=l==='ru';let rows=[];
 if(s.kind==='chain')rows=[a[0]+' → '+a[2],a[2]+' → '+a[4],a[6]];
 if(s.kind==='ceremony')rows=[a[1]+' / '+a[0],a[2]+' → '+a[4],a[4]+' → '+a[5]];
 if(s.kind==='cross')rows=[a[0]+' → '+a[1]+' → '+a[2]+' (Q)',a[3]+' → '+a[4]+' (Q)',a[5],a[7]];
 if(s.kind==='attack')rows=[a[0]+' → '+a[1],a[0]+' → '+a[2]+' → '+a[1],a[5],a[7]];
 if(s.kind==='deploy')rows=[a[0]+': '+a[1],a[2]+': '+a[3],a[4]+': '+a[5]];
 return `<ol class="mobile-diagram">${rows.map((x,i)=>`<li data-from="${i}"><span>${num(i+1)}</span>${esc(x)}</li>`).join('')}</ol>`;
};

for(const lang of ['ru','en']){
 const ru=lang==='ru', suffix=ru?'':'-en',dir=path.join(root,lang),dist=path.join(dir,'dist');
 const w=(f,s)=>fs.writeFileSync(path.join(dir,f),s);
 const localized=scenes.map(s=>({...s,title:s.title[lang],lead:s.lead[lang],frames:s.frames[lang],labels:s.labels[lang],foot:s.foot[lang],script:s.script[lang]}));
 const heading=(s,i)=>`<span class="eyebrow"><b>${num(i)}</b> / TENGU · FIELD STUDY 03</span><h2>${br(s.title)}</h2><p class="episode-lead">${esc(s.lead)}</p>`;
 function diagram(s,i){const a=s.labels;let body='';
  if(s.kind==='chain'){
   body=line('M290 142H415',1)+line('M705 142H830',2)+node(150,140,a[0],a[1],0,280)+node(560,140,a[2],a[3],1,290)+node(970,140,a[4],a[5],2,280)+svgText(560,285,a[6],'audit-line',24);
  }else if(s.kind==='scalar'){
   return `<div class="scalar-layout"><div class="formula"><span><b>d</b><small>${esc(a[0])}</small></span><i>×</i><span><b>G</b><small>${esc(a[1])}</small></span><i>=</i><span><b>Q</b><small>${esc(a[2])}</small></span></div><div class="byte-field" aria-label="${esc(a[3])}">${Array.from({length:48},(_,j)=>`<span data-byte="${j}">${((j*73+31)%256).toString(16).padStart(2,'0').toUpperCase()}</span>`).join('')}</div><div class="scalar-result"><span data-from="1">${esc(a[3])}</span><b data-from="2">${esc(a[4])} → Q ✓</b></div></div>`;
  }else if(s.kind==='ceremony'){
   body=node(170,70,a[1],a[0],0,300)+node(170,240,a[2],a[3],0,300)+line('M320 240H420V160H465',1)+node(600,150,a[4],'',1,270)+line('M735 150H830',2)+node(970,150,a[5],'',2,260)+svgText(630,315,a[6],'audit-line',22);
  }else if(s.kind==='cross'){
   body=node(145,65,'emSign ECC','Root CA – G3',0,270)+line('M280 65H320',0)+node(455,65,'emSign Root TLS','CA – G3',0,270)+line('M590 65H645',0)+node(770,65,a[2],'Q',0,250)+node(145,235,'AAA Certificate','Services',1,270)+line('M280 235H645',1)+node(770,235,a[4],'Q',1,250)+line('M895 65H945V145H970',1)+line('M895 235H945V145H970',1)+`<g data-from="1"><circle class="key-ring" cx="1030" cy="145" r="44"/>${svgText(1030,158,'Q','key-letter',40)}${svgText(1030,225,ru?'Тот же|ключ CA':'Same|CA key','',20)}</g>`+cross(610,65,2)+cross(610,235,3)+`<g data-from="3">${svgText(560,338,a[7],'audit-line',24)}</g>`;
  }else if(s.kind==='attack'){
   body=`<g class="device"><rect x="40" y="70" width="180" height="110" rx="4"/><path d="M130 180v25M70 205h120"/></g>`+svgText(130,245,a[0])+`<g class="device"><rect x="900" y="60" width="180" height="135" rx="4"/><path d="M920 95h140m-140 33h140m-140 33h140"/></g>`+svgText(990,245,a[1])+`<g data-only="0">${line('M230 130H890')}${svgText(560,108,'TLS','micro',20)}</g><g data-from="1">${node(560,130,a[2],a[3],1,350)}${line('M230 130H385',1)}${line('M735 130H890',2)}</g><g data-from="2">${svgText(560,248,a[5],'audit-line',24)}</g><g data-from="3">${svgText(560,315,a[7],'audit-line',23)}</g>`;
  }else if(s.kind==='checks'){
   return `<div class="check-board"><div class="check-row" data-from="0"><b>${esc(a[0])}</b><span class="pass">✓ ${esc(a[1])}</span></div><div class="check-row" data-from="1"><b>${esc(a[2])}</b><span class="fail">× ${esc(a[3])}</span></div><div class="check-row" data-from="2"><b>${esc(a[4])}</b><span class="fail">× ${esc(a[5])}</span></div></div><div class="check-outcomes" data-from="3"><p>${esc(a[6])}<b class="fail">${esc(a[8])}</b></p><p>${esc(a[7])}<b>${esc(a[9])}</b></p></div>`;
  }else if(s.kind==='stores'){
   return `<div class="store-lanes">${[0,1,2].map(j=>`<div class="store-lane" data-from="${j}"><b>${esc(a[j*3])}</b><span class="arrow">→</span><code>${esc(a[j*3+1])}</code><span class="arrow">→</span><strong class="${j===1?'fail':''}">${esc(a[j*3+2])}</strong></div>`).join('')}</div><div class="build-inspect"><code>command -v curl</code><code>curl -V</code><span>${ru?'Путь и backend; не тест безопасности сами по себе.':'Path and backend; not a security test by themselves.'}</span></div>`;
  }else if(s.kind==='deploy'){
   body=node(165,150,a[0],a[1],0,290)+line('M310 150H415',1)+node(560,150,a[2],a[3],1,290)+line('M705 150H810',2)+node(955,150,a[4],a[5],2,290)+svgText(560,45,a[6],'audit-line',24)+svgText(560,295,a[7],'',22);
  }else if(s.kind==='test'){
   return `<div class="test-layout"><div class="test-terminal"><span>HTTPS / ${ru?'ВЫБОРОЧНАЯ ПРОВЕРКА':'SAMPLE CHECK'}</span><p>${esc(a[0])}</p><code>curl https://dv-g3b-emudhra.we-have-a-problem.com/</code><p>${esc(a[1])}</p><code>curl https://dv-g3b-aaa-emudhra.we-have-a-problem.com/</code></div><div class="test-results">${[0,1,2].map(j=>`<article data-from="${Math.min(j,1)}"><b>${esc(a[2+j*2])}</b><span>${esc(a[3+j*2])}</span></article>`).join('')}</div></div>`;
  }else if(s.kind==='response'){
   return `<div class="response-steps">${[0,1,2,3].map(j=>`<article data-from="${Math.min(j,2)}"><span>${num(j+1)}</span><h3>${esc(a[j*2])}</h3><p>${esc(a[j*2+1])}</p></article>`).join('')}</div><div class="response-warnings"><p>× ${esc(a[8])}</p><p>× ${esc(a[9])}</p></div>`;
  }
  return `<div class="diagram-wrap">${svg(body,s.lead,lang+'-'+i)}${mobile(scenes[i-1],lang)}</div>`;
 }
 const video=`<section class="scene scene--intro" id="intro" data-index="00" data-title="${ru?'Заставка':'Intro'}"><video id="introVideo" poster="assets/tengu-logo-sting-poster${suffix}.png" preload="metadata" playsinline><source src="assets/tengu-logo-sting${suffix}.mp4" type="video/mp4"></video><div class="intro__veil" id="introVeil"><span class="eyebrow eyebrow--light">TENGU FIELD MANUAL / EP.03</span><button class="start" id="startButton" type="button"><i></i><span>${ru?'Начать презентацию':'Start presentation'}</span><small>${ru?'Включится звук':'Sound will play'}</small></button></div></section>`;
 const sections=localized.map((s,index)=>{const i=index+1;let inner='';
  if(s.kind==='cover')inner=`<div class="scene__inner atlas-cover"><div class="atlas-cover__copy"><span class="eyebrow eyebrow--light"><b>01</b> / EMUDHRA · 22.10.2026</span><h1>${br(s.title)}</h1><p class="lead">${esc(s.lead)}</p><div class="cover-facts">${s.labels.map((x,j)=>`<span>${j===0?'<b>08</b>':''}${esc(x)}</span>`).join('')}</div><p class="phase-caption" data-caption>${esc(s.frames[0])}</p><p class="scene-foot">${esc(s.foot)} ${links(s.src)}</p></div><figure class="atlas-cover__art"><img src="assets/tengu-kaiju-v23.png" width="768" height="1024" alt="${ru?'Биомеханический кайдзю TENGU':'TENGU biomechanical kaiju'}"><figcaption>TENGU <span>FIELD STUDY / 03</span></figcaption></figure></div>`;
  else if(s.kind==='closing')inner=`<div class="scene__inner episode-inner">${heading(s,i)}<div class="closing-layout"><div><ol class="close-questions">${s.labels.map((x,j)=>`<li data-from="${j}">${esc(x)}</li>`).join('')}</ol><div class="source-grid">${links(s.src)}</div></div><div class="closing-cast"><div class="closing-machines"><img class="closing-kaiju" src="assets/tengu-kaiju-complete-v33.png" alt="${ru?'Полный силуэт кайдзю TENGU':'Full TENGU kaiju silhouette'}"><img class="closing-robot" src="assets/tengu-robot-v23.png" alt="${ru?'Робот TENGU':'TENGU robot'}"></div><img class="closing-logo" src="assets/tengu-wordmark-horizontal${suffix}.svg" alt="TENGU"></div></div>${cap(scenes[index],lang)}<p class="scene-foot">${esc(s.foot)}</p></div>`;
  else inner=`<div class="scene__inner episode-inner">${heading(s,i)}${diagram(s,i)}${cap(scenes[index],lang)}<p class="scene-foot">${esc(s.foot)} <span class="source-line">${links(s.src)}</span></p></div>`;
  return `<section class="scene ${['cover','attack'].includes(s.kind)?'ink':'paper scene--grid'} episode-scene ${s.kind}-scene" id="slide-${i}" data-index="${num(i)}" data-title="${esc(s.title.replace(/\n/g,' '))}" data-frame="0">${inner}</section>`;
 });
 const base=`https://tengucluster.com/${ru?'':'en/'}episodes/${slug}/`,title=ru?'eMudhra: восемь бит доверия — TENGU':'eMudhra: eight bits of trust — TENGU';
 const html=`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11110f"><title>${title}</title><meta name="description" content="${esc(localized[0].lead)}"><meta property="og:title" content="${title}"><meta property="og:description" content="${esc(localized[0].lead)}"><meta property="og:type" content="website"><meta property="og:url" content="${base}"><meta property="og:image" content="${base}assets/tengu-logo-sting-poster${suffix}.png"><link rel="canonical" href="${base}"><link rel="alternate" hreflang="ru" href="https://tengucluster.com/episodes/${slug}/"><link rel="alternate" hreflang="en" href="https://tengucluster.com/en/episodes/${slug}/"><link rel="icon" href="assets/tengu-mark-simplified.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="atlas.css"><link rel="stylesheet" href="episode.css"></head><body><a class="skip" href="#slide-1">${ru?'К презентации':'Skip intro'}</a><header class="rail" aria-label="TENGU / 03"><div class="rail__brand"><img src="assets/tengu-mark-simplified.svg" alt=""><span>TENGU</span></div><div class="rail__story"><span id="storyChapter">${ru?'Заставка':'Intro'}</span><div class="rail__progress" aria-hidden="true"><i id="progressFill"></i></div></div><div class="rail__meta"><span id="sectionIndex">00</span><span>/</span><span>12</span></div></header><main id="deck">${video}${sections.join('\n')}</main><script src="journey.js"></script><script src="app.js"></script></body></html>`;
 w('dist/index.html',html);w('dist/episode.css',fs.readFileSync(path.join(root,'episode.css')));
 const original=fs.readFileSync(path.join(ref,'dist/en/app.js'),'utf8');
 const init=original.slice(0,original.indexOf('const storySelectors'));
 let tail=original.slice(original.indexOf('function animationTime()'));
 tail=tail.slice(0,tail.indexOf('function renderScene()'))+fs.readFileSync(path.join(root,'render.js'),'utf8')+'\n'+tail.slice(tail.indexOf('function syncScene()'));
 tail=tail.replace('Math.floor(animationTime() / timing.duration + 1e-6) % timing.count','Math.min(timing.count - 1, Math.floor(animationTime() / timing.duration + 1e-6))');
 tail=tail.replace("const legacy = { 'slide-4': 'slide-3', 'slide-5': 'slide-6', 'slide-11': 'slide-13' };",'const legacy = {};');
 if(ru)tail=tail.replace("'Try again'","'Попробовать снова'");
 const motion=localized.map(s=>({frames:s.frames,kind:s.kind}));
 w('dist/app.js',init+`const motion=${JSON.stringify(motion)};\nfunction sceneTiming(){const i=Number(currentScene.dataset.index)-1;return i<0?null:{count:motion[i].frames.length,duration:10};}\n`+tail);
 const journey=fs.readFileSync(path.join(ref,'dist/en/journey.js'),'utf8');
 w('dist/journey.js','const journeyBeats='+JSON.stringify(Object.fromEntries([['intro',ru?'Заставка':'Intro'],...localized.map((s,i)=>['slide-'+(i+1),s.title.replace(/\n/g,' ')])]))+';\n'+journey.slice(journey.indexOf('let travelState')));
 const intro=ru?'[Запустить MP4 со звуком. Дать закончиться заставке, затем перейти к 01.]':'[Start the MP4 with sound. Let it finish, then move to 01.]';
 const script=`# TENGU EP.03 — ${title}\n\n${ru?'Расширенный технический выпуск, ориентир 9 минут с паузами. Оценка, не измеренная запись. Квадратные скобки не произносить; жирные переходы произносить.':'Extended technical episode, around nine minutes including pauses. Estimate, not a measured recording. Bracketed directions are not spoken; bold bridges are spoken.'}\n\n## 00 / ${ru?'Заставка':'Intro'}\n\n${intro}\n\n`+localized.map((s,i)=>`## ${num(i+1)} / ${s.title.replace(/\n/g,' ')}\n\n[${ru?'R; затем → по смысловым фазам, не по таймеру.':'R; then → through the visual phases, following the explanation.'}]\n\n${s.script}\n`).join('\n');
 let elapsed=3;const stamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
 const plan=`# TENGU EP.03 — ${ru?'Режиссёрский план':'Director’s plan'}\n\n${ru?'Задача: зритель может найти реальную точку TLS-проверки и понять, почему отзыв CA ещё не гарантирует защиту приложения. Подробность повышена по просьбе автора.':'Goal: the viewer can identify the actual TLS verifier and explain why CA revocation alone does not prove application protection. More technical detail is intentional.'}\n\n## 00 / ${ru?'Заставка':'Intro'} — 00:00–00:03\n\n${intro}\n\n`+localized.map((s,i)=>{const start=elapsed;elapsed+=s.seconds;return `## ${num(i+1)} / ${s.title.replace(/\n/g,' ')} — ${stamp(start)}–${stamp(elapsed)}\n\n${s.lead}\n\n${s.frames.map((x,j)=>`- ${num(j+1)}: ${x}`).join('\n')}\n\n${s.foot}\n`;}).join('\n')+`\n## ${ru?'Управление':'Controls'}\n\nP pause/resume; R reset paused; ←/→ phases; −/+ speed (0.25×–2×); 0 normal. Down/PageDown/Space next; Up/PageUp/Shift+Space previous; Home/End intro/closing. Wheel/touch scroll naturally. Reduced motion uses the last phase; manual steps still work. Diagrams hold at the final phase. Controls do not scrub the MP4.\n\n${ru?'Записывать только презентацию. Локальный script.html держать в другом окне. Слайды не выполняют показанные команды, не проверяют сертификаты зрителя и не отправляют запросы к тестовым endpoints.':'Record only the presentation; keep the local script.html in another window. Slides do not execute displayed commands, test the viewer’s certificates or contact test endpoints.'}\n`;
 for(const [name,data]of [[`SCRIPT-${lang.toUpperCase()}.md`,script],[`STORY-PLAN-${lang.toUpperCase()}.md`,plan]]){w(name,data);w('dist/'+name,data);}
 w('dist/script.html',fs.readFileSync(path.join(dist,'script.html'),'utf8').replaceAll('EP.01','EP.03'));
 w('README.md',`# TENGU EP.03 / ${lang.toUpperCase()}\n\n${title}\n\nPrivate working edition. Never publish dist/ wholesale.\n\nLocal: node ../serve.mjs (from the episode root), then http://127.0.0.1:4175/${lang}/dist/ . Narration: script.html ; plan: script.html?view=plan .\n\nPublic address after verified publication: ${base}\n\nControls: P pause; R reset; ←/→ phases; −/+ speed; 0 normal; Up/Down scenes. Click intro for sound. No live TLS testing is performed by the page.\n\nEvidence checked ${checked}; see SOURCES.md. Extended technical format intentionally exceeds the standard five-minute template.\n`);
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'episode.json')));Object.assign(meta,{copiedReferenceContent:false,status:'draft',plannedPauseSeconds:42,wordsPerMinute:ru?140:140,targetSeconds:540,targetDurationSeconds:540,durationOverride:'User explicitly requested a more detailed and technical episode.',evidenceCheckedAt:checked});w('episode.json',JSON.stringify(meta,null,2)+'\n');
 console.log(lang+': '+(localized.length+1)+' scenes, '+localized.reduce((n,s)=>n+s.frames.length,0)+' phases.');
}
