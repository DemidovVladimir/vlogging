// State checks for offline controls. This does not claim browser/visual QA.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),D=JSON.parse(fs.readFileSync(path.join(root,'report-data.json'),'utf8'));
const elements=new Map();
class E{
 constructor(id){this.id=id;this.value=id==='protocol'?'all':'';this.checked=false;this.listeners={};this._html='';this.textContent=id==='reportData'?JSON.stringify(D):'';}
 set innerHTML(x){this._html=x;if(this.id==='questionSelect'){this.options=[...x.matchAll(/<option value="([^"]*)"/g)].map(m=>m[1]);this.value=this.options[0]||'';}}
 get innerHTML(){return this._html;}
 addEventListener(event,fn){this.listeners[event]=fn;}
 scrollIntoView(){}
}
const get=id=>{if(!elements.has(id))elements.set(id,new E(id));return elements.get(id);};
const doc={getElementById:get,addEventListener:(event,fn)=>{doc[event]=fn;}};
const loc={href:'file://'+path.join(root,'report.html'),hash:''};
const ctx={document:doc,location:loc,history:{replaceState:(_,__,url)=>{loc.href=url;loc.hash=new URL(url).hash;}},URL,matchMedia:()=>({matches:false})};
vm.runInNewContext(fs.readFileSync(path.join(root,'tools/report.js'),'utf8'),ctx);
let tests=0;
assert.equal(get('questionSelect').options.length,60);tests++;
assert.match(get('heroMetrics').innerHTML,new RegExp(String(D.summary.selection.fully_grounded_known)));tests++;
assert.equal((get('ablationRows').innerHTML.match(/<tr/g)||[]).length,5);tests++;
assert.equal((get('questionDetail').innerHTML.match(/class="answer-card"/g)||[]).length,7);tests++;
get('protocol').value='kamino';get('protocol').listeners.change();
assert.equal(get('questionSelect').options.length,D.questions.filter(q=>q.protocol==='kamino').length);tests++;
get('errorsOnly').checked=true;get('errorsOnly').listeners.change();
assert.equal(get('questionSelect').options.length,D.questions.filter(q=>q.protocol==='kamino'&&!q.modes.selection.grade.content_correct).length);tests++;
get('search').value='NO-SUCH-QUESTION';get('search').listeners.input();assert.equal(get('questionSelect').options.length,0);assert.match(get('questionDetail').innerHTML,/Нет вопросов/);tests++;
doc.click({target:{closest:()=>({dataset:{question:'eth-09'}})}});
assert.equal(get('questionSelect').value,'eth-09');assert.equal(get('protocol').value,'all');assert.equal(get('errorsOnly').checked,false);tests++;
assert.match(get('questionDetail').innerHTML,/previewDeposit/);tests++;
assert.match(get('cleanupResult').innerHTML,/Cleanup завершён/);tests++;
assert.ok(!get('heroMetrics').innerHTML.includes('undefined'));tests++;
assert.ok(!get('resourceCards').innerHTML.includes('NaN'));tests++;
process.stdout.write(JSON.stringify({passed:tests,rendering_tested:false}));
