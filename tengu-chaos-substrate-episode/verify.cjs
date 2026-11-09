// Private browser QA for EP.05, never part of the public projection.
// Usage: PLAYWRIGHT_DIR=… SHARP_DIR=… node verify.cjs [origin]
// The working decks are on :4176 (/ru/dist/, /en/dist/); any other origin is a site with the public routes.
const {chromium}=require(process.env.PLAYWRIGHT_DIR);
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require(process.env.SHARP_DIR);
const origin=process.argv[2]||'http://127.0.0.1:4176';
const live=origin.startsWith('https://');
const site=live||new URL(origin).port!=='4176';
const out=path.join(__dirname,'qa',live?new URL(origin).hostname:site?'staged':'local');
const sceneIds=['intro',...Array.from({length:8},(_,i)=>'slide-'+(i+1))];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const report={origin,checkedAt:new Date().toISOString(),languages:{}};
 try{
  for(const lang of ['ru','en']){
   const context=await browser.newContext({viewport:{width:1280,height:720}});
   const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.setDefaultTimeout(60000);const errors=[];
   page.on('pageerror',x=>errors.push(x.message));
   page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
   const prefix=site?(lang==='ru'?'/episodes/chaos-substrate/':'/en/episodes/chaos-substrate/'):`/${lang}/dist/`;
   await page.goto(origin+prefix+'#slide-1');await page.waitForFunction(()=>ready);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.deepEqual(await page.locator('.scene').evaluateAll(x=>x.map(y=>y.id)),sceneIds);
   if(lang==='en')assert.doesNotMatch(await page.locator('body').innerText(),/[А-Яа-яЁё]/);
   await page.keyboard.press('Home');
   for(const id of sceneIds.slice(1)){await page.keyboard.press('ArrowDown');await page.waitForFunction(id=>!travelState&&currentScene.id===id,id);}
   for(const id of sceneIds.slice(0,-1).reverse()){await page.keyboard.press('ArrowUp');await page.waitForFunction(id=>!travelState&&currentScene.id===id,id);}
   const phaseScreens=[];
   for(const id of sceneIds.slice(1)){
    await page.evaluate(id=>scrollToScene(document.getElementById(id)),id);await page.keyboard.press('KeyR');
    const count=await page.evaluate(()=>sceneTiming().count);
    for(let i=0;i<count;i++){
     assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(i));
     assert(await page.evaluate(()=>animationPaused&&!clockRunning));
     const shot=path.join(out,`${lang}-${id}-phase-${i}.png`);await page.screenshot({path:shot});
     phaseScreens.push({input:await sharp(shot).resize(384,216).toBuffer(),left:(phaseScreens.length%4)*384,top:Math.floor(phaseScreens.length/4)*216});
     await page.keyboard.press('ArrowRight');
    }
    for(let i=count-2;i>=0;i--){await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(i));}
    const frozen=await page.evaluate(()=>animationTime());await page.waitForTimeout(160);assert.equal(await page.evaluate(()=>animationTime()),frozen);
   }
   await sharp({create:{width:1536,height:Math.ceil(phaseScreens.length/4)*216,channels:3,background:'#e9dfc9'}}).composite(phaseScreens).png().toFile(path.join(out,lang+'-phases.png'));
   await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>animationPaused),false);
   await page.keyboard.press('Minus');assert.equal(await page.evaluate(()=>animationRate),.5);
   await page.keyboard.press('Equal');assert.equal(await page.evaluate(()=>animationRate),1);
   await page.keyboard.press('Equal');assert.equal(await page.evaluate(()=>animationRate),2);
   await page.keyboard.press('Digit0');assert.equal(await page.evaluate(()=>animationRate),1);
   // Focus guards: navigation keys on links must not move the deck.
   await page.locator('.substrate-sources a').first().focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>animationPaused),false);
   await page.evaluate(()=>document.activeElement.blur());
   // Real background tab visibility; the scene clock must freeze.
   const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
   if(await page.evaluate(()=>document.hidden)){
    const frozen=await page.evaluate(()=>animationTime());await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>animationTime()),frozen);
   }
   await other.close();await page.bringToFront();
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>{animationPaused=false;manualAnimation=false;runAnimationClock();});
   assert.equal(await page.evaluate(()=>clockRunning),false);
   await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#slide-8').getAttribute('data-frame'),'1');
   const all=[];
   for(const size of [[1280,720],[1920,1080],[1440,900],[664,853],[390,844]]){
    await page.setViewportSize({width:size[0],height:size[1]});
    for(const [i,id]of sceneIds.entries()){
     await page.evaluate(id=>{animationPaused=false;manualAnimation=false;scrollToScene(document.getElementById(id));runAnimationClock();},id);
     await page.waitForTimeout(70);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+lang+' '+size+' '+id);
     if(size[0]>=900)assert.equal(await page.locator('#'+id).evaluate(n=>n.offsetHeight),size[1],'Vertical overflow '+lang+' '+size+' '+id);
     assert(await page.locator('#'+id+' img').evaluateAll(nodes=>nodes.every(n=>n.complete&&n.naturalWidth>0)),'Images '+id);
     if(size[0]>=900){
      const clipped=await page.locator('#'+id+' h1,#'+id+' h2,#'+id+' p,#'+id+' .scene-foot').evaluateAll(nodes=>nodes.filter(n=>{const a=n.getBoundingClientRect(),b=n.closest('.scene').getBoundingClientRect();return a.bottom>b.bottom+1||a.right>b.right+1;}).map(n=>n.textContent));assert.deepEqual(clipped,[],'Text outside scene');
     }
     const file=path.join(out,`${lang}-${size[0]}-${id}.png`);await page.locator('#'+id).screenshot({path:file});
     if(size[0]===1280)all.push({input:await sharp(file).resize(512,288).toBuffer(),left:(i%3)*512,top:Math.floor(i/3)*288});
    }
   }
   await sharp({create:{width:1536,height:864,channels:3,background:'#e9dfc9'}}).composite(all).png().toFile(path.join(out,lang+'-overview.png'));
   assert.equal(await page.locator('.closing-logo').evaluate(n=>getComputedStyle(n).filter),'none');
   assert.equal(await page.locator('a[href*="script.html"],a[href^="SCRIPT-"]').count(),0);
   await page.setViewportSize({width:1280,height:720});await page.keyboard.press('Home');await page.locator('#startButton').click();
   await page.waitForFunction(()=>document.getElementById('introVideo').currentTime>.2);
   const video=await page.locator('#introVideo').evaluate(v=>({width:v.videoWidth,muted:v.muted,duration:v.duration,audio:v.webkitAudioDecodedByteCount}));
   assert.equal(video.width,1920);assert.equal(video.muted,false);assert(video.duration>2&&video.duration<3);assert(video.audio>0,'Audio decoded');
   await page.waitForFunction(()=>document.getElementById('introVideo').ended);
   // Hash refresh opens the requested scene.
   await page.goto(origin+prefix+'#slide-5');await page.waitForFunction(()=>ready&&currentScene.id==='slide-5');
   assert.deepEqual(errors,[]);
   if(!site){for(const suffix of ['script.html','script.html?view=plan']){await page.goto(origin+prefix+suffix);await page.waitForFunction(()=>document.querySelector('#scriptContent h1'));assert((await page.locator('#scriptContent').innerText()).includes('EP.05'));}}
   report.languages[lang]={status:'passed',scenes:9,phases:30,viewports:5,intro:video};
   await context.close();console.log('PASS '+lang+': every scene, every phase, controls, five sizes and intro'+(site?'.':'; private local reader.'));
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
