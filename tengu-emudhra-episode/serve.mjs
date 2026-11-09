// Local rehearsal server; intentionally loopback-only because scripts are private.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2','.ttf':'font/ttf','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 try{
  const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let full=path.resolve(root,'.'+requestPath);
  if(!full.startsWith(root+path.sep)&&full!==root)throw Error('path');
  if(fs.statSync(full).isDirectory())full=path.join(full,'index.html');
  if(!fs.realpathSync(full).startsWith(root+path.sep))throw Error('path');
  const size=fs.statSync(full).size;res.setHeader('Content-Type',types[path.extname(full)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const start=+range[1],end=Math.min(size-1,range[2]?+range[2]:size-1);if(start>end){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(full,{start,end}).pipe(res);}
  else{res.writeHead(200,{'Content-Length':size});fs.createReadStream(full).pipe(res);}
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(4175,'127.0.0.1',()=>console.log('Private rehearsal: http://127.0.0.1:4175/ru/dist/ and /en/dist/'));
