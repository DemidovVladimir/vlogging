// Reproducible, private staging; no network and no private working files copied.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)), workspace=path.dirname(root);
const prev=path.join(root,'previous'),out=path.join(root,'public');
const manifest=JSON.parse(fs.readFileSync(path.join(prev,'build-manifest.json')));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(f,b)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,b);};
for(const [f,m] of Object.entries(manifest.files)){
 const b=fs.readFileSync(path.join(prev,'public',f));assert.equal(sha(b),m.sha256,'Baseline drift '+f);write(path.join(out,f),b);
}
const allowed=[];
for(const [folder,slug] of [['tengu-emudhra-episode','emudhra-ca-compromise']])for(const lang of ['ru','en']){
 const prefix=(lang==='en'?'en/':'')+'episodes/'+slug+'/';
 // Keep the approved navigation envelope byte-for-byte, not legacy private reader links.
 const old=fs.readFileSync(path.join(prev,'public',prefix,'index.html'),'utf8');
 const head=old.match(/<link rel="stylesheet" href="\/site\/site\.css[^]*?<\/script>/)?.[0];
 const nav=old.match(/<nav class="site-nav"[^]*?(?=<\/body>)/)?.[0];
 assert(head&&nav,'Missing retained navigation');
 for(const name of ['index.html','app.js','journey.js','episode.css']){
  let b=fs.readFileSync(path.join(workspace,folder,lang,'dist',name));
  if(name==='index.html'){
   let html=b.toString().replace('</head>',head+'</head>').replace('</body>',nav+'</body>');
   for(const asset of ['app.js','journey.js','episode.css']){
    const h=sha(fs.readFileSync(path.join(workspace,folder,lang,'dist',asset))).slice(0,12);
    html=html.replace(new RegExp('(["\\\'])'+asset.replace('.','\\.')+'(?:\\?[^"\\\']*)?(["\\\'])','g'),'$1'+asset+'?v='+h+'$2');
   }
   b=Buffer.from(html);
  }
  write(path.join(out,prefix,name),b);allowed.push(prefix+name);
 }
}
const files={};for(const f of Object.keys(manifest.files)){
 const b=fs.readFileSync(path.join(out,f));files[f]={bytes:b.length,sha256:sha(b)};
 if(files[f].sha256!==manifest.files[f].sha256)assert(allowed.includes(f),'Unauthorized change '+f);
}
// Introductory episode and catalogs are not rewritten during this content revision.
for(const f of ['episodes/agent-context/index.html','en/episodes/agent-context/index.html','episodes/tengu-cluster/index.html','en/episodes/tengu-cluster/index.html','index.html','en/index.html'])assert.deepEqual(files[f],manifest.files[f]);
write(path.join(root,'build-manifest.json'),JSON.stringify({generatedAt:new Date().toISOString(),files},null,2)+'\n');
write(path.join(root,'change-report.json'),JSON.stringify({allowed,changed:allowed.filter(f=>files[f].sha256!==manifest.files[f].sha256),firstEpisodeUnchanged:true},null,2)+'\n');
console.log('Staged '+Object.keys(files).length+' public files; only 8 EP03 viewer resources may differ.');
