// Read-only guard: approved Russian content and shared visuals stay unchanged.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'releases/ru-v33-lock.json'),'utf8'));
const changed=Object.entries(lock.sha256).filter(([file,hash])=>{
  const p=path.join(root,file);
  return !fs.existsSync(p)||crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==hash;
}).map(([file])=>file);
if(changed.length){console.error('Approved RU v33 changed:',changed);process.exitCode=1;}
else console.log('PASS: all '+Object.keys(lock.sha256).length+' approved RU v33 files are byte-identical.');
