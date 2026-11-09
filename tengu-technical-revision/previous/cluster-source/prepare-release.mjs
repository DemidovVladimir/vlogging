// Assemble a complete Pages snapshot from an explicit viewer-only allowlist.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const previous=path.resolve(root,'../tengu-cloudflare-pages');
const release=path.join(root,'release'),publicDir=path.join(release,'public');
assert(!fs.existsSync(release),'Release already exists; do not overwrite a snapshot.');
const prior=JSON.parse(fs.readFileSync(path.join(previous,'build-manifest.json')));
const receipt=JSON.parse(fs.readFileSync(path.join(previous,'deployment-record.json')));
assert.equal(receipt.deploymentId,'e141c565-23a2-4eaa-97ca-2d58a6e30288');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const buffers=new Map();
for(const [file,record]of Object.entries(prior.files)){
 const source=path.join(previous,'public',file);assert(fs.lstatSync(source).isFile());
 const data=fs.readFileSync(source);assert.equal(sha(data),record.sha256);assert.equal(data.length,record.bytes);
 buffers.set(file,data);
 // Read-only verification of the deployed baseline, including all old assets.
 if(!file.startsWith('_')){
  const res=await fetch('https://tengucluster.com/'+file);assert.equal(res.status,200,file);
  assert.equal(sha(Buffer.from(await res.arrayBuffer())),record.sha256,'Remote baseline differs: '+file);
 }
}
const viewers=['index.html','app.js','journey.js','styles.css','atlas.css','episode.css'];
const commonAssets=[
 'tengu-mark-simplified.svg','tengu-kaiju-v23.png','tengu-kaiju-complete-v33.png','tengu-robot-v23.png',
 'field-light.jpg','field-dark.jpg','serving-people-v18.png',
 'fonts/manrope-cyrillic.woff2','fonts/manrope-latin.woff2','fonts/plex-cyrillic-400.woff2','fonts/plex-cyrillic-600.woff2',
 'fonts/plex-latin-400.woff2','fonts/plex-latin-600.woff2','fonts/literata.ttf',
];
const licenseNames=['Manrope-OFL.txt','IBMPlexMono-OFL.txt','Literata-OFL.txt'];
for(const lang of ['ru','en']){
 const meta=JSON.parse(fs.readFileSync(path.join(root,lang,'episode.json')));
 assert.equal(meta.status,'ready');assert.equal(meta.copiedReferenceContent,false);
 const suffix=lang==='en'?'-en':'';const prefix=(lang==='en'?'en/':'')+'episodes/tengu-cluster/';
 assert(!Object.keys(prior.files).some(f=>f.startsWith(prefix)),'Existing episode path');
 const assets=[...commonAssets,`tengu-wordmark-horizontal${suffix}.svg`,`tengu-logo-sting${suffix}.mp4`,`tengu-logo-sting-poster${suffix}.png`].map(s=>'assets/'+s);
 for(const file of [...viewers,...assets,...licenseNames.map(s=>'licenses/'+s)]){
  const src=path.join(root,lang,file.startsWith('licenses/')?file:'dist/'+file);
  assert(fs.lstatSync(src).isFile()&&!fs.lstatSync(src).isSymbolicLink(),src);
  const data=fs.readFileSync(src);assert(data.length<25*1024*1024,'Asset limit');buffers.set(prefix+file,data);
 }
}
// Validate static references before writing anything. No narration fetches in JS.
for(const [file,data]of buffers){
 if(!/\.(html|css|js|svg)$/.test(file))continue;
 const text=data.toString();assert(!/\/Users\/|sourceMappingURL|candygiant32\.chatgpt\.site/.test(text),'Private or stale reference '+file);
 const refs=file.endsWith('.html')?[...text.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)].map(x=>x[1]):file.endsWith('.css')?[...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(x=>x[1]):[];
 for(const ref of refs){
  if(/^(?:[a-z]+:|\/\/|#)/i.test(ref))continue;
  const clean=ref.split(/[?#]/)[0];let resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),clean));
  if(ref.startsWith('/'))resolved=ref.slice(1);if(!resolved||resolved==='.'||resolved.endsWith('/'))resolved=(resolved==='.'?'':resolved)+'index.html';
  assert(buffers.has(resolved),file+' → '+ref);
 }
}
fs.mkdirSync(path.join(release,'previous'),{recursive:true});
for(const file of ['build-manifest.json','deployment-record.json'])fs.copyFileSync(path.join(previous,file),path.join(release,'previous',file));
for(const file of Object.keys(prior.files)){const dest=path.join(release,'previous/public',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,buffers.get(file));}
for(const [file,data]of buffers){const dest=path.join(publicDir,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);}
const manifest={origin:'https://tengucluster.com',builtAt:new Date().toISOString(),previousDeploymentId:receipt.deploymentId,episode:'tengu-cluster',sourceVersion:'EP02-2026-10-22',files:Object.fromEntries([...buffers].sort(([a],[b])=>a.localeCompare(b)).map(([f,b])=>[f,{bytes:b.length,sha256:sha(b)}]))};
fs.writeFileSync(path.join(release,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
// Adapt the inspected official-protocol uploader mechanically; retain hash guards.
let uploader=fs.readFileSync(path.join(previous,'upload-assets.mjs'),'utf8');
uploader=uploader.replace("assert(files.length === 33, 'Review the allowlist before changing the public file count');",`assert(files.length === ${buffers.size-2}, 'The reviewed bilingual public inventory changed');`);
fs.writeFileSync(path.join(release,'upload-assets.mjs'),uploader);
execFileSync(process.execPath,['/Users/vladimirdemidov/.codex/skills/artifact-template-tengu-youtube/scripts/audit-public.mjs','--public',publicDir,'--manifest',path.join(release,'build-manifest.json'),'--ru','episodes/tengu-cluster/index.html','--en','en/episodes/tengu-cluster/index.html','--previous-manifest',path.join(release,'previous/build-manifest.json')],{stdio:'inherit'});
console.log('Previous '+Object.keys(prior.files).length+' files preserved byte-for-byte. Total public files: '+buffers.size);
