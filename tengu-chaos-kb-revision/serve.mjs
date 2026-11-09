// Only the explicit public snapshot is served, on loopback. No private readers.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),process.argv[2]||"public");
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain'};
http.createServer((req,res)=>{
  try {
    const u=new URL(req.url,'http://localhost');
    if(['/ru','/ru/'].includes(u.pathname)){res.writeHead(302,{Location:'/'});return res.end();}
    let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
    if(file!==root&&!file.startsWith(root+path.sep))throw Error('path');
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    if(!fs.realpathSync(file).startsWith(root+path.sep)||path.basename(file).startsWith('_'))throw Error('path');
    const size=fs.statSync(file).size;
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
    if(range){const start=+range[1],end=Math.min(size-1,range[2]?+range[2]:size-1);if(start>end){res.writeHead(416);return res.end();}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res);}
    else{res.writeHead(200,{'Content-Length':size});fs.createReadStream(file).pipe(res);}
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(fs.readFileSync(path.join(root,'404.html')));}
}).listen(Number(process.argv[3]||4179),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4178/'));
