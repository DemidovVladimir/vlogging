const {chromium}=require('/Users/vladimirdemidov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const failures=[],errors=[],requests=[],checks=[];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');let rel=decodeURIComponent(u.pathname);if(rel.endsWith('/'))rel+='index.html';const file=path.resolve(dist,'.'+rel);if(!file.startsWith(dist+path.sep))throw Error('badpath');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});
let browser;
(async()=>{
 await fs.mkdir(path.join(__dirname,'tmp'),{recursive:true});
 await new Promise(resolve=>server.listen(8768,'127.0.0.1',resolve));
 browser=await chromium.launchPersistentContext(path.join(__dirname,'profile'),{executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true,viewport:{width:1920,height:1080},env:{...process.env,TMPDIR:path.join(__dirname,'tmp')},args:['--disable-background-networking','--disable-component-update','--disable-sync']});
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>requests.push(r.url()+': '+r.failure()?.errorText));
 page.on('response',r=>{if(r.status()>=400)requests.push(r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:8768/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 await page.click('#startButton');
 await page.waitForFunction(()=>document.querySelector('#introVideo').ended,{timeout:15000});
 checks.push('Intro plays and ends after explicit click');
 const ids=await page.locator('.scene').evaluateAll(els=>els.map(e=>e.id));
 for(const size of [[1920,1080],[1280,720],[1440,900],[664,853],[390,844]]){
  const [width,height]=size;await page.setViewportSize({width,height});
  for(const id of ids){
   await page.goto('http://127.0.0.1:8768/#'+id,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   if(id.startsWith('slide-')&&Number(id.slice(6))>=2){
    await page.keyboard.press('r');
    const count=await page.evaluate(()=>sceneTiming()?.count||1);
    for(let at=0;at<count;at++){
     assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(at));
     if(width===1920)await page.screenshot({path:path.join(__dirname,`${width}x${height}-${id}-phase${at}.png`)});
     if(at<count-1)await page.keyboard.press('ArrowRight');
    }
    // Every phase back and forward must agree with deterministic index.
    for(let at=count-2;at>=0;at--){await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#'+id).getAttribute('data-frame'),String(at));}
    await page.keyboard.press('ArrowRight');
    const held=await page.evaluate(()=>animationTime());await page.waitForTimeout(240);assert.ok(Math.abs((await page.evaluate(()=>animationTime()))-held)<0.05);
    await page.keyboard.press('Equal');assert.equal(await page.locator('html').getAttribute('data-animation-rate'),'2');
    await page.keyboard.press('Digit0');assert.equal(await page.locator('html').getAttribute('data-animation-rate'),'1');
   }
   if(width<=980)await page.locator('#'+id).screenshot({path:path.join(__dirname,`${width}x${height}-${id}.png`)});else await page.screenshot({path:path.join(__dirname,`${width}x${height}-${id}.png`)});
   const bounds=await page.locator('#'+id).evaluate((scene,{width,height})=>{
    const rect=scene.getBoundingClientRect();
    const important=[...scene.querySelectorAll('h1,h2,h3,p,pre,small,.eyebrow,.source-grid,.closing-machines,.closing-logo')];
    const horizontal=important.filter(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>width+1;}).map(el=>el.id||el.className||el.tagName);
    const clipped=important.filter(el=>{const r=el.getBoundingClientRect();return r.bottom>rect.bottom+1;}).map(el=>el.id||el.className||el.tagName);
    return {sceneHeight:rect.height,horizontal,clipped,viewportOverflow:width>980&&rect.height>height+1};
   },{width,height});
   if(bounds.horizontal.length||bounds.clipped.length||bounds.viewportOverflow)failures.push({size,id,bounds});
  }
 }
 checks.push('All9scenes/hash-refresh; everyphaseforward/back, pausedclock and2x/normal rate at5viewports');
 await page.setViewportSize({width:1280,height:720});
 await page.goto('http://127.0.0.1:8768/#slide-2',{waitUntil:'networkidle'});
 await page.keyboard.press('End');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>currentScene.id),'sources');
 await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>currentScene.id),'intro');
 await page.keyboard.press('ArrowDown');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>currentScene.id),'slide-1');
 await page.keyboard.press('ArrowUp');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>currentScene.id),'intro');
 checks.push('Home/End, scene forward/back');
 await page.goto('http://127.0.0.1:8768/#slide-2',{waitUntil:'networkidle'});
 await page.keyboard.press('r');await page.keyboard.press('p');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const hiddenAt=await page.evaluate(()=>animationTime());await page.waitForTimeout(350);assert.ok(Math.abs((await page.evaluate(()=>animationTime()))-hiddenAt)<0.05);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(350);assert.ok((await page.evaluate(()=>animationTime()))>hiddenAt+0.2);
 checks.push('Visibilitychange integration (document.hidden simulated): clock freezes/resumes');

 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8768/#slide-2',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#slide-2').getAttribute('data-frame'),'2');
 await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#slide-2').getAttribute('data-frame'),'1');
 checks.push('Reducedmotion finalstate and manualphases');
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const view of ['', '?view=plan']){
  await page.goto('http://127.0.0.1:8768/script.html'+view,{waitUntil:'networkidle'});
  assert.ok((await page.locator('#scriptContent').innerText()).length>1000);
 }
 checks.push('SeparateprivateSCRIPT/PLANviewers load');
 const result={status:failures.length||errors.length||requests.length?'FAIL':'PASS',draft:true,checks,failures,errors,requests};
 await fs.writeFile(path.join(__dirname,'browser-report.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
})().catch(async e=>{console.error(e.stack);await fs.writeFile(path.join(__dirname,'browser-report.json'),JSON.stringify({status:'FAIL',draft:true,checks,failures,errors,requests,exception:e.stack},null,2));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
