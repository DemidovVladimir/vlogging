// Promote the verified EP.05 snapshot to the baseline ../tengu-cloudflare-pages/. No credentials here.
// Usage: TENGU_BLAKE3_PATH=<wrangler's blake3-wasm> node finalize.mjs <deployment-id> <created-on> <deploy-ended-at>
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const root=path.dirname(fileURLToPath(import.meta.url)),baseline=path.resolve(root,'../tengu-cloudflare-pages');
const episode=path.resolve(root,'../tengu-chaos-substrate-episode');
const read=f=>JSON.parse(fs.readFileSync(f)),write=(f,o)=>fs.writeFileSync(f,JSON.stringify(o,null,2)+'\n');
const [deploymentId,createdAt,endedAt]=process.argv.slice(2);
assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(deploymentId),'deployment id');
const previous=read(baseline+'/deployment-record.json');
assert.equal(previous.deploymentId,'d19c7d06-0851-432f-b55a-354fcfde01eb','Reconcile changed local baseline');
const immutableOrigin='https://'+deploymentId.slice(0,8)+'.tengu-presentations.pages.dev';
const origins=['tengucluster.com','tengu-presentations.pages.dev',new URL(immutableOrigin).hostname];
for(const host of origins){const q=read(root+'/qa/'+host+'/public-verification.json');assert(q.status==='passed'&&q.contentHashes===216&&q.privatePaths===456,host);}
for(const host of ['127.0.0.1','tengucluster.com']){const q=read(root+'/qa/'+host+'/verify.json');assert(q.passed===27&&q.failed===0,host);}
for(const dir of ['staged','tengucluster.com']){const q=read(episode+'/qa/'+dir+'/verification.json');for(const l of ['ru','en'])assert.equal(q.languages[l]?.status,'passed',dir+' '+l);}
const manifest=read(root+'/build-manifest.json'),old=read(root+'/previous/build-manifest.json'),changes=read(root+'/change-report.json');
assert.equal(changes.changed.length,10);assert.equal(changes.added.length,52);
const allowed=new Set(changes.changed);
// Pages upload keys, as Wrangler 4.151.3 computes them (pages/hash.ts): blake3(base64 + extension), first 32 hex.
const blake3=createRequire(import.meta.url)(process.env.TENGU_BLAKE3_PATH);
const upload={};
for(const [f,m]of Object.entries(manifest.files)){
 const bytes=fs.readFileSync(root+'/public/'+f);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256,f);
 if(old.files[f]&&!allowed.has(f))assert.deepEqual(m,old.files[f],'Unrelated change '+f);
 if(!['_headers','_redirects'].includes(f))upload['/'+f]=blake3.hash(bytes.toString('base64')+path.extname(f).slice(1)).toString('hex').slice(0,32);
}
const oldUpload=read(baseline+'/upload-manifest.json');
for(const [f,key]of Object.entries(oldUpload))if(!allowed.has(f.slice(1)))assert.equal(upload[f],key,'Upload key '+f);
for(const f of allowed)assert.notEqual(upload['/'+f],oldUpload['/'+f],'Changed file kept its upload key: '+f);
for(const f of Object.keys(manifest.files)){fs.mkdirSync(path.dirname(baseline+'/public/'+f),{recursive:true});fs.copyFileSync(root+'/public/'+f,baseline+'/public/'+f);}
const list=(d,p='')=>fs.readdirSync(d).flatMap(n=>fs.lstatSync(path.join(d,n)).isDirectory()?list(path.join(d,n),p+n+'/'):[p+n]).sort();
assert.deepEqual(list(baseline+'/public'),Object.keys(manifest.files).sort(),'Baseline public/ differs from the manifest');
write(root+'/upload-manifest.json',upload);
const record={status:'success',deploymentId,immutableOrigin,createdAt,deployEndedAt:endedAt,previousDeploymentId:previous.deploymentId,
 project:'tengu-presentations',origin:'https://tengucluster.com',revision:previous.revision+1,slug:'chaos-substrate',languages:['ru','en'],
 paths:{ru:'/episodes/chaos-substrate/',en:'/en/episodes/chaos-substrate/'},
 manifest:'build-manifest.json',verifiedAt:new Date().toISOString(),sourceWorkspace:root,episodeWorkspace:episode,
 uploader:'wrangler 4.151.3 pages deploy (its own OAuth login: account:read user:read pages:write), branch main',
 staticAssets:216,controlFiles:2,privatePaths404PerOrigin:456,verifiedOrigins:origins,
 browserChecks:{'127.0.0.1':{navigation:27,deck:'ru+en: 9 scenes, 30 phases, controls, 5 sizes, intro sound'},'tengucluster.com':{navigation:27,deck:'ru+en: 9 scenes, 30 phases, controls, 5 sizes, intro sound'}},
 rollbackSnapshot:'previous/public',qa:'qa/tengucluster.com/',changedFiles:changes.changed,addedFiles:changes.added.length,unrelatedContentUnchanged:true,
 linkedWorker:previous.linkedWorker};
write(root+'/deployment-record.json',record);write(baseline+'/deployment-record.json',record);
for(const f of ['build-manifest.json','upload-manifest.json'])fs.copyFileSync(root+'/'+f,baseline+'/'+f);
const reproduced=Object.keys(oldUpload).filter(f=>!allowed.has(f.slice(1))).length;
console.log('Promoted EP.05 '+deploymentId+'; '+reproduced+' unchanged upload keys reproduced; baseline public/ = '+Object.keys(manifest.files).length+' files.');
