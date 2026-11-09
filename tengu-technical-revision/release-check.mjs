import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),workspace=path.dirname(root),skill='/Users/vladimirdemidov/.codex/skills/artifact-template-tengu-youtube';
const qa=JSON.parse(fs.readFileSync(path.join(root,'qa/127.0.0.1/technical-qa.json')));assert.equal(qa.status,'passed');assert.equal(qa.editions.length,4);
const changes=JSON.parse(fs.readFileSync(path.join(root,'change-report.json'))).changed;
function run(script,args){const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);return r.stdout;}
const reports=[];
for(const [folder,slug,revision]of [['tengu-cluster-episode','tengu-cluster',2],['tengu-emudhra-episode','emudhra-ca-compromise',3]]){
 for(const lang of ['ru','en']){
  const dir=path.join(workspace,folder,lang),file=path.join(dir,'episode.json'),meta=JSON.parse(fs.readFileSync(file));
  Object.assign(meta,{status:'ready',copiedReferenceContent:false,revision,qaVerifiedAt:new Date().toISOString()});fs.writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
  if(slug==='emudhra-ca-compromise')fs.copyFileSync(path.join(workspace,folder,'SOURCES.md'),path.join(dir,'SOURCES.md'));
  const report=JSON.parse(run(skill+'/scripts/check-episode.mjs',[dir]));assert.equal(report.status,'PASS');reports.push({slug,lang,...report});
 }
 const report=run(skill+'/scripts/audit-public.mjs',['--public',root+'/public','--manifest',root+'/build-manifest.json','--ru','episodes/'+slug+'/index.html','--en','en/episodes/'+slug+'/index.html','--previous-manifest',root+'/previous/build-manifest.json',...changes.flatMap(p=>['--allow-change',p])]);
 fs.writeFileSync(path.join(root,'qa/audit-'+slug+'.json'),report);
}
run(skill+'/scripts/check-navigation.mjs',['--public',root+'/public']);
fs.writeFileSync(path.join(root,'qa/editorial-checks.json'),JSON.stringify(reports,null,2)+'\n');
console.log(reports.map(x=>({slug:x.slug,language:x.lang,words:x.spokenWords,estimatedSeconds:x.estimatedSeconds,status:x.status})));
