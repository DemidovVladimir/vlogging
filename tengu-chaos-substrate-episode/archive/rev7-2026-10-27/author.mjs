// Builds the two LOCAL editions of EP.05. NOT the public publisher.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {editions, facts} from './content.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const reference='/Users/vladimirdemidov/.claude/skills/artifact-template-tengu-youtube/assets/source';
const slug='chaos-substrate';
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const br=s=>e(s).replace(/\n/g,'<br>');
const num=n=>String(n).padStart(2,'0');
const stages=[2,5,4,4,4,4,4,3];
const durations=[11,8,9,9,9,9,9,8];
const sources=`# TENGU EP.05 — Chaos Substrate: evidence ledger

Checked 2026-10-27. Firsthand measurements on the owner's machine; no paid services, no network calls except Ollama on localhost and the public GitHub clone. Raw outputs are kept privately in the session scratchpad evidence folder (A*, S*, B* files) and are not published.

## Environment

Apple M4 (10 cores, 16 GiB), macOS 26.6.2. Ollama 0.24.0 with embeddinggemma (768 dimensions). PostgreSQL 16.15 + pgvector 0.8.2 in Docker. chaos 1.1.0 (code published on branch v2 as ${facts.toolCommit}; the measured binary was built from the same tree before a formatting-only change). chaos-kb 2.0.0.

## Claims and evidence

| Claim on screen / in narration | Evidence | Boundary |
| --- | --- | --- |
| Index of Chaos's own code: 96 files, 1,690 units (chunks), 3,944 links (edges), 33 features (communities), 241.51 s | \`chaos index\` on a fresh clone of public branch v2 @ ${facts.measuredCommit} (S2) | One machine, one run. Times depend on hardware and embedder; counts reproduce for the same commit and binary. The run also reported 1,917 graph nodes and 88 file hashes in the Merkle roll-up. |
| \`reindex\` without --force is skipped in 0.02 s | S3: "HEAD … equals indexed commit and worktree is clean" | This skip uses Git (commit + clean worktree), not the Merkle tree. Said explicitly on screen. |
| \`reindex --force\`: 0 of 1,690 embedded again, 20.64 s | S4 | Embeddings are reused by content hash. Chunk building still runs. |
| One-line edit in src/domain/budget.rs inside pack(): \`chaos add\` re-read 1 file, embedded 5 units, rebuilt 3 of 33 summaries (4 communities changed), 1.73 s | S5a | \`add\` re-embeds the chunks of the changed file whose text changed; a later revert re-embedded 5 chunks again (old vectors were purged with the old chunks). \`add\` can lose a few edges compared with a full index (3,944 → 3,942 here); not claimed equal to a full index. |
| Reverting the edit returns the root hash to the original value | S5b: root back to fa137032258dc89293273ed4ff956567725ce169c2cedfb5aeccd5d5e559e3b6 | Not used on screen; supports "equal content, equal hash". |
| Merkle roll-up: chunk SHA-256 → file → community (feature) → repository root | src/domain/merkle.rs and src/domain/hash.rs at ${facts.toolCommit} | The root is computed from all file hashes; feature hashes are a parallel roll-up over member files. Summaries are recomputed only when a feature's hash (plus model) changed (src/application/index.rs rebuild_hierarchy). |
| \`feature "how are embeddings reused on reindex"\`: 5 routed features covering 39 files, 11 excerpts, 16 edges, 6,000 tokens, 0.20 s; second run page_cached = true, 0.16 s | S6a, S6b (content_hash 098c4f17d67ee8b3a7e19d69af4497483059ad77a91931c7cf5db08d4d36afad) | Five of the eleven excerpts are shown. The routed feature labels are not shown (they are machine labels). |
| Cross-repo answers in 1.1: same question per repo, links only when a retrieved symbol name (identifier-shaped, ≥ 6 chars) occurs as a whole word in another repo's retrieved code; budget split evenly | src/application/project_feature.rs at ${facts.toolCommit} | The four-lane diagram uses invented names (labelled on screen). The measured line (5,803 tokens, 13 excerpts, 7 links at 4 × 1,500 tokens) comes from the owner's private four-repository project; no names or code from it are shown. |
| chaos-kb check: exact words of a stored paragraph → fingerprint lookup among the Merkle leaves, no embedding, 0.04 s | B3a3 (Kitchen.md:10, presence exact); README "Speed" (0.04 s at 1 note and 503 notes) | "Exact" means a whole stored paragraph, normalized for case, spacing and punctuation. One sentence of a two-line paragraph is found by meaning instead (B3a). |
| Paraphrase → similar 0.56 (Car.md:5–6), 0.18 s; unrelated → absent 0.20, 0.15 s; threshold 0.38 | B3b, B3c; v2 README calibration note | Scores are from embeddinggemma; another embedder gives other scores. |
| remember → root ${facts.rootAfter}; forget → root back to ${facts.rootBefore}; note bytes identical | B4a–B4e | After forget, \`check\` on that fact still returned "similar" (0.45) because a neighbouring paragraph is close. The page does not claim "unknown" after forget. |
| Ralph Merkle described hash trees in 1979 (US patent 4,309,569, filed 1979, granted 1982) | https://patents.google.com/patent/US4309569A/en | Narration says "described in 1979". |
| Git object ids are hashes of content that include child ids (a Merkle-style structure) | https://git-scm.com/book/en/v2/Git-Internals-Git-Objects | Said as "Git stores its history the same way" — the principle, not the same hash function. |
| Author facts: senior AI/ML engineer, agentic systems and LLMOps, 10+ years in production software, Rust / TypeScript / Python | Owner's chaos-kb vault: Profile.md:3-5, Skills.md:3, Skills.md:7 | By the owner's choice: no name, employer or location. |

## Public links on the closing scene

- ${facts.repoUrl}
- ${facts.kbUrl}
- https://tengucluster.com/episodes/chaos-kb/ and https://tengucluster.com/en/episodes/chaos-kb/

## Deliberate omissions

No private repository names, paths or code. No claim that cross-repo links find every relation (they need exact names). No speed comparison against other tools. The \`doctor\` output was not used because it lists private local paths.
`;

