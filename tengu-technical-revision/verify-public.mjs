// Read-only HTTPS content/privacy verification. Reports stay outside public/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {episodes,route} from './episodes.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const origin=process.argv[2];assert(/^https:\/\//.test(origin));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'build-manifest.json')));
const privateNames=['script.html','script','SCRIPT-RU.md','SCRIPT-EN.md','STORY-PLAN-RU.md','STORY-PLAN-EN.md','SKILL.md','build-manifest.json','deployment-record.json','tengu-youtube-skill.zip','.env','.git/config','artifact-template-tengu-youtube/SKILL.md','content.mjs','author.mjs','technical-content.mjs'];
const prefixes=['ru','en'].flatMap(lang=>[route(lang),...episodes.map(ep=>route(lang,ep.slug))]);
const jobs=Object.entries(manifest.files).filter(([f])=>!f.startsWith('_')).map(([file,expected])=>async()=>{
 const r=await fetch(origin+'/'+file,{signal:AbortSignal.timeout(60000)});assert.equal(r.status,200,file);const b=Buffer.from(await r.arrayBuffer());assert.equal(crypto.createHash('sha256').update(b).digest('hex'),expected.sha256,'Remote hash '+file);
});
jobs.push(...prefixes.flatMap(prefix=>privateNames.map(name=>async()=>{const r=await fetch(origin+prefix+name,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404,'Private path '+prefix+name);assert(!(await r.text()).includes('scriptContent'));})));
let done=0;await Promise.all(Array.from({length:4},async()=>{while(jobs.length){await jobs.shift()();done++;if(done%50===0)console.log(`${origin}: ${done} checks passed`);}}));
for(const url of ['/ru','/ru/']){const r=await fetch(origin+url,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/');}
const result={status:'passed',origin,checkedAt:new Date().toISOString(),contentHashes:Object.keys(manifest.files).length-2,privatePaths:prefixes.length*privateNames.length,previousFilesRemoved:0,httpsVerified:true};
const out=path.join(root,'qa',new URL(origin).hostname);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'public-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
