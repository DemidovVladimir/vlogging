#!/usr/bin/env node
// Built-in Node modules only. Creates a draft in a NEW folder; never overwrites.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
function option(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
if(args.includes('--help')){
 console.log('node new-episode.mjs --out <NEW_ABSOLUTE_DIRECTORY> --topic "<topic>" --language ru|en');
 process.exit(0);
}
const target=option('--out'),topic=option('--topic'),language=option('--language','ru');
if(!target||!path.isAbsolute(target)||!topic||!['ru','en'].includes(language))throw new Error('Provide an absolute --out, a --topic, and --language ru or en.');
const out=path.resolve(target);
if(out===skill||out.startsWith(skill+path.sep))throw new Error('Choose a working directory outside this retained skill.');
try{await fs.lstat(out);throw new Error('Output already exists; nothing was changed: '+out);}
catch(e){if(e.code!=='ENOENT')throw e;}
const reference=JSON.parse(await fs.readFile(path.join(skill,'artifact-template.json'),'utf8'));
const source=path.resolve(skill,reference.reference);
const lang=language.toUpperCase(),edition=language==='en'?'dist/en':'dist';
await fs.mkdir(path.dirname(out),{recursive:true});
await fs.mkdir(out); // no recursive flag: concurrent creation must also refuse overwrite
await fs.mkdir(path.join(out,'dist'));
await fs.cp(path.join(source,'dist/assets'),path.join(out,'dist/assets'),{recursive:true,errorOnExist:true,force:false});
await fs.cp(path.join(source,'licenses'),path.join(out,'licenses'),{recursive:true,errorOnExist:true,force:false});
for(const name of ['styles.css','atlas.css'])await fs.copyFile(path.join(source,'dist',name),path.join(out,'dist',name));
for(const name of ['index.html','app.js','journey.js','script.html']){
 let text=await fs.readFile(path.join(source,edition,name),'utf8');
 if(language==='en')text=text.replaceAll('"../assets/','"assets/').replaceAll('"../styles.css"','"styles.css"').replaceAll('"../atlas.css"','"atlas.css"');
 // The original deployment is a reference, never the new episode's identity.
 if(name==='index.html')text=text.replace(/^\s*<meta property="og:(url|image)"[^>]*>\s*$/gm,'');
 await fs.writeFile(path.join(out,'dist',name),text,{flag:'wx'});
}
for(const file of ['SCRIPT-'+lang+'.md','STORY-PLAN-'+lang+'.md']){
 const body=await fs.readFile(path.join(source,file));
 await fs.writeFile(path.join(out,file),body,{flag:'wx'});
 await fs.writeFile(path.join(out,'dist',file),body,{flag:'wx'});
}
await fs.mkdir(path.join(out,'.openai'));
await fs.writeFile(path.join(out,'.openai/hosting.json'),JSON.stringify({static:{directory:'dist'}},null,2)+'\n',{flag:'wx'});
await fs.writeFile(path.join(out,'episode.json'),JSON.stringify({
 schemaVersion:1,topic,language,targetSeconds:300,wordsPerMinute:language==='en'?135:125,
 plannedPauseSeconds:35,status:'draft',copiedReferenceContent:true,
 template:'artifact-template-tengu-youtube',reference:'Approved RU v33 / English edition'
},null,2)+'\n',{flag:'wx'});
await fs.writeFile(path.join(out,'README.md'),
 '# TENGU — '+topic+'\n\nDRAFT: retained reference content is copied, not yet rewritten for this topic.\n\n'
 +'Use the TENGU skill to create a new argument, scenes, script, plan and sources. Keep the visual system, not the old topic.\n\n'
 +'Local preview: python3 -m http.server 4173 --bind 127.0.0.1 --directory dist\n\n'
 +'Open http://127.0.0.1:4173/ and the separate /script.html page. Controls and QA are in the skill references.\n\n'
 +'Before delivery: replace all copied reference content, run structural and browser QA, update episode.json, and replace this draft notice with real delivery instructions.\n',
 {flag:'wx'});
await fs.writeFile(path.join(out,'SOURCES.md'),
 '# Sources — '+topic+'\n\nDraft. Add primary sources, checked dates, supported claims and limits for this topic. Do not reuse the old episode’s citations without checking relevance and freshness.\n',
 {flag:'wx'});
console.log(JSON.stringify({directory:out,language,topic,status:'draft',copiedReferenceContent:true,next:'Write new content, then run check-episode.mjs and browser QA.'},null,2));