for(const [lang,t] of Object.entries(editions)){
 const dir=path.join(root,lang), suffix=lang==='en'?'-en':'';
 const write=(file,data)=>fs.writeFileSync(path.join(dir,file),data);
 const captions=[t.coverStates.map(x=>x[1]),t.stageNotes,t.treeNotes,t.addNotes,t.featureNotes,t.crossNotes,t.checkNotes,t.closeLines];
 const heading=i=>`<span class="eyebrow"><b>${num(i)}</b> / ${e(t.chapters[i])}</span><h2>${br(t.titles[i])}</h2>${t.leads[i]?`<p class="episode-lead">${e(t.leads[i])}</p>`:''}`;
 const caption=i=>`<p class="phase-caption" data-caption>${e(captions[i-1][0])}</p>`;
 const foot=txt=>`<p class="scene-foot">${e(txt)}</p>`;
 const section=(i,body,extra='')=>`<section class="scene paper scene--grid episode-scene ${extra}" id="slide-${i}" data-index="${num(i)}" data-title="${e(t.chapters[i])}" data-frame="0"><div class="scene__inner episode-inner">${heading(i)}${body}</div></section>`;

 // 03 — Merkle tree. Root from all files; features roll up their files in parallel.
 const tr=t.tree, fx=[235,445,675,885], rootX=560;
 const unitX=fx.flatMap(x=>[x-48,x+48]);
 const hot=(file,unit)=>file===2&&(unit===undefined||unit===0);
 const badge=(x,y,changed)=>`<g class="mk-badge${changed?' is-changed':''}" data-show="3"><circle cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y+5}" text-anchor="middle">${changed?'≠':'='}</text></g>`;
 const treeSvg=`<svg class="merkle-svg" viewBox="0 0 1000 310" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${e(tr.levels.join(' · '))}">
<g class="mk-levels">${tr.levels.map((l,i)=>`<text x="0" y="${[48,118,164,282][i]}">${e(l)}</text>`).join('')}</g>
<g class="mk-up" data-on="1">${fx.map((x,i)=>`<path class="${hot(i)?'mk-path':''}" d="M${x} 140 L${rootX} 66"/>`).join('')}</g>
<g class="mk-down" data-on="1">${unitX.map((x,i)=>`<path class="${hot(Math.floor(i/2),i%2)?'mk-path':''}" d="M${x} 252 L${fx[Math.floor(i/2)]} 184"/>`).join('')}</g>
${[0,1].map(f=>`<g class="mk-feat${f===1?' mk-path':''}" data-on="1"><rect x="${f?585:140}" y="98" width="390" height="98" rx="14"/><text x="${f?600:155}" y="120">${e(tr.features[f])}</text></g>`).join('')}
<g class="mk-root mk-path" data-on="1"><rect x="${rootX-85}" y="20" width="170" height="46" rx="8"/><text x="${rootX}" y="50" text-anchor="middle">${e(tr.root)}</text></g>
${fx.map((x,i)=>`<g class="mk-file${hot(i)?' mk-path':''}" data-on="1"><rect x="${x-85}" y="140" width="170" height="44" rx="6"/><text x="${x}" y="169" text-anchor="middle">${e(tr.files[i])}</text></g>`).join('')}
${unitX.map((x,i)=>`<g class="mk-unit${hot(Math.floor(i/2),i%2)?' mk-path mk-edited':''}" data-on="0"><rect x="${x-43}" y="252" width="86" height="40" rx="6"/><text x="${x}" y="278" text-anchor="middle">${e(hot(Math.floor(i/2),i%2)?tr.edited:tr.unit)}</text></g>`).join('')}
${badge(rootX+85,20,true)}${fx.map((x,i)=>badge(x+85,140,hot(i))).join('')}${[0,1].map(f=>badge(f?975:530,98,f===1)).join('')}${unitX.map((x,i)=>badge(x+43,252,hot(Math.floor(i/2),i%2))).join('')}
</svg><ol class="mobile-list mobile-merkle">${[[tr.levels[3],tr.edited],[tr.levels[2],tr.files[2]],[tr.levels[1],tr.features[1]],[tr.levels[0],tr.root]].map(([a,b])=>`<li><span>${e(a)}</span><b>${e(b)}</b></li>`).join('')}</ol>`;

 // 06 — cross-repo lanes (illustrative names).
 // The definition sits left; the three repos that mention it share one column,
 // so every link fans out to the right without crossing another box.
 const laneY=[0,80,160,240], boxX=[170,560,560,560];
 const box=(lane,x,label,cls='')=>`<g class="ln-box ${cls}"><rect x="${x}" y="${laneY[lane]+16}" width="250" height="42" rx="7"/><text x="${x+125}" y="${laneY[lane]+43}" text-anchor="middle">${e(label)}</text></g>`;
 const curve=(lane)=>{const x1=boxX[0]+250,y1=laneY[0]+37,x2=boxX[lane],y2=laneY[lane]+37;return `<path d="M${x1} ${y1} C${x1+80} ${y1} ${x2-80} ${y2} ${x2} ${y2}"/>`;};
 const lanesSvg=`<svg class="lanes-svg" viewBox="0 0 1000 316" preserveAspectRatio="xMinYMid meet" role="img" aria-label="${e(t.lanes.join(' · '))}">
${laneY.map((y,i)=>`<g class="ln-lane"><rect x="0" y="${y+4}" width="1000" height="66" rx="10"/><text x="16" y="${y+43}">${e(t.lanes[i])}</text></g>`).join('')}
<g class="ln-links" data-show="1">${[1,2,3].map(curve).join('')}</g>
${t.laneSymbols.map((s,i)=>box(i,boxX[i],s,i===0?'ln-def':'')).join('')}
<g class="ln-term" data-show="1"><text x="${boxX[0]+258}" y="${laneY[0]+28}">depositFor</text></g>
<g class="ln-rejected" data-show="2">${t.rejected.map(([w,why],i)=>`<g><rect x="${[560,790][i]}" y="16" width="${[218,200][i]}" height="42" rx="7"/><text class="ln-word" x="${[574,804][i]}" y="43">${e(w)}</text><text class="ln-why" x="${[766,978][i]}" y="43" text-anchor="end">${e(why)}</text></g>`).join('')}</g>
</svg><ol class="mobile-list mobile-lanes">${t.lanes.map((l,i)=>`<li><span>${e(l)}</span><b>${e(t.laneSymbols[i])}</b></li>`).join('')}</ol><p class="chip-line" data-show="3">${e(t.budgetChip)}</p>`;

 const scenes=[
 `<section class="scene scene--intro" id="intro" data-index="00" data-title="${e(t.chapters[0])}"><video id="introVideo" poster="assets/tengu-logo-sting-poster${suffix}.png" preload="metadata" playsinline><source src="assets/tengu-logo-sting${suffix}.mp4" type="video/mp4"></video><div class="intro__veil" id="introVeil"><span class="eyebrow eyebrow--light">TENGU FIELD MANUAL / EP. 05</span><button class="start" id="startButton" type="button"><i></i><span>${e(t.start)}</span><small>${e(t.sound)}</small></button></div></section>`,
 `<section class="scene ink episode-scene substrate-cover" id="slide-1" data-index="01" data-title="${e(t.chapters[1])}" data-frame="0"><div class="scene__inner atlas-cover"><div class="atlas-cover__copy"><span class="eyebrow eyebrow--light"><b>01</b> / ${e(t.chapters[1])}</span><h1>${br(t.titles[1])}</h1><p class="lead">${e(t.leads[1])}</p><div class="cover-output"><span data-cover-label>${e(t.coverStates[0][0])}</span><p data-caption>${e(t.coverStates[0][1])}</p></div></div><figure class="atlas-cover__art"><img src="assets/tengu-kaiju-v23.png" width="768" height="1024" alt="${lang==='ru'?'Биомеханический кайдзю TENGU':'TENGU biomechanical kaiju'}"><figcaption>TENGU <span>FIELD STUDY / 05</span></figcaption></figure></div></section>`,
 section(2,`<div class="pipe">${t.stages.map((s,j)=>`<article data-on="${j}"><span>${num(j+1)}</span><h3>${e(s[0])}</h3><b>${e(s[1])}</b><p>${e(s[2])}</p></article>`).join('')}</div>${caption(2)}${foot(t.indexFoot)}`),
 section(3,`<div class="merkle-canvas">${treeSvg}</div>${caption(3)}${foot(t.treeFoot)}`),
 section(4,`<p class="edit-strip"><code>${e(t.edit)}</code></p><div class="delta-board">${t.addRows.map((r,j)=>`<article data-on="${Math.min(j+1,3)}"><span class="step-number">${num(j+1)}</span><h3>${e(r[0])}</h3><b>${e(r[1])}</b></article>`).join('')}</div>${caption(4)}${foot(t.addFoot)}`),
 section(5,`<div class="ask-board"><ol class="route">${t.route.map((s,j)=>`<li data-on="${[0,0,1,2,3][j]}"><span>${num(j+1)}</span>${e(s)}</li>`).join('')}</ol><div class="excerpts" data-on="1"><span class="excerpts__title">${e(t.excerptsTitle)}</span><ol>${t.excerpts.map(([p,l,s])=>`<li><code>${e(p)}:${e(l)}</code><b>${e(s)}</b></li>`).join('')}</ol><p class="chip-line" data-show="3">${e(t.featureChip)}</p></div></div>${caption(5)}${foot(t.featureFoot)}`),
 section(6,`<div class="lanes-canvas">${lanesSvg}</div>${caption(6)}${foot(t.crossFoot)}`),
 section(7,`<div class="check-board">${t.checks.map((c,j)=>`<article data-on="${j}"><q>${e(c[0].replace(/^[«“]|[»”]$/g,''))}</q><span>${e(c[1])}</span><b class="verdict v${j}">${e(c[2])}</b><small>${e(c[3])}</small></article>`).join('')}</div><dl class="root-line" data-show="3">${[[t.rootLabels[0],facts.rootBefore,''],[t.rootLabels[1],facts.rootAfter,' is-changed'],[t.rootLabels[2],facts.rootBefore,' is-back']].map(([k,v,c])=>`<div class="${c.trim()}"><dt>${e(k)}</dt><dd><code>${v}</code></dd></div>`).join('')}</dl>${caption(7)}${foot(t.checkFoot)}`),
 `<section class="scene paper scene--grid episode-scene substrate-close" id="slide-8" data-index="08" data-title="${e(t.chapters[8])}" data-frame="0"><div class="scene__inner episode-inner">${heading(8)}<div class="substrate-closing-layout"><div><ol class="close-questions">${t.closeLines.map((s,i)=>`<li data-close="${i}">${e(s)}</li>`).join('')}</ol><p class="closing-note">${e(t.closeNote)}</p><p class="author-note">${e(t.author)}</p><div class="substrate-sources">${[facts.repoUrl,facts.kbUrl,t.kbEpisode].map((url,i)=>`<a href="${url}" target="_blank" rel="noopener">${e(t.links[i])}<span aria-hidden="true">↗</span></a>`).join('')}</div></div><div class="closing-cast"><div class="closing-machines"><img class="closing-kaiju" src="assets/tengu-kaiju-complete-v33.png" width="1024" height="1536" alt="${lang==='ru'?'Полный силуэт кайдзю TENGU':'Full TENGU kaiju silhouette'}"><img class="closing-robot" src="assets/tengu-robot-v23.png" width="768" height="1024" alt="${lang==='ru'?'Робот TENGU':'TENGU robot'}"></div><img class="closing-logo" src="assets/tengu-wordmark-horizontal${suffix}.svg" alt="TENGU"></div></div>${foot(t.footer)}</div></section>`
 ];
 const base=`https://tengucluster.com/${lang==='en'?'en/':''}episodes/${slug}/`;
 const html=`<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#11110f"><title>${e(t.title)}</title><meta name="description" content="${e(t.description)}"><meta property="og:title" content="${e(t.title)}"><meta property="og:description" content="${e(t.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${base}"><meta property="og:image" content="${base}assets/tengu-logo-sting-poster${suffix}.png"><link rel="canonical" href="${base}"><link rel="alternate" hreflang="ru" href="https://tengucluster.com/episodes/${slug}/"><link rel="alternate" hreflang="en" href="https://tengucluster.com/en/episodes/${slug}/"><link rel="icon" href="assets/tengu-mark-simplified.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="atlas.css"><link rel="stylesheet" href="episode.css"></head><body><a class="skip" href="#slide-1">${e(t.skip)}</a><header class="rail" aria-label="TENGU / 05"><div class="rail__brand"><img src="assets/tengu-mark-simplified.svg" alt=""><span>TENGU</span></div><div class="rail__story"><span id="storyChapter">${e(t.chapters[0])}</span><div class="rail__progress" aria-hidden="true"><i id="progressFill"></i></div></div><div class="rail__meta"><span id="sectionIndex">00</span><span>/</span><span>08</span></div></header><main id="deck">${scenes.join('\n')}</main><script src="journey.js"></script><script src="app.js"></script></body></html>\n`;
 write('dist/index.html',html);
 write('dist/episode.css',fs.readFileSync(path.join(root,'episode.css')));
 const original=fs.readFileSync(path.join(reference,'dist/en/app.js'),'utf8');
 const init=original.slice(0,original.indexOf('const storySelectors'));
 let tail=original.slice(original.indexOf('function animationTime()'));
 tail=tail.slice(0,tail.indexOf('function renderScene()'))+fs.readFileSync(path.join(root,'render.js'),'utf8')+'\n'+tail.slice(tail.indexOf('function syncScene()'));
 tail=tail.replace('Math.floor(animationTime() / timing.duration + 1e-6) % timing.count','Math.min(timing.count - 1, Math.floor(animationTime() / timing.duration + 1e-6))');
 tail=tail.replace("const legacy = { 'slide-4': 'slide-3', 'slide-5': 'slide-6', 'slide-11': 'slide-13' };",'const legacy = {};');
 if(lang==='ru')tail=tail.replace("'Try again'","'Попробовать снова'");
 const motion={captions,cover:t.coverStates};
 const timing=`const phaseCounts=${JSON.stringify(stages)};\nconst phaseDurations=${JSON.stringify(durations)};\nconst motion=${JSON.stringify(motion)};\nfunction sceneTiming(){ const i=Number(currentScene.dataset.index)-1; return i<0?null:{count:phaseCounts[i],duration:phaseDurations[i]}; }\n`;
 write('dist/app.js',init+timing+tail);
 const journey=fs.readFileSync(path.join(reference,'dist/en/journey.js'),'utf8');
 write('dist/journey.js','// Restrained transition; continuity comes from the story.\nconst journeyBeats='+JSON.stringify(Object.fromEntries(t.chapters.map((s,i)=>[i?'slide-'+i:'intro',s])))+';\n'+journey.slice(journey.indexOf('let travelState')));
 const preface=lang==='ru'?'Разговорный сценарий. Жирные фразы — произносимые переходы; квадратные скобки — указания, не читать. Около пяти минут с паузами; это оценка, не замер чтения ведущего.':'Spoken script. Bold bridges are spoken; bracketed cues are not. About five and a half minutes including pauses; estimated, not a timed presenter read.';
 const script=`# TENGU EP.05 — ${t.title}\n\n${preface}\n\n`+t.script.map((s,i)=>`## ${num(i)} / ${t.titles[i].replace(/\n/g,' ')}\n\n${s}\n`).join('\n');
 const planPreamble=lang==='ru'?'История: агент каждый раз перечитывает код → индекс один раз → хеши, собранные в дерево → после правки только разница → ответ из индекса → вопрос сразу по нескольким репозиториям → «это уже известно?» в chaos-kb → порядок работы и границы. Все числа — замеры 27.10.2026; схема с дорожками — иллюстрация с выдуманными именами.':'Story: the agent rereads code every time → index once → hashes combined into a tree → after an edit only the difference → answers from the index → one question across repositories → “already known?” in chaos-kb → routine and limits. Every number was measured on 27.10.2026; the four-lane diagram is an illustration with invented names.';
 let elapsed=3;const stamp=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
 const spokenWords=s=>s.split('\n').filter(l=>l.trim()&&!/^\s*\[.*\]\s*$/.test(l)).join(' ').replaceAll('**','').split(/\s+/).filter(Boolean).length;
 const timecodes=['00:00–00:03',...t.script.slice(1).map(s=>{const start=elapsed;elapsed+=Math.round(spokenWords(s)/(lang==='ru'?140:135)*60+3);return stamp(start)+'–'+stamp(elapsed);})];
 const plan=`# TENGU EP.05 — ${lang==='ru'?'Режиссёрский план':'Director’s plan'}\n\n${planPreamble}\n\n`+t.titles.map((s,i)=>`## ${num(i)} / ${s.replace(/\n/g,' ')} — ${timecodes[i]}\n\n${i===0?(lang==='ru'?'Нажать запуск, дать закончиться MP4 со звуком.':'Click to start the MP4 with sound; let it finish.'):(lang==='ru'?'Фазы (R, затем → по мере объяснения):':'Phases (R, then → as you explain):')+'\n\n'+captions[i-1].map(c=>'- '+c).join('\n')}\n`).join('\n')+`\n## ${lang==='ru'?'Управление и запись':'Controls & recording'}\n\n- P: pause/resume; R: reset paused; ← / →: phase back/forward, paused.\n- − / +: 0.25×–2×; 0: normal speed.\n- Down / PageDown / Space: next; Up / PageUp / Shift+Space: previous. Home / End: intro / closing.\n- Wheel / touch: natural scroll. Hidden tabs freeze diagrams. Reduced motion: final phase, manual stepping still works.\n- Diagrams hold their final phase rather than looping. Controls do not scrub the MP4.\n- Record the deck only. Keep script.html and ?view=plan in a separate LOCAL window/device.\n- ${lang==='ru'?'Замедлиться на дереве Меркла (03) и на корне в 07: это главная мысль. Хеши в 07 не читать вслух.':'Slow down on the Merkle tree (03) and the root line in 07: that is the main idea. Do not read the hashes in 07 aloud.'}\n`;
 for(const [name,data] of [[`SCRIPT-${lang.toUpperCase()}.md`,script],[`STORY-PLAN-${lang.toUpperCase()}.md`,plan]]){write(name,data);write('dist/'+name,data);}
 write('SOURCES.md',sources);
 // Same normalization as new-episode.mjs: the English reader lives at the edition root.
 const reader=fs.readFileSync(path.join(reference,lang==='en'?'dist/en/script.html':'dist/script.html'),'utf8').replaceAll('EP.01','EP.05')
  .replaceAll('"../assets/','"assets/').replaceAll('"../styles.css"','"styles.css"').replaceAll('"../atlas.css"','"atlas.css"');
 write('dist/script.html',reader);
 write('README.md',`# TENGU EP.05 / ${lang.toUpperCase()}\n\n${t.title}\n\nPrivate working edition. Never publish dist/ wholesale: it includes narration and the director’s plan.\n\nLocal: run the parent serve.mjs, then open http://127.0.0.1:4176/${lang}/dist/ . Private narration: script.html ; private plan: script.html?view=plan .\n\nPublic viewer (deployed 27.10.2026, production f10900f3-6682-4105-8776-9506d561d077, revision 7): ${base} . Release workspace: ../../tengu-chaos-substrate-release/ (README.md, deployment-record.json).\n\nP pause; R reset; ←/→ phases; −/+ speed; 0 normal; Up/Down scenes. Click intro for sound. See STORY-PLAN-${lang.toUpperCase()}.md for timing and cues.\n\nNumbers: measured 27.10.2026 (SOURCES.md). Tool: chaos 1.1.0, ${facts.toolCommit}.\n`);
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'episode.json')));
 Object.assign(meta,{copiedReferenceContent:false,plannedPauseSeconds:25,wordsPerMinute:lang==='ru'?140:135,status:meta.status==='ready'?'ready':'draft',slug,toolCommit:facts.toolCommit,measuredCommit:facts.measuredCommit});
 write('episode.json',JSON.stringify(meta,null,2)+'\n');
 console.log(`Authored ${lang}: ${scenes.length} scenes, ${t.script.slice(1).reduce((n,s)=>n+spokenWords(s),0)} spoken words. Private script kept separate.`);
}
