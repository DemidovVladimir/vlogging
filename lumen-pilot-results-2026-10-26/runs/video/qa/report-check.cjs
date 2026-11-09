const {chromium}=require('/Users/vladimirdemidov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
let context;const result={status:'PASS',url:'http://127.0.0.1:8463/runs/report.html',checks:[],errors:[],requests:[]};
(async()=>{
 context=await chromium.launchPersistentContext(path.join(__dirname,'profile'),{executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true,viewport:{width:1280,height:720},env:{...process.env,TMPDIR:path.join(__dirname,'tmp')},args:['--disable-background-networking','--disable-component-update','--disable-sync']});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('requestfailed',r=>result.requests.push(r.url()));page.on('response',r=>{if(r.status()>=400)result.requests.push(r.status()+' '+r.url());});
 await page.goto(result.url,{waitUntil:'networkidle'});assert.equal(await page.locator('#score-before').innerText(),'0/8');assert.equal(await page.locator('#score-after').innerText(),'0/8');assert.equal(await page.locator('#score-openbook').innerText(),'3/8');
 await page.screenshot({path:path.resolve(__dirname,'../..','report-preview.jpg'),type:'jpeg',quality:92});
 result.checks.push('1280x720 hero screenshot; actual scores0/8,0/8,3/8');
 assert.equal(await page.locator('#questions button').count(),8);
 const questions=[];
 for(let i=0;i<8;i++){
  const b=page.locator('#questions button').nth(i);await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#questions button[aria-pressed=true]').count(),1);
  const q=await page.locator('#question').innerText();assert.ok(q.length>10);assert.ok(!questions.includes(q));questions.push(q);
  assert.equal(await page.locator('#answers article').count(),3);assert.equal(await page.locator('#answers pre').count(),3);assert.equal(await page.locator('#answers .why').count(),3);
  for(const note of await page.locator('#answers .why').allInnerTexts())assert.ok(note.length>20);
 }
 result.checks.push('All8question buttons switch unique question, expected answer,3rawoutputs and3review notes');
 for(const size of [{width:1280,height:720},{width:390,height:844}]){
  await page.setViewportSize(size);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  for(let i=0;i<8;i++){await page.locator('#questions button').nth(i).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 }
 result.checks.push('No document horizontal overflow at1280or390 foranyof8questions');
 const count=await page.locator('details').count();for(let i=0;i<count;i++){await page.locator('details').nth(i).locator('summary').click();assert.ok(await page.locator('details').nth(i).getAttribute('open')!==null);}
 result.checks.push('All'+count+'details explanations open');
 if(result.errors.length||result.requests.length)result.status='FAIL';
})().catch(e=>{result.status='FAIL';result.exception=e.stack;process.exitCode=1;}).finally(async()=>{if(context)await context.close();await fs.writeFile(path.resolve(__dirname,'../..','report-browser-test.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));});
