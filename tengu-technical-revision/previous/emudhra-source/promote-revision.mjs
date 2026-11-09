// After verified publication, make the discovery workspace reflect the WHOLE site.
// The former public snapshot and receipts remain recoverable in release-v2/previous/.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const baseline=path.resolve(root,'../tengu-cloudflare-pages'),release=path.join(root,process.argv[2]||'release-v2-final');
const receipt=JSON.parse(fs.readFileSync(path.join(release,'deployment-record.json')));
assert.equal(receipt.deploymentStatus,'success');assert.equal(receipt.qaStatus,'passed');
const browser=JSON.parse(fs.readFileSync(path.join(root,'qa/tengucluster.com/verification.json')));
for(const lang of ['ru','en'])assert.equal(browser.languages[lang].status,'passed');
for(const host of ['tengucluster.com','tengu-presentations.pages.dev',new URL(receipt.deploymentUrl).hostname]){
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'qa',host,'public-verification.json'))).status,'passed');
}
const old=JSON.parse(fs.readFileSync(path.join(baseline,'deployment-record.json')));
assert.equal(old.deploymentId,receipt.previousDeploymentId,'Baseline advanced in another session');
const build=JSON.parse(fs.readFileSync(path.join(release,'build-manifest.json')));
const inventory=build.files; const allowed=new Set(build.allowedChanges);
const previous=JSON.parse(fs.readFileSync(path.join(baseline,'build-manifest.json'))).files;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const [file,meta]of Object.entries(previous)){
 assert(inventory[file],'Existing file removed');
 if(!allowed.has(file))assert.equal(inventory[file].sha256,meta.sha256,'Unrelated public file changed');
 assert.equal(sha(fs.readFileSync(path.join(baseline,'public',file))),meta.sha256,'Baseline changed locally');
}
for(const [file,meta]of Object.entries(inventory)){
 const bytes=fs.readFileSync(path.join(release,'public',file));assert.equal(sha(bytes),meta.sha256);
 const dest=path.join(baseline,'public',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
}
fs.copyFileSync(path.join(baseline,'README-RU.md'),path.join(release,'previous/README-RU.md'));
for(const file of ['build-manifest.json','upload-manifest.json','deployment-record.json'])fs.copyFileSync(path.join(release,file),path.join(baseline,file));
console.log(`Current baseline updated: ${Object.keys(inventory).length} files; previous ${Object.keys(previous).length}-file snapshot retained. No public files removed.`);
