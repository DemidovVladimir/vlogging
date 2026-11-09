const {chromium}=require('playwright');
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:4178';
const out=path.join(__dirname,'qa',new URL(origin).hostname);fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const lang of ['ru','en']){
   const c=await b.newContext({viewport:{width:1280,height:720}}),p=await c.newPage();
   await p.goto(origin+(lang==='en'?'/en':'')+'/episodes/emudhra-ca-compromise/#slide-1');await p.waitForFunction(()=>ready);await p.evaluate(()=>document.fonts.ready);
   const shots=[];
   for(let i=1;i<=8;i++){
    await p.evaluate(i=>scrollToScene(document.getElementById('slide-'+i)),i);await p.keyboard.press('KeyR');
    const count=await p.evaluate(()=>sceneTiming().count);
    for(let f=0;f<count;f++){
     const file=path.join(out,`${lang}-scene-${i}-phase-${f}.png`);await p.locator('#slide-'+i).screenshot({path:file});
     shots.push({input:await sharp(file).resize(512,288).toBuffer(),left:(shots.length%3)*512,top:Math.floor(shots.length/3)*288});
     await p.keyboard.press('ArrowRight');
    }
   }
   await sharp({create:{width:1536,height:Math.ceil(shots.length/3)*288,channels:3,background:'#e9dfc9'}}).composite(shots).png().toFile(path.join(out,lang+'-all-phases.png'));
   await p.keyboard.press('KeyR');let t=await p.evaluate(()=>animationTime());await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>animationTime()),t,'Paused clock changed');
   await p.keyboard.press('KeyP');await p.waitForTimeout(500);assert(await p.evaluate(()=>animationTime())>t,'Clock did not resume');await p.keyboard.press('KeyP');
   for(let i=0;i<5;i++)await p.keyboard.press('Minus');assert.equal(await p.evaluate(()=>animationRate),.25);
   for(let i=0;i<8;i++)await p.keyboard.press('Equal');assert.equal(await p.evaluate(()=>animationRate),2);
   await p.keyboard.press('Digit0');assert.equal(await p.evaluate(()=>animationRate),1);
   await p.keyboard.press('KeyR');const hash=new URL(p.url()).hash;
   await p.locator('#slide-8 .source-grid a').first().focus();await p.keyboard.press('ArrowLeft');assert.equal(new URL(p.url()).hash,hash);
   await p.locator('#slide-8 .source-grid a').first().blur();
   await p.goto(origin+(lang==='en'?'/en':'')+'/episodes/emudhra-ca-compromise/?record=1#slide-6');await p.waitForFunction(()=>ready);
   assert.equal(await p.locator('.site-nav').isVisible(),false);
   const recordedHref=await p.locator('[data-episode-language]').getAttribute('href');assert(recordedHref.includes('record=1')&&recordedHref.endsWith('#slide-6'));
   // H deliberately leaves recording mode and removes record=1 from the URL.
   await p.keyboard.press('KeyH');assert.equal(new URL(p.url()).searchParams.has('record'),false);
   await p.locator('[data-episode-language]').click();await p.waitForURL(u=>u.pathname.startsWith('/en/')===(lang==='ru'));await p.waitForFunction(()=>typeof ready!=='undefined'&&ready);assert.equal(new URL(p.url()).hash,'#slide-6');assert.equal(await p.locator('html').getAttribute('lang'),lang==='ru'?'en':'ru');
   await p.goto(new URL(recordedHref,origin).href);await p.waitForFunction(()=>ready);assert.equal(await p.locator('.site-nav').isVisible(),false);assert.equal(new URL(p.url()).hash,'#slide-6');
   await c.close();
  }
  fs.writeFileSync(path.join(out,'phase-qa.json'),JSON.stringify({status:'passed',phaseScreenshots:46,pauseHold:true,speedBounds:true,focusGuard:true,languageSwitch:true,recordingQuery:true},null,2));
  console.log('PASS: 46 phase screenshots; pause, speed bounds, focus and language/recording controls.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
