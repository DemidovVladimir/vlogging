// Lightweight offline DOM-state checks. No claim of browser rendering QA.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),D=JSON.parse(fs.readFileSync(path.join(root,'report-data.json'),'utf8')),els=new Map();
class E{constructor(id){this.id=id;this.value=id==='protocol'?'all':'';this.checked=false;this.listeners={};this.textContent=id==='reportData'?JSON.stringify(D):'';this._html='';}set innerHTML(x){this._html=x;if(this.id==='questionSelect'){this.options=[...x.matchAll(/<option value="([^"]*)"/g)].map(x=>x[1]);this.value=this.options[0]||'';}}get innerHTML(){return this._html;}addEventListener(e,f){this.listeners[e]=f;}scrollIntoView(){}}
const get=id=>{if(!els.has(id))els.set(id,new E(id));return els.get(id);};
const doc={getElementById:get,addEventListener:(e,f)=>{doc[e]=f;}};
const location={href:'file://'+path.join(root,'report.html'),hash:''};
vm.runInNewContext(fs.readFileSync(path.join(root,'tools/report.js'),'utf8'),{document:doc,location,URL,history:{replaceState:(_,__,url)=>{location.href=url;location.hash=new URL(url).hash;}},matchMedia:()=>({matches:false})});
let passed=0;
assert.equal(get('questionSelect').options.length,60);passed++;
assert.equal((get('summaryRows').innerHTML.match(/<tr/g)||[]).length,2);passed++;
assert.equal((get('questionDetail').innerHTML.match(/class="answer-card"/g)||[]).length,2);passed++;
assert.equal((get('categoryRows').innerHTML.match(/<tr/g)||[]).length,4);passed++;
get('protocol').value='kamino';get('protocol').listeners.change();assert.equal(get('questionSelect').options.length,23);passed++;
get('errorsOnly').checked=true;get('errorsOnly').listeners.change();assert.equal(get('questionSelect').options.length,D.questions.filter(q=>q.protocol==='kamino'&&!q.modes.larger.grade.content_correct).length);passed++;
get('search').value='NO-SUCH-QUESTION';get('search').listeners.input();assert.equal(get('questionSelect').options.length,0);assert.match(get('questionDetail').innerHTML,/Нет вопросов/);passed++;
doc.click({target:{closest:()=>({dataset:{question:'eth-09'}})}});assert.equal(get('questionSelect').value,'eth-09');assert.equal(get('errorsOnly').checked,false);assert.equal(get('protocol').value,'all');passed++;
assert.match(get('questionDetail').innerHTML,/previewDeposit/);passed++;
assert.ok(!get('heroMetrics').innerHTML.includes('undefined'));assert.ok(!get('resourceCards').innerHTML.includes('NaN'));passed++;
assert.match(get('cleanupResult').innerHTML,/Cleanup завершён/);passed++;
process.stdout.write(JSON.stringify({passed,browser_rendering_tested:false}));
