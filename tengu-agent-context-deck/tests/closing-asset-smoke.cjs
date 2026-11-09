// Focused regression for v33: a complete silhouette in the closing slide.
const { chromium } = require('playwright');
const sharp = require('sharp');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
(async () => {
  const asset = 'dist/assets/tengu-kaiju-complete-v33.png';
  const { data, info } = await sharp(asset).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width,1086); assert.equal(info.height,1448);
  let opaque = 0;
  for (let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    const alpha = data[(y*info.width+x)*4+3];
    if(alpha>32) {
      opaque++;
      assert(x>0 && y>0 && x<info.width-1 && y<info.height-1,'silhouette touches canvas');
    }
  }
  assert(opaque>info.width*info.height*.25,'nonempty character');
  const output = fs.mkdtempSync(path.join(os.tmpdir(),'tengu-v33-'));
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto((process.env.TENGU_PREVIEW_URL||'http://127.0.0.1:4173')+'/#sources');
    await page.waitForFunction(()=>ready);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.atlas-cover__art img').getAttribute('src'),'assets/tengu-kaiju-v23.png');
    assert.equal(await page.locator('.closing-machines>img').first().getAttribute('src'),'assets/tengu-kaiju-complete-v33.png');
    assert.equal(await page.locator('.closing-machines').evaluate(n=>getComputedStyle(n).maskImage),'none');
    assert.equal(await page.locator('.closing-machines>img').first().evaluate(n=>getComputedStyle(n).maskImage),'none');
    assert.equal(await page.locator('.closing-logo').evaluate(n=>getComputedStyle(n).filter),'none');
    assert.equal(await page.locator('.source-grid a').count(),6);
    for(const viewport of [{width:1280,height:720},{width:1440,height:900},{width:664,height:853},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      await page.keyboard.press('End');
      await page.waitForFunction(()=>currentScene.id==='sources'&&!travelState);
      await page.waitForTimeout(250);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(viewport.width>980) assert.equal(await page.locator('#sources').evaluate(n=>n.offsetHeight),viewport.height);
      const area=await page.locator('.closing-machines').boundingBox();
      const img=page.locator('.closing-machines>img').first();
      assert(await img.evaluate(n=>n.complete&&n.naturalWidth===1086));
      assert.equal(await img.evaluate(n=>getComputedStyle(n).objectFit),'contain');
      const box=await img.boundingBox();
      assert(box.x>=area.x-1&&box.x+box.width<=area.x+area.width+1);
      assert(box.y>=area.y-1&&box.y+box.height<=area.y+area.height+1);
      await page.locator('#sources').screenshot({path:path.join(output,viewport.width+'-sources.png')});
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: transparent edges, complete bird, preserved cover/logo/links, four responsive layouts, no resource errors');
    console.log('SCREENSHOTS '+output);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
