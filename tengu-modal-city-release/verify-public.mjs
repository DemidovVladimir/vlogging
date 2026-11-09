// Read-only HTTPS content/privacy verification of a manifest against a live origin. Reports go to
// qa/<host>/<name>.json, outside public/.
// Usage: node verify-public.mjs <https origin> [manifest=build-manifest.json] [report name=public-verification]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const [origin,manifestFile='build-manifest.json',name='public-verification']=process.argv.slice(2);assert(/^https:\/\//.test(origin));
const manifest=JSON.parse(fs.readFileSync(path.join(root,manifestFile)));
const slugs=[...new Set(Object.keys(manifest.files).map(f=>f.match(/^(?:en\/)?episodes\/([^/]+)\//)?.[1]).filter(Boolean))].sort();
assert.equal(slugs.length,4);
const privateNames=['script.html','script','SCRIPT-RU.md','SCRIPT-EN.md','STORY-PLAN-RU.md','STORY-PLAN-EN.md','SKILL.md','build-manifest.json','deployment-record.json','tengu-youtube-skill.zip','.env','.git/config','artifact-template-tengu-youtube/SKILL.md','content.mjs','author.mjs','technical-content.mjs','cloudflare-content.mjs','cloudflare-visuals.mjs','render.mjs','build.mjs','catalog.mjs','episodes.mjs','shots.mjs','verify.mjs','serve.mjs','README.md','change-report.json','upload-manifest.json'];
const prefixes=['/','/en/',...slugs.flatMap(s=>['/episodes/'+s+'/','/en/episodes/'+s+'/'])];
const jobs=Object.entries(manifest.files).filter(([f])=>!f.startsWith('_')).map(([file,expected])=>async()=>{
 const r=await fetch(origin+'/'+file,{signal:AbortSignal.timeout(60000)});assert.equal(r.status,200,file);const b=Buffer.from(await r.arrayBuffer());assert.equal(crypto.createHash('sha256').update(b).digest('hex'),expected.sha256,'Remote hash '+file);
});
jobs.push(...prefixes.flatMap(prefix=>privateNames.map(name=>async()=>{const r=await fetch(origin+prefix+name,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404,'Private path '+prefix+name);assert(!(await r.text()).includes('scriptContent'));})));
let done=0;await Promise.all(Array.from({length:4},async()=>{while(jobs.length){await jobs.shift()();done++;if(done%100===0)console.log(`${origin}: ${done} checks passed`);}}));
for(const url of ['/ru','/ru/']){const r=await fetch(origin+url,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/');}
const result={status:'passed',origin,manifest:manifestFile,checkedAt:new Date().toISOString(),contentHashes:Object.keys(manifest.files).filter(f=>!f.startsWith('_')).length,privatePaths:prefixes.length*privateNames.length,httpsVerified:true};
const out=path.join(root,'qa',new URL(origin).hostname);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
