#!/usr/bin/env node
// Structural guard, not a replacement for fact-checking or rendered visual QA.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2);
if(args.includes('--help')){console.log('node check-episode.mjs <EPISODE_DIRECTORY> [--allow-draft]');process.exit(0);}
if(!args[0])throw new Error('Supply the episode directory.');
const root=path.resolve(args[0]),dist=path.join(root,'dist');
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const errors=[],warnings=[];
async function read(file){try{return await fs.readFile(path.join(root,file),'utf8');}catch{errors.push('Missing '+file);return '';}}
const configText=await read('episode.json');
let config={};try{config=JSON.parse(configText);}catch{errors.push('Invalid episode.json');}
if(!['ru','en'].includes(config.language))errors.push('language must be ru or en.');
if(config.status!=='ready'||config.copiedReferenceContent!==false){
 (args.includes('--allow-draft')?warnings:errors).push('Draft/reference content has not been cleared for delivery.');
}
const lang=config.language==='en'?'EN':'RU';
const html=await read('dist/index.html');
await read('dist/app.js');await read('dist/journey.js');await read('dist/styles.css');await read('dist/atlas.css');await read('dist/script.html');
await read('README.md');
const sources=await read('SOURCES.md');
if(!/https?:\/\//.test(sources))warnings.push('No source URLs yet. Record firsthand evidence explicitly if appropriate.');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const duplicates=[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
if(duplicates.length)errors.push('Duplicate HTML IDs: '+duplicates.join(', '));
const scenes=[...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bscene\b[^"]*"[^>]*>/g)].map(x=>x[0]);
if(scenes.length<3)errors.push('Expected intro, substantive scenes and closing.');
const indices=scenes.map(tag=>/\bdata-index="([^"]+)"/.exec(tag)?.[1]);
indices.forEach((v,i)=>{if(v!==String(i).padStart(2,'0'))errors.push('Scene index/order mismatch at '+i);});
const rail=/<div class="rail__meta">([\s\S]*?)<\/div>/.exec(html)?.[1]||'';
const railValues=[...rail.matchAll(/<span[^>]*>(.*?)<\/span>/g)].map(x=>x[1]);
if(Number(railValues.at(-1))!==scenes.length-1)errors.push('Rail total differs from scene count.');
const script=await read('SCRIPT-'+lang+'.md'),plan=await read('STORY-PLAN-'+lang+'.md');
for(const [name,text] of [['SCRIPT-'+lang+'.md',script],['STORY-PLAN-'+lang+'.md',plan]]){
 if(text!==await read('dist/'+name))errors.push(name+' differs from served copy.');
 const count=[...text.matchAll(/^## \d{2} \//gm)].length;
 if(count!==scenes.length)errors.push(name+' has '+count+' numbered scenes; deck has '+scenes.length+'.');
}
// Validate file references in local HTML/CSS. Anchor destinations are checked separately.
const checked=new Set();
async function resources(file){
 if(checked.has(file))return;checked.add(file);
 let source;try{source=await fs.readFile(file,'utf8');}catch{errors.push('Missing resource '+path.relative(root,file));return;}
 const links=file.endsWith('.css')?[...source.matchAll(/url\(\s*['"]?([^)'"]+)['"]?\s*\)/g)].map(x=>x[1]):
 [...source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,match=>match.slice(0,match.indexOf('>')+1)).matchAll(/\b(?:src|href|poster)="([^"]+)"/g)].map(x=>x[1]);
 for(const link of links){
  if(!link||/^(?:[a-z]+:|\/\/|#)/i.test(link))continue;
  const relative=decodeURIComponent(link.split(/[?#]/)[0]);
  if(!relative)continue;
  const resolved=relative.startsWith('/')?path.join(dist,relative.slice(1)):path.resolve(path.dirname(file),relative);
  if(!resolved.startsWith(dist+path.sep)&&resolved!==dist){errors.push('Resource escapes dist: '+link);continue;}
  try{await fs.access(resolved);}catch{errors.push('Missing linked resource '+path.relative(root,resolved));continue;}
  if(resolved.endsWith('.css'))await resources(resolved);
 }
}
await resources(path.join(dist,'index.html'));await resources(path.join(dist,'script.html'));
for(const x of html.matchAll(/\bhref="#([^"]+)"/g))if(!ids.includes(x[1]))errors.push('Missing anchor '+x[1]);
if(config.language==='en'&&/[А-Яа-яЁё]/.test(html))errors.push('Cyrillic text remains in English HTML; review unintended localization leftovers.');
// Include bold spoken bridges; omit headings, preface and bracketed stage directions.
let inScenes=false;
const spoken=script.split('\n').filter(line=>{
 if(/^## \d{2} \//.test(line)){inScenes=true;return false;}
 return inScenes&&line.trim()&&!/^#/.test(line)&&!/^\s*\[.*\]\s*$/.test(line);
}).join(' ').replaceAll('**','');
const words=spoken.trim()?spoken.trim().split(/\s+/).length:0;
const pace=Number(config.wordsPerMinute)||135,pauses=Number(config.plannedPauseSeconds)||0;
const seconds=Math.round(words/pace*60+pauses);
if(words<350||words>800)warnings.push('Spoken word count outside usual five-minute starting range: '+words);
if(seconds<240||seconds>360)warnings.push('Estimated duration outside roughly 4–6 minutes: '+seconds+' seconds. Rehearse and trim or document an intentional exception.');
const manifest=JSON.parse(await fs.readFile(path.join(skill,'references/brand-assets.json'),'utf8'));
for(const [file,hash] of Object.entries(manifest.sha256)){
 try{const current=crypto.createHash('sha256').update(await fs.readFile(path.join(dist,file))).digest('hex');
 if(current!==hash)errors.push('Brand asset changed: '+file);
 }catch{errors.push('Missing brand asset: '+file);}
}
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',scenes:scenes.length,spokenWords:words,estimatedSeconds:seconds,pace,plannedPauseSeconds:pauses,
 note:'Duration is an estimate; browser, visual and editorial QA still required.',warnings,errors},null,2));
if(errors.length)process.exitCode=1;
