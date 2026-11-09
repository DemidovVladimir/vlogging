#!/usr/bin/env node
// Portable installer: never overwrites a different installation or follows symlinks.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),name='artifact-template-tengu-youtube';
const args=process.argv.slice(2),flag=args.indexOf('--target'),target=args[flag+1];
if(flag<0||!['codex','claude-code'].includes(target))throw new Error('Use --target codex or --target claude-code.');
const source=path.join(here,name);
const parent=target==='codex'?path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'skills'):path.join(os.homedir(),'.claude','skills');
const destination=path.join(parent,name);
async function inventory(root,relative=''){
 const result={};
 for(const e of await fs.readdir(path.join(root,relative),{withFileTypes:true})){
  const r=path.join(relative,e.name);
  if(e.isSymbolicLink())throw new Error('Refusing symlink in package/installation: '+r);
  if(e.isDirectory())Object.assign(result,await inventory(root,r));
  else result[r]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,r))).digest('hex');
 }
 return result;
}
const expected=await inventory(source);
let exists=false;try{const st=await fs.lstat(destination);if(!st.isDirectory()||st.isSymbolicLink())throw new Error('Destination is not a regular directory.');exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
if(exists){
 const actual=await inventory(destination),keys=Object.keys(expected).sort();
 if(JSON.stringify(keys)!==JSON.stringify(Object.keys(actual).sort())||keys.some(k=>actual[k]!==expected[k]))throw new Error('Different installation exists; save it separately before installing. Nothing was changed: '+destination);
 console.log('Already installed, identical: '+destination);
}else{
 await fs.mkdir(parent,{recursive:true});
 await fs.cp(source,destination,{recursive:true,errorOnExist:true,force:false});
 console.log('Installed: '+destination);
}
console.log('Open a new session if the skill is not discovered. This is a local installation only.');
