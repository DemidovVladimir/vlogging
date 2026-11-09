"""Same v6 questions, instructions and evidence. Only native chat template changes."""
import hashlib,json
from common import ROOT,MODEL,require_managed,dump_json,read_jsonl,sha
from formatting_baseline import prompt_for,SYSTEM
def main():
 require_managed()
 from transformers import AutoTokenizer
 token=AutoTokenizer.from_pretrained(str(MODEL),local_files_only=True,trust_remote_code=False)
 nt=lambda p:len(token.encode(p,add_special_tokens=False))
 ctx=read_jsonl(ROOT/'inputs/baseline-contexts.jsonl')
 bp={r['id']:r for r in read_jsonl(ROOT/'inputs/baseline-prompts.jsonl')};assert len(ctx)==len(bp)==60
 original_template=token.chat_template
 token.chat_template='{%- set enable_thinking = false -%}\n'+(ROOT/'provenance/baseline-original-chat-template.jinja').read_text()
 # Same tokenizer vocabulary. Reconstruct every OLD prompt exactly first.
 for c in ctx:
   p=prompt_for(token,c,c['context']);old=bp[c['id']]
   assert p==old['prompt'] and nt(p)==old['tokens'],c['id']
 token.chat_template=original_template
 contexts=[];prompts=[];message_hashes=[]
 class RecordingTokenizer:
   def apply_chat_template(self,messages,**kwargs):return json.dumps(messages,ensure_ascii=False,separators=(',',':'))
 for c in ctx:
   p=prompt_for(token,c,c['context']);s=hashlib.sha256(p.encode()).hexdigest();n=nt(p);assert n<=1400
   rr={**c,'arm':'larger','prompt_sha256':s,'prompt_tokens':n,'baseline_context_text_unchanged':True}
   contexts.append(rr);prompts.append({'id':c['id'],'arm':'larger','prompt':p,'sha256':s,'tokens':n})
   message_hashes.append({'id':c['id'],'messages_sha256':hashlib.sha256(prompt_for(RecordingTokenizer(),c,c['context']).encode()).hexdigest()})
 for name,rr in [('contexts.jsonl',contexts),('prompts.jsonl',prompts)]:
   with (ROOT/'inputs'/name).open('x') as f:
     for r in rr:f.write(json.dumps(r,ensure_ascii=False)+'\n')
 dump_json(ROOT/'inputs/summary.json',{'questions':60,'answers':60,'input_cap':1400,'max_input_tokens':max(r['tokens'] for r in prompts),'baseline_contexts_sha256':sha(ROOT/'inputs/baseline-contexts.jsonl'),'prompts_sha256':sha(ROOT/'inputs/prompts.jsonl'),'contexts_sha256':sha(ROOT/'inputs/contexts.jsonl'),'system_sha256':hashlib.sha256(SYSTEM.encode()).hexdigest(),'all60_baseline_prompts_reconstructed_exactly':True,'same_system_user_messages_and_catalogue':True,'retrieval_rerun':False,'native_chat_template_changed_for_new_checkpoint':True,'reads_gold':False,'message_hashes':message_hashes})
 print(json.dumps({k:v for k,v in json.loads((ROOT/'inputs/summary.json').read_text()).items() if k!='message_hashes'},ensure_ascii=False,indent=2),flush=True)
if __name__=='__main__':main()
