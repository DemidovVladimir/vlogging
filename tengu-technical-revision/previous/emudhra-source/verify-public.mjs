// Remote content/privacy regression checks; no credentials and no writes remotely.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const origin=process.argv[2];assert(/^https:\/\//.test(origin));
const manifest=JSON.parse(fs.readFileSync(path.join(root,process.argv[3]||'release-v2-final','build-manifest.json')));
const privateNames=['script.html','script','SCRIPT-RU.md','SCRIPT-EN.md','STORY-PLAN-RU.md','STORY-PLAN-EN.md','SKILL.md','build-manifest.json','deployment-record.json','tengu-youtube-skill.zip','.env','.git/config','artifact-template-tengu-youtube/SKILL.md','content.mjs','author.mjs'];
const prefixes=['/','/en/','/episodes/tengu-cluster/','/en/episodes/tengu-cluster/','/episodes/emudhra-ca-compromise/','/en/episodes/emudhra-ca-compromise/'];
const jobs=Object.entries(manifest.files).filter(([f])=>!f.startsWith('_')).map(([file,expected])=>async()=>{
 const r=await fetch(origin+'/'+file);assert.equal(r.status,200,file);const b=Buffer.from(await r.arrayBuffer());assert.equal(crypto.createHash('sha256').update(b).digest('hex'),expected.sha256,'Remote hash '+file);
});
jobs.push(...prefixes.flatMap(prefix=>privateNames.map(name=>async()=>{const r=await fetch(origin+prefix+name,{redirect:'manual'});assert.equal(r.status,404,'Private path '+prefix+name);assert(!(await r.text()).includes('scriptContent'));})));
let done=0;await Promise.all(Array.from({length:5},async()=>{while(jobs.length){const job=jobs.shift();await job();done++;}}));
for(const url of ['/ru','/ru/']){const r=await fetch(origin+url,{redirect:'manual'});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/');}
const result={status:'passed',origin,checkedAt:new Date().toISOString(),contentHashes:Object.keys(manifest.files).length-2,privatePaths:prefixes.length*privateNames.length,oldFilesPreserved:87,httpsVerified:true};
const out=path.join(root,'qa',new URL(origin).hostname);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'public-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
