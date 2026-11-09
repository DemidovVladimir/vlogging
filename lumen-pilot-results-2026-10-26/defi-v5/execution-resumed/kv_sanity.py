"""Non-exam runtime sanity A/B. No DeFi questions or retrieval tuning."""
import json,time,gc
from common import ROOT,MODEL,require_managed,verify_model,dump_json
def main():
 require_managed();verify_model()
 import mlx.core as mx
 from mlx_lm import load,stream_generate
 from mlx_lm.sample_utils import make_sampler
 mx.set_default_device(mx.gpu);mx.set_cache_limit(32*1024**2);mx.set_memory_limit(int(2.75*2**30))
 model,tokenizer=load(str(MODEL),trust_remote_code=False)
 controls=[('json','Верни только JSON с единственным полем ok и булевым значением true.',{'ok':True}),('arithmetic','Сколько будет 2+3? Верни только JSON с числовым полем result.',{'result':5}),('source','Факт для ответа: вымышленный флажок имеет цвет бирюзовый. Какой у него цвет? Только JSON с полем color.',{'color':'бирюзовый'})]
 results=[]
 for kv in [4,None]:
   for id,q,want in controls:
     messages=[{'role':'system','content':'Ответь на запрос кратко, только JSON.'},{'role':'user','content':q}]
     prompt=tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True,enable_thinking=False)
     mx.random.seed(42);parts=[];last=None;start=time.perf_counter()
     for last in stream_generate(model,tokenizer,prompt,max_tokens=96,sampler=make_sampler(temp=0.0),prefill_step_size=128,kv_bits=kv,kv_group_size=64,quantized_kv_start=0):parts.append(last.text)
     raw=''.join(parts)
     try:parsed=json.loads(raw.strip())
     except ValueError:parsed=None
     ok=parsed==want
     results.append({'control':id,'kv_bits':kv,'raw':raw,'parsed':parsed,'expected':want,'pass':ok,'prompt_tokens':last.prompt_tokens,'generation_tokens':last.generation_tokens,'finish_reason':last.finish_reason,'seconds':time.perf_counter()-start})
     print('SANITY',id,'KV',kv,'pass',ok,repr(raw[:160]),flush=True)
     del last;gc.collect();mx.clear_cache()
 dump_json(ROOT/'runs/kv-sanity.json',{'not_exam':True,'no_test_questions_read':True,'fixed':['same weights','same template','prefill128','cache32MiB','memorylimit2.75GiB','seed42','temp0','max96'],'change':'kv_bits4/start0 versus unquantized KV','results':results})
if __name__=='__main__':main()
