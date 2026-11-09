// Private regression tests. No files in this directory except the public allowlist are deployed.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const origin=process.argv[2]||'http://127.0.0.1:4176';
const out=path.join(__dirname,'qa',new URL(origin).hostname);
const slugs=['agent-context','tengu-cluster','emudhra-ca-compromise'];
const route=(lang,slug='')=>(lang==='en'?'/en':'')+'/'+(slug?'episodes/'+slug+'/':'');
const errors=[];
const normalizeMain=(html,base)=>html.match(/<main id="deck">[\s\S]*?<\/main>/)[0].replace(/\b(src|poster)="([^"]+)"/g,(s,a,v)=>`${a}="${new URL(v,'https://tengucluster.com'+base).pathname}"`);
for(const lang of ['ru','en']) for(const slug of slugs){
 const old=slug==='agent-context'?route(lang):route(lang,slug),next=route(lang,slug);
 const a=fs.readFileSync(path.join(__dirname,'previous/public',old,'index.html'),'utf8');
 const b=fs.readFileSync(path.join(__dirname,'public',next,'index.html'),'utf8');
 assert.equal(normalizeMain(a,old),normalizeMain(b,next),'Slide markup changed: '+next);
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const report={origin,checkedAt:new Date().toISOString(),slideContentPreserved:true,catalogs:[],viewers:[],legacyLinks:[]};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(60000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  for(const lang of ['ru','en']){
   for(const [w,h] of [[1440,900],[768,1024],[390,844],[320,720]]){
    await page.setViewportSize({width:w,height:h});
    await page.goto(origin+route(lang),{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('article').count(),3);
    assert.equal(await page.locator('#deck').count(),0,'Root still opens a deck');
    for(const slug of slugs)assert(await page.locator(`a[href="${route(lang,slug)}"]`).count()>0);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Catalog overflow '+w);
    if(lang==='en')assert.doesNotMatch(await page.locator('body').innerText(),/[А-Яа-яЁё]/);
    await page.locator('summary').click();assert(await page.locator('details').getAttribute('open')!==null);await page.locator('summary').click();
    await page.screenshot({path:path.join(out,`catalog-${lang}-${w}.png`),fullPage:true});
    report.catalogs.push({lang,width:w,status:'passed'});
   }
   const other=lang==='ru'?'en':'ru';
   await page.locator('.catalog-languages a').click();await page.waitForURL(origin+route(other));
   for(const slug of slugs){
    await page.setViewportSize({width:1280,height:720});
    const url=origin+route(lang,slug);
    await page.goto(url+'#slide-2');await page.waitForFunction(()=>ready&&currentScene.id==='slide-2');await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    const ids=await page.locator('.scene').evaluateAll(nodes=>nodes.map(n=>n.id));
    // Modal focus, Escape and arrows must not accidentally control the slide underneath.
    await page.locator('[data-open-menu]').click();
    assert(await page.locator('#episodeMenu').evaluate(d=>d.open));
    assert(await page.locator('#deck').evaluate(d=>d.inert));
    assert.equal(await page.locator('.episode-menu__list a').count(),3);
    assert.equal(await page.locator('.episode-menu__list a[aria-current="page"]').getAttribute('href'),route(lang,slug));
    const oldHash=new URL(page.url()).hash;
    await page.locator('.episode-menu__home').focus();
    await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
    assert.equal(new URL(page.url()).hash,oldHash);
    await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('dialog')));
    await page.screenshot({path:path.join(out,`menu-${lang}-${slug}.png`)});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#episodeMenu').open&&!document.querySelector('#deck').inert);
    await page.keyboard.press('KeyH');assert.equal(await page.locator('.site-nav').isVisible(),false);assert.equal(new URL(page.url()).searchParams.get('record'),'1');
    await page.reload();await page.waitForFunction(()=>ready);assert.equal(await page.locator('.site-nav').isVisible(),false);
    await page.keyboard.press('KeyH');assert(await page.locator('.site-nav').isVisible());assert.equal(new URL(page.url()).searchParams.has('record'),false);
    await page.keyboard.press('KeyR');assert(await page.evaluate(()=>animationPaused&&!clockRunning));
    const start=await page.evaluate(()=>animationTime());await page.keyboard.press('ArrowRight');assert((await page.evaluate(()=>animationTime()))>start);
    await page.keyboard.press('ArrowLeft');assert((await page.evaluate(()=>animationTime()))<=start+.01);
    await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>animationPaused),false);
    await page.keyboard.press('Minus');assert.equal(await page.evaluate(()=>animationRate),.5);await page.keyboard.press('Equal');assert.equal(await page.evaluate(()=>animationRate),1);
    // Walk all slides, including old non-contiguous IDs, without changing runtime behavior.
    await page.keyboard.press('Home');await page.waitForFunction(()=>currentScene.id==='intro');
    for(const id of ids.slice(1)){await page.keyboard.press('ArrowDown');await page.waitForFunction(id=>!travelState&&currentScene.id===id,id);}
    await page.keyboard.press('ArrowUp');await page.waitForFunction(id=>!travelState&&currentScene.id===id,ids.at(-2));
    const hash=await page.evaluate(()=>location.hash);
    await page.locator('[data-episode-language]').focus();
    assert.equal(await page.locator('[data-episode-language]').getAttribute('href'),route(other,slug)+hash);
    await page.locator('[data-episode-language]').click();await page.waitForURL(origin+route(other,slug)+hash);await page.waitForFunction(()=>ready);
    assert.equal(await page.locator('html').getAttribute('lang'),other);
    await page.goto(url+'#slide-1');await page.waitForFunction(()=>ready);
    for(const [w,h] of [[1280,720],[768,1024],[390,844],[320,720]]){
      await page.setViewportSize({width:w,height:h});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Viewer overflow '+slug+' '+w);
      assert(await page.locator('.site-nav').evaluate(n=>{const a=n.getBoundingClientRect(),b=document.querySelector('.rail__brand').getBoundingClientRect();return a.left>b.right&&a.right<=innerWidth;}),'Navigation overlaps brand');
      await page.locator('[data-open-menu]').click();
      assert(await page.locator('#episodeMenu').evaluate(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1;}),'Menu outside viewport');
      if(w===390)await page.screenshot({path:path.join(out,`menu-${lang}-${slug}-mobile.png`)});
      await page.locator('[data-record]').click();await page.waitForFunction(()=>!document.querySelector('#deck').inert);assert.equal(await page.locator('.site-nav').isVisible(),false);
      await page.keyboard.press('KeyH');assert(await page.locator('.site-nav').isVisible());
    }
    // Intro still starts from a deliberate click, including its real decoded audio.
    await page.setViewportSize({width:1280,height:720});await page.keyboard.press('Home');await page.waitForFunction(()=>currentScene.id==='intro');
    await page.locator('#startButton').click();await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
    const audio=await page.locator('video').evaluate(v=>!v.muted&&v.webkitAudioDecodedByteCount>0);assert(audio,'Intro sound');
    await page.waitForFunction(()=>document.querySelector('video').ended);
    await page.locator('[data-open-menu]').click();await page.locator('.episode-menu__home').click();await page.waitForURL(origin+route(lang));
    report.viewers.push({lang,slug,slides:ids.length,menu:true,keyboard:true,recording:true,languageSwitch:true,introAudio:true});
    console.log('PASS viewer '+lang+' '+slug);
   }
   for(const hash of ['#slide-6','#intro']){
    await page.goto(origin+route(lang)+'?v=33'+hash);await page.waitForURL(origin+route(lang,'agent-context')+'?v=33'+hash);await page.waitForFunction(()=>ready);
    assert.equal(await page.evaluate(()=>currentScene.id),hash.slice(1));
    report.legacyLinks.push(route(lang)+hash);
   }
  }
  assert.deepEqual(errors,[],'Browser/resource errors');report.status='passed';
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS: RU/EN catalogs, six viewers, 4 viewports, menu focus, language, recording, slide controls, intros and legacy deep links.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
