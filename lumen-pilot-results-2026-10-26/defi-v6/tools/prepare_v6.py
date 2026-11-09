"""Prepare all inputs before inference. Reads visible questions only, not gold."""
from pathlib import Path
import hashlib,json
from common import ROOT,MODEL,require_managed,dump_json,sha,read_jsonl
from retrieval_v6 import build_index,search
from formatting_v6 import prompt_for as new_prompt,SYSTEM
from formatting_v5 import prompt_for as old_prompt
ARMS=['search_only','prompt_only','combined'];CAP=1400
def main():
 require_managed()
 from transformers import AutoTokenizer
 token=AutoTokenizer.from_pretrained(str(MODEL),local_files_only=True,trust_remote_code=False)
 nt=lambda t:len(token.encode(t,add_special_tokens=False))
 cfg=json.loads((ROOT/'config.json').read_text());source=Path(cfg['source_root'])
 index=build_index(source,ROOT/'search.sqlite');dump_json(ROOT/'index-info.json',index)
 items=read_jsonl(ROOT/'inputs/visible-questions.jsonl');assert len(items)==60
 oldctx={r['id']:r for r in read_jsonl(ROOT/'inputs/baseline-retrieved-contexts.jsonl')}
 contexts=[];prompts=[]
 for t in items:
   result=search(ROOT/'search.sqlite',t['protocol'],t['question'])
   newctx=[]
   for i,h in enumerate(result['hits']):
     newctx.append({**h,'id':'R'+str(i+1),'chunk_id':h['id'],'title':h['title']+' — '+h['section'],'text':h['body']})
   # Freeze the SAME delivered context for both new-search arms; fit the larger
   # of the two prompt wrappers. Prompt-only uses baseline text byte for byte.
   trims=[]
   while newctx and max(nt(old_prompt(token,t,newctx)),nt(new_prompt(token,t,newctx)))>CAP:
     j=max(range(len(newctx)),key=lambda j:len(newctx[j]['text']));c=newctx[j]
     cut=int(len(c['text'])*.9)
     if cut<180:
       trims.append({'source_id':c['id'],'action':'drop'});newctx.pop(j)
     else:
       trims.append({'source_id':c['id'],'from_chars':len(c['text']),'to_chars':cut})
       c['text']=c['text'][:cut];c['end_char']=int(c['start_char'])+cut
   for arm in ARMS:
     ctx=oldctx[t['id']]['context'] if arm=='prompt_only' else newctx
     formatter=old_prompt if arm=='search_only' else new_prompt
     p=formatter(token,t,ctx);n=nt(p)
     assert n<=CAP,(t['id'],arm,n)
     s=hashlib.sha256(p.encode()).hexdigest()
     contexts.append({**t,'arm':arm,'context':ctx,'prompt_sha256':s,'prompt_tokens':n,'retrieval':result if arm!='prompt_only' else {'baseline_unchanged':True},'context_trims':trims if arm!='prompt_only' else []})
     prompts.append({'id':t['id'],'arm':arm,'prompt':p,'sha256':s,'tokens':n})
 for name,rows in [('contexts.jsonl',contexts),('prompts.jsonl',prompts)]:
   with (ROOT/'inputs'/name).open('x') as f:
     for r in rows:f.write(json.dumps(r,ensure_ascii=False)+'\n')
 dump_json(ROOT/'inputs/summary.json',{'arms':ARMS,'questions':60,'answers':180,'max_input_tokens':max(p['tokens'] for p in prompts),'input_cap':CAP,'context_identical_search_only_combined':True,'prompt_only_baseline_context_unchanged':True,'model_context_cap_unchanged':True,'system_v6_sha256':hashlib.sha256(SYSTEM.encode()).hexdigest(),'prompts_sha256':sha(ROOT/'inputs/prompts.jsonl'),'contexts_sha256':sha(ROOT/'inputs/contexts.jsonl'),'reads_gold':False,'new_index':index})
 print((ROOT/'inputs/summary.json').read_text(),flush=True)
if __name__=='__main__':main()
