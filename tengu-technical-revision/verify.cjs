const {chromium}=require('playwright');
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:4177';
const out=path.join(__dirname,'qa',new URL(origin).hostname);fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const report={origin,editions:[],errors:[]};
 try{
 for(const slug of ['tengu-cluster','emudhra-ca-compromise'])for(const lang of ['ru','en']){
  const ctx=await browser.newContext({viewport:{width:1280,height:720}}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  const prefix=(lang==='en'?'/en':'')+'/episodes/'+slug+'/';
  await page.goto(origin+prefix+'#slide-1');await page.waitForFunction(()=>ready);await page.evaluate(()=>document.fonts.ready);
  const ids=await page.locator('.scene').evaluateAll(ns=>ns.map(n=>n.id));assert.equal(ids.length,9);
  const shots=[];let phases=0;
  for(const id of ids.slice(1)){
   await page.evaluate(id=>scrollToScene(document.getElementById(id)),id);await page.keyboard.press('KeyR');
   const count=await page.evaluate(()=>sceneTiming().count);
   for(let f=0;f<count;f++){
    assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(f));
    if(await page.locator('#'+id+' [data-caption]').count()){const caption=await page.locator('#'+id+' [data-caption]').innerText();assert(caption.trim()&&!caption.includes('undefined'));}
    assert(await page.evaluate(()=>animationPaused&&!clockRunning));
    await page.keyboard.press('ArrowRight');phases++;
   }
   for(let f=count-2;f>=0;f--){await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(f));}
  }
  await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>animationPaused),false);
  await page.keyboard.press('Minus');assert.equal(await page.evaluate(()=>animationRate),.5);
  await page.keyboard.press('Equal');assert.equal(await page.evaluate(()=>animationRate),1);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  for(const [w,h]of [[1280,720],[1920,1080],[390,844]]){
   await page.setViewportSize({width:w,height:h});
   for(const id of ids.slice(1)){
    await page.evaluate(id=>{manualAnimation=false;animationPaused=false;scrollToScene(document.getElementById(id));runAnimationClock();},id);
    await page.waitForTimeout(50);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+slug+lang+id+w);
    if(w>=900){
     assert.equal(await page.locator('#'+id).evaluate(n=>n.offsetHeight),h,'Vertical overflow '+slug+lang+id+w);
     const clipped=await page.locator('#'+id+' h1,#'+id+' h2,#'+id+' h3,#'+id+' p').evaluateAll(ns=>ns.filter(n=>{const a=n.getBoundingClientRect(),b=n.closest('.scene').getBoundingClientRect();return a.bottom>b.bottom+1||a.right>b.right+1;}).map(n=>n.textContent));
     assert.deepEqual(clipped,[],'Text overflow '+slug+lang+id+w);
    }
    const file=path.join(out,`${slug}-${lang}-${w}-${id}.png`);await page.locator('#'+id).screenshot({path:file});
    if(w===1280)shots.push({input:await sharp(file).resize(512,288).toBuffer(),left:(shots.length%2)*512,top:Math.floor(shots.length/2)*288});
   }
  }
  await sharp({create:{width:1024,height:1152,channels:3,background:'#e9dfc9'}}).composite(shots).png().toFile(path.join(out,slug+'-'+lang+'-overview.png'));
  if(lang==='en')assert.doesNotMatch(await page.locator('body').innerText(),/[А-Яа-яЁё]/);
  assert.equal(await page.locator('a[href*="script.html"],a[href*="SCRIPT-"]').count(),0);
  await page.setViewportSize({width:1280,height:720});
  await page.locator('[data-open-menu]').click();assert(await page.locator('#deck').evaluate(n=>n.inert));
  const hash=new URL(page.url()).hash;await page.keyboard.press('ArrowDown');assert.equal(new URL(page.url()).hash,hash);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#deck').inert);
  await page.keyboard.press('KeyH');assert.equal(await page.locator('.site-nav').isVisible(),false);
  await page.keyboard.press('KeyH');assert(await page.locator('.site-nav').isVisible());
  const target=await page.locator('[data-episode-language]').getAttribute('href');assert(target.endsWith(hash));
  await page.keyboard.press('Home');await page.locator('#startButton').click();await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
  assert(await page.locator('video').evaluate(v=>!v.muted&&v.webkitAudioDecodedByteCount>0));
  await ctx.close();report.editions.push({slug,lang,scenes:ids.length,phases,viewports:[1280,1920,390],controls:true,audio:true});console.log('PASS '+slug+' '+lang);
 }
 assert.deepEqual(report.errors,[]);report.status='passed';fs.writeFileSync(path.join(out,'technical-qa.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
