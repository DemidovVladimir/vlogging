"""Freeze question/context inputs. Oracle deliberately uses verified evidence,
whereas lexical search only receives the question and visible protocol label.
Never include gold data or agent explanations in any generated prompt.
"""
from pathlib import Path
import hashlib,json,sys,re
from retrieval import search
from formatting import prompt_for,SYSTEM
ROOT=Path(__file__).resolve().parents[1]
RUNTIME=ROOT.parent.parent/'lumen-local-defi-v5'
CAP=1400
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def textsha(t):return hashlib.sha256(t.encode()).hexdigest()
def lines(p):return [json.loads(s) for s in p.read_text().splitlines() if s.strip()]
def main():
 from transformers import AutoTokenizer
 token=AutoTokenizer.from_pretrained(str(RUNTIME/'models/qwen3-1.7b-4bit'),local_files_only=True,trust_remote_code=False)
 def nt(s):return len(token.encode(s,add_special_tokens=False))
 items=lines(ROOT/'exam/test.jsonl');assert len(items)==60
 docs={d['doc_id']:d for d in json.loads((ROOT/'sources/documents.json').read_text())}
 for d in docs.values():assert sha(ROOT/d['file'])==d['sha256']
 out=ROOT/'inputs';out.mkdir(exist_ok=False)
 contexts=[];prompts=[]
 for item in items:
   visible_protocol=item.get('related_protocol',item['protocol'])
   clean={'id':item['id'],'question':item['question'],'fields':item['fields'],'protocol':visible_protocol}
   retrieved=search(ROOT/'sources/search.sqlite',visible_protocol,item['question'],3)
   oracle=[]
   if item['gold']['status']=='known':
     for e in item['gold_evidence']:
       d=docs[e['doc_id']];text=(ROOT/d['file']).read_text();assert text[e['start_char']:e['end_char']]==e['quote']
       # Bounded literal surrounding source, not the expected answer or rationale.
       a=max(0,e['start_char']-180);b=min(len(text),e['end_char']+180)
       oracle.append({**d,'start_char':a,'end_char':b,'text':text[a:b],'chunk_id':'oracle-evidence'})
   else:
     for did in item.get('oracle_doc_ids',[])[:2]:
       d=docs[did];text=(ROOT/d['file']).read_text();b=min(650,len(text))
       oracle.append({**d,'start_char':0,'end_char':b,'text':text[:b],'chunk_id':'oracle-neutral-intro'})
   # Source anchors in the same paragraph can overlap. Merge their literal
   # windows to avoid repeating text and consuming the input budget twice.
   merged=[]
   for c in sorted(oracle,key=lambda c:(c['doc_id'],c['start_char'])):
     if merged and merged[-1]['doc_id']==c['doc_id'] and c['start_char']<=merged[-1]['end_char']:
       prev=merged[-1];prev['end_char']=max(prev['end_char'],c['end_char'])
       prev['text']=(ROOT/prev['file']).read_text()[prev['start_char']:prev['end_char']]
     else:merged.append(c)
   oracle=merged
   rag=[]
   for h in retrieved['hits']:
     d=docs[h['doc_id']]
     rag.append({**d,'start_char':int(h['start_char']),'end_char':int(h['end_char']),'text':h['body'],'chunk_id':h['id'],'bm25':h['score']})
   for arm,ctx in [('closed',[]),('oracle',oracle),('retrieved',rag)]:
     ctx=[{**c,'id':'R'+str(i)} for i,c in enumerate(ctx,1)]
     before=nt(prompt_for(token,clean,ctx));trims=[]
     # Trim only retrieved text, symmetrically by a preset length rule, before
     # looking at outcomes. Retain original offsets so lost evidence is measurable.
     while nt(prompt_for(token,clean,ctx))>CAP and arm=='retrieved' and ctx:
       largest=max(range(len(ctx)),key=lambda j:len(ctx[j]['text']))
       c=ctx[largest];cut=int(len(c['text'])*.85)
       if cut<180:
         trims.append({'id':c['id'],'action':'drop_last'});ctx.pop(largest)
         ctx=[{**x,'id':'R'+str(j)} for j,x in enumerate(ctx,1)];continue
       trims.append({'id':c['id'],'old_chars':len(c['text']),'new_chars':cut})
       c['text']=c['text'][:cut];c['end_char']=c['start_char']+cut
     p=prompt_for(token,clean,ctx);count=nt(p)
     if count>CAP:raise SystemExit(f'{item["id"]} {arm} exceeds {CAP}: {count}; revise source neighborhood size prospectively')
     row={**clean,'arm':arm,'context':ctx,'prompt_sha256':textsha(p),'prompt_tokens':count,'input_tokens_before_trim':before,'context_trims':trims}
     if arm=='retrieved':row['retrieval']=retrieved
     contexts.append(row);prompts.append({'id':item['id'],'arm':arm,'prompt':p,'sha256':textsha(p),'tokens':count})
 for name,rows in [('contexts.jsonl',contexts),('prompts.jsonl',prompts)]:
   with (out/name).open('x') as f:
     for r in rows:f.write(json.dumps(r,ensure_ascii=False)+'\n')
 summary={'questions':len(items),'arms':['closed','oracle','retrieved'],'prompts':len(prompts),'input_cap':CAP,'maximum_input_tokens':max(x['tokens'] for x in prompts),'trimmed_retrieved_questions':sum(bool(x['context_trims']) for x in contexts),'system_sha256':textsha(SYSTEM),'exam_sha256':sha(ROOT/'exam/test.jsonl'),'contexts_sha256':sha(out/'contexts.jsonl'),'prompts_sha256':sha(out/'prompts.jsonl'),'model_context_length':'well below official32768; custom cap1400','oracle_uses_gold_source_spans':True,'search_uses_gold':False,'unknown_oracle':'neutral document intros; no gold answer','raw_source_text_not_executed':True}
 (out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
