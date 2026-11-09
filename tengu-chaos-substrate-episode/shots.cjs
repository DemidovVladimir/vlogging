// Private QA helper: one screenshot per scene phase, plus a contact sheet per language.
// Usage: PLAYWRIGHT_DIR=… SHARP_DIR=… node shots.cjs [width] [height]
const {chromium}=require(process.env.PLAYWRIGHT_DIR);
const sharp=require(process.env.SHARP_DIR);
const fs=require('node:fs'),path=require('node:path');
const [width,height]=[Number(process.argv[2]||1280),Number(process.argv[3]||720)];
const out=path.join(__dirname,'qa','shots',`${width}x${height}`);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const lang of ['ru','en']){
   const page=await browser.newPage({viewport:{width,height}});const errors=[];
   page.on('pageerror',x=>errors.push(x.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   await page.goto(`http://127.0.0.1:4176/${lang}/dist/#slide-1`);await page.waitForFunction(()=>ready);
   const tiles=[];
   for(let s=1;s<=8;s++){
    await page.evaluate(id=>scrollToScene(document.getElementById(id)),'slide-'+s);await page.waitForFunction(id=>!travelState&&currentScene.id===id,'slide-'+s);
    await page.keyboard.press('KeyR');
    const count=await page.evaluate(()=>sceneTiming().count);
    for(let i=0;i<count;i++){
     const file=path.join(out,`${lang}-s${s}-p${i}.png`);await page.screenshot({path:file});
     tiles.push(file);await page.keyboard.press('ArrowRight');
    }
   }
   const w=480,h=Math.round(480*height/width),cols=5;
   await sharp({create:{width:w*cols,height:Math.ceil(tiles.length/cols)*h,channels:3,background:'#e9dfc9'}})
    .composite(await Promise.all(tiles.map(async(f,i)=>({input:await sharp(f).resize(w,h).toBuffer(),left:(i%cols)*w,top:Math.floor(i/cols)*h}))))
    .png().toFile(path.join(out,lang+'-sheet.png'));
   console.log(lang,tiles.length,'phases',errors.length?errors:'no errors');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
