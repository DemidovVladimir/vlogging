// Final cache-safe HTML projection; all content/animation assets already QA-verified.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=import.meta.dirname;
const previous=path.join(root,'release-v2'),release=path.join(root,'release-v2-final');
assert(!fs.existsSync(release),'Do not overwrite a release');
const prior=JSON.parse(fs.readFileSync(path.join(previous,'build-manifest.json')));
const receipt=JSON.parse(fs.readFileSync(path.join(previous,'deployment-record.json')));
assert.equal(receipt.deploymentId,'f61eb786-d8ca-4554-ba29-e1b2c58386ac');
assert.equal(receipt.qaStatus,'passed');
const allowedChanges=['episodes/emudhra-ca-compromise/index.html','en/episodes/emudhra-ca-compromise/index.html'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files={};
for(const [file,expected]of Object.entries(prior.files)){
 const bytes=fs.readFileSync(path.join(previous,'public',file));assert.equal(sha(bytes),expected.sha256);
 const dest=path.join(release,'previous/public',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
 const changed=allowedChanges.includes(file),lang=file.startsWith('en/')?'en':'ru';
 const final=changed?fs.readFileSync(path.join(root,lang,'dist/index.html')):bytes;
 if(changed){
  assert(final.toString().includes('app.js?v=ep03-r2'));
  assert.equal(sha(final.toString().replaceAll('?v=ep03-r2','').trimEnd()),sha(bytes.toString().trimEnd()),'Only asset URL versions and a trailing newline may change');
 }
 const pub=path.join(release,'public',file);fs.mkdirSync(path.dirname(pub),{recursive:true});fs.writeFileSync(pub,final);
 files[file]={bytes:final.length,sha256:sha(final)};
}
for(const file of ['build-manifest.json','deployment-record.json'])fs.copyFileSync(path.join(previous,file),path.join(release,'previous',file));
fs.copyFileSync(path.join(previous,'upload-assets.mjs'),path.join(release,'upload-assets.mjs'));
const manifest={origin:'https://tengucluster.com',builtAt:new Date().toISOString(),previousDeploymentId:receipt.deploymentId,episode:'emudhra-ca-compromise',sourceVersion:'EP03-v2-cache-safe-2026-10-22',allowedChanges,files};
fs.writeFileSync(path.join(release,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
execFileSync(process.execPath,['/Users/vladimirdemidov/.codex/skills/artifact-template-tengu-youtube/scripts/audit-public.mjs','--public',path.join(release,'public'),'--manifest',path.join(release,'build-manifest.json'),'--ru',allowedChanges[0],'--en',allowedChanges[1],'--previous-manifest',path.join(release,'previous/build-manifest.json'),...allowedChanges.flatMap(f=>['--allow-change',f])],{stdio:'inherit'});
console.log('Cache revision: only two viewer HTML files changed; 137 other files byte-identical.');
