// Local QA only. Use the configured runtime; download no dependencies.
const { chromium } = require('playwright');
const sharp = require('sharp');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'tengu-v32-'));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    const base = process.env.TENGU_PREVIEW_URL || 'http://127.0.0.1:4173';
    await page.goto(base + '/#slide-1');
    await page.waitForFunction(() => ready);
    const ids = await page.locator('.scene').evaluateAll(nodes => nodes.map(n => n.id));
    assert.deepEqual(ids, ['intro','slide-1','slide-2','slide-3','slide-6','slide-7','slide-10','slide-8','slide-9','slide-12','slide-13','sources']);
    assert.deepEqual(await page.locator('.scene').evaluateAll(nodes => nodes.map(n => n.dataset.index)), Array.from({length:12},(_,i)=>String(i).padStart(2,'0')));
    assert.equal(await page.locator('.rail__meta span').last().textContent(), '11');
    // The concrete format conflict is taught once; the finale adds model migration.
    assert.equal(await page.locator('.scene').filter({hasText:'Минимум 12'}).count(),1);
    assert.equal(await page.locator('.scene').filter({hasText:'Минимум 12'}).getAttribute('id'),'slide-7');
    assert.match(await page.locator('#slide-2').innerText(),/Проверяй факты по источникам/);
    assert.doesNotMatch(await page.locator('#slide-2').innerText(),/КОНФЛИКТ УЖЕ/);
    assert.equal(await page.locator('.design-study').count(),1);
    assert.match(await page.locator('#slide-13 .editorial-scope').innerText(),/Учебные макеты, не результаты теста моделей/);
    assert.match(await page.locator('.migration-task').innerText(),/страница мастерской керамики/);
    assert.equal(await page.locator('#slide-13 pre, #slide-13 code, .order-record').count(),0);
    const sameContent=await page.locator('.design-page').textContent();
    const expectedMigration=[
      ['bare','off','Старая модель'],['structured','old','Старая модель'],
      ['editorial','off','Новая модель'],['overloaded','old','Новая модель'],['editorial','updated','Новая модель']
    ];
    async function assertMigration(phase){
      const [design,rule,era]=expectedMigration[phase];
      assert.equal(await page.locator('#slide-13').getAttribute('data-frame'),String(phase));
      assert.equal(await page.locator('#slide-13').getAttribute('data-design'),design);
      assert.equal(await page.locator('.design-page').getAttribute('data-design'),design);
      assert.equal(await page.locator('#slide-13').getAttribute('data-rule'),rule);
      assert.equal(await page.locator('#migrationEra').innerText(),era);
      assert.equal(await page.locator('.migration-rule__texts .is-shown[aria-hidden="false"]').count(),1);
      assert.equal(await page.locator('.migration-rule__texts .is-shown').getAttribute('data-rule'),rule==='updated'?'updated':'old');
      assert.equal(await page.locator('.design-page').textContent(),sameContent,'same mockup copy in every phase');
      assert.equal(await page.locator('.design-photo img').getAttribute('src'),'assets/ceramics-study-v32.png');
      assert.equal(await page.locator('.design-photo img').evaluate(n=>n.complete&&n.naturalWidth===1536),true);
      assert.match(await page.locator('.design-page').getAttribute('aria-label'),new RegExp(era));
      if(phase===3) assert.match(await page.locator('#migrationResult').innerText(),/спорят за внимание/);
    }
    for(const file of ['SCRIPT-RU.md','STORY-PLAN-RU.md']) {
      assert.equal(fs.readFileSync(file,'utf8'),fs.readFileSync(path.join('dist',file),'utf8'),'published '+file+' matches canonical');
    }
    async function settled(id) {
      await page.waitForFunction(id => !travelState && currentScene.id === id, id);
      const state = await page.evaluate(() => ({hash:location.hash,top:currentScene.getBoundingClientRect().top}));
      assert.equal(state.hash, '#' + id); assert(Math.abs(state.top)<2, id + ' aligns');
    }
    await page.keyboard.press('Home');
    for (let i=1;i<ids.length;i++){ await page.keyboard.press('ArrowDown'); await settled(ids[i]); }
    for (let i=ids.length-2;i>=0;i--){ await page.keyboard.press('ArrowUp'); await settled(ids[i]); }
    await page.evaluate(()=>{go(1);finishTravel();scrollToScene(scenes.at(-1));});
    await settled('sources'); await page.waitForTimeout(300); await settled('sources');
    await page.evaluate(()=>{go(-1);location.hash='#slide-6';}); await settled('slide-6');
    await page.keyboard.press('ArrowDown'); await page.setViewportSize({width:1440,height:900}); await settled('slide-7');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.keyboard.press('ArrowDown'); await settled('slide-10');
    await page.evaluate(()=>location.hash='#slide-4'); await settled('slide-3');
    await page.evaluate(()=>location.hash='#slide-5'); await settled('slide-6');
    await page.evaluate(()=>location.hash='#slide-11'); await settled('slide-13');
    console.log('PASS: 12 scenes, order, numbering, navigation, interrupts, resize, legacy links');
    await page.emulateMedia({reducedMotion:'no-preference'});
    // Every cue is valid; manual frames stay on the current scene.
    for (const id of ids.slice(2,-1)) {
      await page.evaluate(id=>scrollToScene(document.getElementById(id)),id);
      await page.keyboard.press('KeyR');
      const count=await page.evaluate(()=>sceneTiming().count);
      for(let phase=0;phase<count;phase++){
        assert.equal(await page.evaluate(()=>currentScene.id),id);
        assert.equal(await page.evaluate(()=>animationPaused&&!clockRunning),true);
        if(id==='slide-2') assert.equal(await page.locator('.context-assembly').getAttribute('data-stage'),String(phase));
        else if(id==='slide-6') {
          assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),String(phase));
          const expected=await page.evaluate(i=>contextFrames[i],phase);
          assert.equal(await page.locator('#slide-6 .has-answer').count(),expected.answers.length);
          assert.equal(await page.locator('#contextNarration').textContent(),expected.text);
        } else if(id==='slide-13') await assertMigration(phase);
        else assert.equal(await page.locator('#'+id).getAttribute('data-story-step'),String(phase));
        await page.waitForTimeout(550);
        await page.screenshot({path:path.join(output,id+'-phase-'+phase+'.png')});
        await page.keyboard.press('ArrowRight');
      }
      await page.keyboard.press('KeyP');
    }
    assert.deepEqual(await page.locator('.same-request').allTextContents(),['Составь план ролика об ИИ','Составь план ролика об ИИ']);
    assert.equal(await page.locator('.state-vector,.mlp-detail,.vector-cards,.token-odds,.serving-theatre,.loop-compare').count(),0);
    await page.evaluate(()=>scrollToScene(document.getElementById('slide-13')));
    await page.keyboard.press('KeyR');await page.keyboard.press('ArrowLeft');await assertMigration(0);
    for(let i=1;i<=6;i++)await page.keyboard.press('ArrowRight');
    await assertMigration(4);
    for(let i=3;i>=0;i--){await page.keyboard.press('ArrowLeft');await assertMigration(i);}
    const frozenReply=await page.locator('#slide-13').getAttribute('data-frame');
    await page.waitForTimeout(550);assert.equal(await page.locator('#slide-13').getAttribute('data-frame'),frozenReply);
    await page.keyboard.press('KeyP');await page.waitForTimeout(5200);await assertMigration(1);
    console.log('PASS: every animated phase, preserved comparison, removed numerical and duplicate diagrams');
    await page.evaluate(()=>scrollToScene(document.getElementById('slide-6')));
    await page.keyboard.press('KeyR'); await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'0');
    for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'5');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'4');
    for(let i=0;i<3;i++)await page.keyboard.press('Minus');
    assert.equal(await page.evaluate(()=>animationRate),.25);
    const stopped=await page.evaluate(()=>animationTime());
    await page.keyboard.press('KeyP');await page.waitForTimeout(800);
    const moved=await page.evaluate(()=>animationTime());
    assert(moved>stopped+.12&&moved<stopped+.45);
    await page.keyboard.press('KeyP');await page.keyboard.press('Equal');
    assert.equal(await page.evaluate(()=>animationRate),.5);
    await page.keyboard.press('Digit0');assert.equal(await page.evaluate(()=>animationRate),1);
    const paused=await page.evaluate(()=>animationTime());
    await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>animationTime()),paused);
    await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP',key:'з',bubbles:true})));
    assert.equal(await page.evaluate(()=>animationPaused),false);
    await page.evaluate(()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));window.frozenAt=animationTime();
    });
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>animationTime()),await page.evaluate(()=>window.frozenAt));
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    assert.equal(await page.evaluate(()=>clockRunning),true);
    await page.evaluate(()=>{
      const editor=document.createElement('input');editor.id='qaEditor';editor.style.cssText='position:fixed;top:0;left:0';
      document.body.append(editor);editor.focus({preventScroll:true});
    });
    await page.keyboard.press('KeyP');assert.equal(await page.evaluate(()=>animationPaused),false);
    await page.evaluate(()=>document.getElementById('qaEditor').remove());
    await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyP',ctrlKey:true,bubbles:true})));
    assert.equal(await page.evaluate(()=>animationPaused),false);
    await page.evaluate(()=>syncScene());await page.waitForTimeout(4700);
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'1');
    await page.evaluate(()=>scrollToScene(document.getElementById('slide-3')));
    await page.waitForTimeout(4700);
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'1');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>scrollToScene(document.getElementById('slide-6')));
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'5');
    assert.equal(await page.evaluate(()=>clockRunning),false);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#slide-6').getAttribute('data-frame'),'4');
    await page.keyboard.press('KeyP');
    await page.evaluate(()=>{manualAnimation=false;runAnimationClock();});
    console.log('PASS: pause, reverse step, speed, visibility, focus guards, timers, reduced motion');
    const montage=[];
    for(const viewport of [{width:1280,height:720},{width:1440,height:900},{width:664,height:853},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(let i=0;i<ids.length;i++){
        await page.evaluate(id=>scrollToScene(document.getElementById(id)),ids[i]);
        await page.waitForTimeout(60);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+ids[i]+' '+viewport.width);
        if(viewport.width>980)assert.equal(await page.evaluate(()=>currentScene.offsetHeight),viewport.height,ids[i]+' desktop fit');
        const file=path.join(output,viewport.width+'-'+ids[i]+'.png');
        await page.locator('#'+ids[i]).screenshot({path:file});
        if(viewport.width===1280)montage.push({input:await sharp(file).resize(384,216).toBuffer(),left:(i%3)*384,top:Math.floor(i/3)*216});
        if(ids[i]==='slide-6'||ids[i]==='slide-13'){
          const height=await page.locator('#'+ids[i]).evaluate(n=>n.offsetHeight);
          await page.keyboard.press('KeyR');
          const phaseCount=ids[i]==='slide-13'?5:6;
          const designPosition=ids[i]==='slide-13'?await page.locator('.design-page').boundingBox():null;
          for(let phase=0;phase<phaseCount;phase++){
            assert.equal(await page.locator('#'+ids[i]).evaluate(n=>n.offsetHeight),height,'no phase reflow '+ids[i]);
            if(ids[i]==='slide-13'){
              await assertMigration(phase);
              await page.waitForTimeout(700);
              const designNow=await page.locator('.design-page').boundingBox();
              assert(Math.abs(designNow.y-designPosition.y)<1,'stable mockup position across phases '+viewport.width);
              assert.equal(designNow.height,designPosition.height,'stable mockup height');
              for(const child of ['.design-wordmark','.design-nav','.design-copy','.design-photo','.design-meta','.design-cta']){
                const box=await page.locator(child).boundingBox();
                assert(box.x>=designNow.x&&box.x+box.width<=designNow.x+designNow.width+1,'mockup horizontal fit '+child+' '+viewport.width+' phase '+phase);
                assert(box.y>=designNow.y&&box.y+box.height<=designNow.y+designNow.height+1,'mockup vertical fit '+child+' '+viewport.width+' phase '+phase);
              }
              await page.locator('#slide-13').screenshot({path:path.join(output,viewport.width+'-migration-'+phase+'.png')});
            }
            await page.keyboard.press('ArrowRight');
          }
          await page.keyboard.press('KeyP');await page.evaluate(()=>{manualAnimation=false;runAnimationClock();});
        }
      }
    }
    await sharp({create:{width:1152,height:864,channels:3,background:'#e9dfc9'}}).composite(montage).png().toFile(path.join(output,'all-scenes.png'));
    await page.evaluate(()=>scrollToScene(document.getElementById('slide-3')));
    const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,220);await page.waitForTimeout(150);
    assert(await page.evaluate(y=>scrollY>y&&!travelState,y),'natural mobile scroll');
    assert.equal(await page.locator('.closing-logo').evaluate(n=>getComputedStyle(n).filter),'none');
    assert.equal(await page.locator('.source-grid a').count(),6);
    await page.keyboard.press('Home');await page.locator('#startButton').click();
    await page.waitForFunction(()=>document.getElementById('introVideo').currentTime>0);
    assert.equal(await page.locator('#introVideo').evaluate(v=>v.videoWidth),1920);
    assert(await page.locator('#introVeil').evaluate(n=>n.classList.contains('is-hidden')));
    for(const suffix of ['/script.html','/script.html?view=plan']){
      await page.goto(base+suffix);
      await page.waitForFunction(()=>document.querySelector('#scriptContent h1'));
      assert.equal(await page.locator('#scriptContent h2').allTextContents().then(t=>t.filter(x=>x[2]===' '&&x[3]==='/').length),12);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: all responsive layouts, intro, logo, sources, script and plan; no JS/resource errors');
    console.log('SCREENSHOTS '+output);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
