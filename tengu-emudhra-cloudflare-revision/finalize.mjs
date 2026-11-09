// Only promote a complete, verified public snapshot. No credentials in this file.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),baseline=path.resolve(root,'../tengu-cloudflare-pages');
const read=f=>JSON.parse(fs.readFileSync(f)),write=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,2)+'\n');
const r=read(root+'/deployment-record.json'),previous=read(baseline+'/deployment-record.json');
assert([r.previousDeploymentId,r.deploymentId].includes(previous.deploymentId),'Reconcile changed local baseline');
const origins=['tengucluster.com','tengu-presentations.pages.dev',new URL(r.immutableOrigin).hostname];
for(const host of origins){const q=read(root+'/qa/'+host+'/public-verification.json');assert(q.status==='passed'&&q.contentHashes===142&&q.privatePaths===144);}
for(const host of ['127.0.0.1','tengucluster.com']){
 const q=read(root+'/qa/'+host+'/technical-qa.json');assert(q.status==='passed'&&q.editions.length===2);
 const phases=read(root+'/qa/'+host+'/phase-qa.json');assert.equal(phases.status,'passed');
}
const manifest=read(root+'/build-manifest.json'),old=read(root+'/previous/build-manifest.json'),changes=read(root+'/change-report.json');
assert.equal(changes.changed.length,8);
for(const [f,m]of Object.entries(manifest.files)){
 const bytes=fs.readFileSync(root+'/public/'+f);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);
 if(!changes.allowed.includes(f))assert.deepEqual(m,old.files[f],'Unrelated change '+f);
 fs.mkdirSync(path.dirname(baseline+'/public/'+f),{recursive:true});fs.writeFileSync(baseline+'/public/'+f,bytes);
}
Object.assign(r,{status:'success',verifiedAt:new Date().toISOString(),sourceWorkspace:root,staticAssets:142,controlFiles:2,privatePaths404PerOrigin:144,verifiedOrigins:origins,rollbackSnapshot:'previous/public',qa:'qa/tengucluster.com/technical-qa.json',timing:read(root+'/qa/editorial-checks.json').map(x=>({language:x.lang,spokenWords:x.spokenWords,estimatedSeconds:x.estimatedSeconds})),unrelatedContentUnchanged:true});
write(root+'/deployment-record.json',r);write(baseline+'/deployment-record.json',r);
for(const f of ['build-manifest.json','upload-manifest.json'])fs.copyFileSync(root+'/'+f,baseline+'/'+f);
console.log('Verified EP03 RU/EN promoted; EP01, EP02, catalogs, menus and assets unchanged.');
