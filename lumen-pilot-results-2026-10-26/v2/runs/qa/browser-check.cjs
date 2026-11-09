// Run only after parent confirms model compute is finished.
const {chromium}=require('/Users/vladimirdemidov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const QA=__dirname,RUNS=path.resolve(QA,'..'),ROOT=path.resolve(RUNS,'..'),V1=path.resolve(ROOT,'../..');
const result={status:'PASS',checks:[],errors:[],requests:[],overflow:[],sizes:[]};
const types={'.html':'text/html; charset=utf-8','.json':'application/json','.jsonl':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(V1,'.'+pathname);if(!file.startsWith(V1+path.sep))throw Error('outside');const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
let context;
(async()=>{
 await fs.mkdir(path.join(QA,'tmp'),{recursive:true});await new Promise(resolve=>server.listen(8781,'127.0.0.1',resolve));
 context=await chromium.launchPersistentContext(path.join(QA,'profile'),{executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true,viewport:{width:1280,height:720},env:{...process.env,TMPDIR:path.join(QA,'tmp')},args:['--disable-background-networking','--disable-component-update','--disable-sync']});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('requestfailed',r=>result.requests.push(r.url()+': '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)result.requests.push(r.status()+' '+r.url());});
 const url='http://127.0.0.1:8781/experiments/lumen-local-data-v2/runs/report.html';result.url=url;
 await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const data=await page.evaluate(()=>D);assert.equal(data.total,60);assert.ok(data.freeze_check.passed);
 assert.equal(await page.locator('#scores .score').count(),5);assert.equal(await page.locator('#questionSelect option').count(),60);
 for(const k of ['base','v1','clean200','expanded200','expanded800']){assert.equal(data.arms[k].status,'complete');assert.equal(Object.keys(data.arms[k].rows).length,60);assert.equal(await page.locator('#scores [data-arm='+k+'] strong').textContent(),data.arms[k].semantic+'/60');}
 assert.equal(data.status,'complete');assert.equal(await page.locator('#metric').inputValue(),'semantic');assert.equal(await page.locator('#recallFull').textContent(),'19 / 30');assert.equal(await page.locator('#freshAtomic').textContent(),'4 / 30');
 assert.ok((await page.locator('#recall .outcome').textContent()).includes('Исходную базу на этих точных вопросах не проверяли'));
 result.checks.push('Semanticdefault, recall19/30separatefromfresh4/30; five complete arms on the same frozen60, scorecards equal evidence');
 const ids=data.tests.map(t=>t.id);
 for(const id of ids){await page.selectOption('#questionSelect',id);assert.ok((await page.locator('#questionText').textContent()).startsWith(id+' · '));assert.equal(await page.locator('#rawAnswers .raw-card').count(),5);for(const k of ['base','v1','clean200','expanded200','expanded800']){assert.equal(await page.locator('#rawAnswers [data-arm='+k+'] pre').textContent(),data.arms[k].rows[id].raw);}}
 result.checks.push('All60 questions expose exact unchanged raw strings for all5arms (300responses)');
 for(const [cat,n] of [['atomic',30],['composition',24],['unknown',6]]){await page.selectOption('#category',cat);assert.equal(await page.locator('#questionSelect option').count(),n);}
 await page.selectOption('#category','all');await page.fill('#query','v2-a01');assert.equal(await page.locator('#questionSelect option').count(),1);assert.ok((await page.locator('#expected').textContent()).includes('SYSTEM'));await page.fill('#query','NO_MATCH_9feeba');assert.equal(await page.locator('#questionSelect option').count(),0);assert.ok(await page.locator('#previous').isDisabled());assert.ok(await page.locator('#next').isDisabled());await page.fill('#query','');
 result.checks.push('30/24/6category filters; search/empty state; a01context caveat visible');
 await page.selectOption('#metric','semantic');for(const k of ['base','v1','clean200','expanded200','expanded800'])assert.equal(await page.locator('#scores [data-arm='+k+'] strong').textContent(),data.arms[k].semantic+'/60');
 for(const pair of data.paired){for(const metric of ['strict','semantic']){const v=pair[metric];assert.ok(v);assert.equal(v.gain+v.loss+v.both+v.neither,60);assert.equal(v.net,v.gain-v.loss);assert.equal(v.net,data.arms[pair.right][metric]-data.arms[pair.left][metric]);}}
 result.checks.push('Semantic toggle, paired gains/losses sum60 and equal score differences');await page.selectOption('#metric','strict');
 const selectors=['top','comparison','recall','data','answers','resources','cleanup','limits'];
 for(const size of[{width:1920,height:1080},{width:1280,height:720},{width:1440,height:900},{width:390,height:844}]){await page.setViewportSize(size);await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);const over=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));if(over.scroll>over.width+1)result.overflow.push({size,...over});await page.screenshot({path:path.join(QA,'hero-'+size.width+'x'+size.height+'.png')});if(size.width===1280)await page.screenshot({path:path.join(RUNS,'report-preview.jpg'),type:'jpeg',quality:92});if([1280,390].includes(size.width))for(const id of selectors)await page.locator('#'+id).screenshot({path:path.join(QA,size.width+'-'+id+'.png')});result.sizes.push(size);}
 result.checks.push('Four responsive sizes; all eight report sections captured at1280and390');
 await page.setViewportSize({width:390,height:844});for(const cat of ['atomic','composition','unknown']){await page.selectOption('#category',cat);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 for(const name of ['../seeds-clean/train.jsonl','../seeds-clean/valid.jsonl','../seeds/train.jsonl','../seeds/valid.jsonl','../seeds/test.jsonl','../DATA-CHANGES.txt','../label-oracle-audit.json','../source-handbook.txt']){const href=new URL(name,url).href;const response=await context.request.get(href);assert.equal(response.status(),200,href);}
 assert.ok((await page.locator('#cleanupPrompt').textContent()).includes('10cc942d-fd1d-4042-b33b-404efa0196f9'));assert.ok((await page.locator('#cleanupPrompt').textContent()).includes('оркестратор'));
 result.checks.push('All8dataset/source downloads resolve; cleanup prompt has parentUUID and orchestrator guard');
 const details=await page.locator('details').count();for(let i=0;i<details;i++){await page.locator('details').nth(i).locator('summary').click();assert.notEqual(await page.locator('details').nth(i).getAttribute('open'),null);}
 result.checks.push('All'+details+'details open; no clipboard or cleanup executed');
 if(result.errors.length||result.requests.length||result.overflow.length)result.status='FAIL';
})().catch(e=>{result.status='FAIL';result.exception=e.stack;process.exitCode=1;}).finally(async()=>{if(context)await context.close();server.close();await fs.writeFile(path.join(QA,'browser-report.json'),JSON.stringify(result,null,2));for(const name of ['profile','tmp'])await fs.rm(path.join(QA,name),{recursive:true,force:true});console.log(JSON.stringify(result,null,2));});
