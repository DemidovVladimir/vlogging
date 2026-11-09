import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const skill='/Users/vladimirdemidov/.codex/skills/artifact-template-tengu-youtube';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'tengu-navigation-check-'));
const write=(file,s)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,s);};
const route=(lang,slug='')=>'/'+(lang==='en'?'en/':'')+(slug?'episodes/'+slug+'/':'');
const list=['first','next-episode'];
for(const lang of ['ru','en']){
 write(path.join(root,route(lang),'index.html'),list.map(slug=>`<a href="${route(lang,slug)}">${slug}</a>`).join(''));
 for(const slug of list)write(path.join(root,route(lang,slug),'index.html'),`<a data-episode-language="${route(lang==='ru'?'en':'ru',slug)}" href="${route(lang==='ru'?'en':'ru',slug)}">Language</a><dialog id="episodeMenu"><a href="${route(lang)}">Home</a>${list.map(s=>`<a href="${route(lang,s)}"${s===slug?' aria-current="page"':''}>${s}</a>`).join('')}<button data-record>Record</button></dialog><script src="/site/site.js"></script>`);
}
const run=()=>spawnSync(process.execPath,[skill+'/scripts/check-navigation.mjs','--public',root],{encoding:'utf8'});
assert.equal(run().status,0,'Valid two-episode bilingual fixture');
const faults=[['en/index.html',s=>s.replace('<a href="/en/episodes/next-episode/">next-episode</a>',''),'Missing EN catalog entry'],['episodes/first/index.html',s=>s.replace('<a href="/episodes/next-episode/">next-episode</a>',''),'Old viewer menu not updated'],['en/episodes/next-episode/index.html',s=>s.replace('href="/episodes/next-episode/"','href="/"'),'Wrong language destination'],['index.html',s=>s+'<a href="/SCRIPT-RU.md">Script</a>','Private catalog link']];
for(const [file,change,name]of faults){const full=path.join(root,file),old=fs.readFileSync(full,'utf8');write(full,change(old));assert.notEqual(run().status,0,name);write(full,old);}
console.log(JSON.stringify({status:'passed',tests:5,fixture:root,notes:'Read-only validator; no live publication or credentials.'}));
