#!/usr/bin/env node
// Read-only structural guard for the approved static catalog/menu contract.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const args=process.argv.slice(2);
assert(args.length===2 && args[0]==='--public','Usage: check-navigation.mjs --public <directory>');
const root=path.resolve(args[1]);
function read(file){
 const resolved=path.join(root,file);
 assert(!fs.lstatSync(resolved).isSymbolicLink(),'Symlink: '+file);
 return fs.readFileSync(resolved,'utf8');
}
function slugs(prefix){
 return fs.readdirSync(path.join(root,prefix),{withFileTypes:true}).map(e=>{
  assert(e.isDirectory() && !e.isSymbolicLink() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.name),'Unexpected episode path: '+e.name);
  read(prefix+'/'+e.name+'/index.html'); return e.name;
 }).sort();
}
const ru=slugs('episodes'), en=slugs('en/episodes');
assert(ru.length>0,'No episodes');assert.deepEqual(ru,en,'Missing language edition');
const hrefs=html=>[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m=>({url:m[1].split(/[?#]/)[0],tag:m[0]}));
const privateLink=/(?:script\.html|SCRIPT-|STORY-PLAN|SKILL\.md|\.codex|\.claude|tengu-youtube-skill|SOURCES\.md|build-manifest)/i;
for(const lang of ['ru','en']){
 const prefix=lang==='en'?'en/':'';
 const routes=ru.map(slug=>'/'+prefix+'episodes/'+slug+'/');
 const catalog=read(prefix+'index.html');
 const links=hrefs(catalog);
 assert(!privateLink.test(links.map(x=>x.url).join('\n')),'Private catalog link');
 for(const route of routes)assert(links.some(x=>x.url===route),'Catalog missing '+route);
 for(const slug of ru){
  const file=prefix+'episodes/'+slug+'/index.html',html=read(file);
  const menu=html.match(/<dialog\b[^>]*id=["']episodeMenu["'][^>]*>[\s\S]*?<\/dialog>/i)?.[0];
  assert(menu,'Missing episode menu: '+file);
  const menuLinks=hrefs(menu),current='/'+prefix+'episodes/'+slug+'/';
  assert(!privateLink.test(menuLinks.map(x=>x.url).join('\n')),'Private menu link: '+file);
  for(const route of routes)assert(menuLinks.some(x=>x.url===route),'Menu in '+file+' missing '+route);
  assert(menuLinks.some(x=>x.url==='/'+prefix),'Missing catalog return: '+file);
  const selected=menuLinks.filter(x=>/aria-current=["']page["']/.test(x.tag));
  assert(selected.length===1&&selected[0].url===current,'Wrong current episode: '+file);
  const other='/'+(lang==='ru'?'en/':'')+'episodes/'+slug+'/';
  assert(hrefs(html).some(x=>x.url===other&&/data-episode-language=/.test(x.tag)),'Wrong language switch: '+file);
  assert(html.includes('data-record')&&html.includes('/site/site.js'),'Missing recording/navigation control: '+file);
 }
}
console.log(`PASS: ${ru.length} bilingual episodes; catalogs, menus, language links and navigation privacy.`);
