"""Single local model, 3 interleaved arms, one output per frozen prompt.
No training, network, tools, answer repair, retries, or gold answers in runtime.
"""
import argparse,gc,hashlib,importlib.metadata as md,json,shutil,subprocess,time
from common import ROOT,MODEL,require_managed,verify_model,sha,dump_json,read_jsonl
ARMS=['closed','oracle','retrieved']
OUT=384

def pressure():return int(subprocess.check_output(['/usr/sbin/sysctl','-n','kern.memorystatus_vm_pressure_level'],text=True))
def main():
 require_managed();parser=argparse.ArgumentParser();parser.add_argument('--preflight',action='store_true');parser.add_argument('--probe',action='store_true');args=parser.parse_args()
 assert pressure()==1,'Host pressure must be normal before any inference or tokenizer preflight'
 fingerprint=verify_model();assert fingerprint=='7194cb92967c90dbdc5b133371a5aa14d5fc90556c3d4dff887a650378c94094'
 rows=read_jsonl(ROOT/'inputs/prompts.jsonl');assert len(rows)==180
 from transformers import AutoTokenizer
 token=AutoTokenizer.from_pretrained(str(MODEL),local_files_only=True,trust_remote_code=False)
 nt=lambda s:len(token.encode(s,add_special_tokens=False))
 assert all(hashlib.sha256(r['prompt'].encode()).hexdigest()==r['sha256'] and nt(r['prompt'])==r['tokens'] for r in rows)
 maximum=max(r['tokens'] for r in rows);assert maximum<=1400
 if args.preflight:
   assert shutil.disk_usage(ROOT).free>=12*2**30
   result={'pressure':pressure(),'memory_bytes':int(subprocess.check_output(['/usr/sbin/sysctl','-n','hw.memsize'],text=True)),'free_disk_bytes':shutil.disk_usage(ROOT).free,'model_fingerprint':fingerprint,'maximum_input_tokens':maximum,'maximum_total_tokens':maximum+OUT,'input_cap':1400,'max_output_tokens':OUT,'prefill_step_size':128,'kv_bits':4,'kv_group_size':64,'quantized_kv_start':0,'batch_size':1,'context_fits_official_32768':maximum+OUT<32768,'prompts':[{k:r[k] for k in ['id','arm','sha256','tokens']} for r in rows],'gate':'padded full-capacity probe still required; static checks alone do not establish peak memory'}
   dump_json(ROOT/'preflight.json',result);print(json.dumps({k:v for k,v in result.items() if k!='prompts'},ensure_ascii=False));return
 frozen=json.loads((ROOT/'freeze.json').read_text());assert all(sha(ROOT/name)==want for name,want in frozen['files'].items())
 import mlx.core as mx
 from mlx_lm import load,stream_generate
 from mlx_lm.sample_utils import make_sampler
 mx.set_default_device(mx.gpu)
 mx.set_cache_limit(32*1024**2)
 # An allocator memory limit is an additional bound; the external guard remains
 # authoritative for process footprint, host pressure and swap growth.
 mx.set_memory_limit(int(2.75*2**30))
 model,tokenizer=load(str(MODEL),trust_remote_code=False)
 settings={'temperature':0,'seed_per_prompt':42,'enable_thinking':False,'max_output_tokens':OUT,'prefill_step_size':128,'kv_bits':4,'kv_group_size':64,'quantized_kv_start':0,'allocator_cache_bytes':32*1024**2,'allocator_memory_limit_bytes':int(2.75*2**30)}
 def generate(prompt,max_tokens):
   mx.random.seed(42);parts=[];last=None;start=time.perf_counter()
   for r in stream_generate(model,tokenizer,prompt,max_tokens=max_tokens,sampler=make_sampler(temp=0.0),prefill_step_size=128,kv_bits=4,kv_group_size=64,quantized_kv_start=0):parts.append(r.text);last=r
   assert last is not None
   result={'raw':''.join(parts),'seconds':time.perf_counter()-start,'prompt_tokens':last.prompt_tokens,'generation_tokens':last.generation_tokens,'finish_reason':last.finish_reason,'mlx_cumulative_peak_bytes':mx.get_peak_memory()}
   del last;gc.collect();mx.clear_cache();return result
 if args.probe:
   synthetic=token.apply_chat_template([{'role':'system','content':'Capacity probe; respond briefly with JSON.'},{'role':'user','content':'Read these neutral tokens and return {"ok":true}. '+' capacity'*(maximum+OUT)}],tokenize=False,add_generation_prompt=True,enable_thinking=False)
   assert nt(synthetic)>=maximum+OUT
   result=generate(synthetic,16)
   result.update(not_exam=True,target_total_tokens=maximum+OUT,settings=settings)
   dump_json(ROOT/'runs/probe.json',result);print('Full-capacity probe completed:',result['prompt_tokens'],'prompt tokens;',result['seconds'],'seconds');return
 guard=json.loads((ROOT/'runs/resources/probe.json').read_text());assert guard['status']=='completed' and guard['guard_exit_code']==0
 assert pressure()==1
 maps={(r['id'],r['arm']):r for r in rows};ids=list(dict.fromkeys(r['id'] for r in rows));assert len(ids)==60
 handles={}
 meta={'model_fingerprint':fingerprint,'model_weight_sha256':sha(MODEL/'model.safetensors'),'settings':settings,'prompts_sha256':sha(ROOT/'inputs/prompts.jsonl'),'freeze_sha256':sha(ROOT/'freeze.json'),'versions':{p:md.version(p) for p in ['mlx','mlx-lm','transformers','huggingface_hub']},'raw_postprocessing':'none','order':'per question Latin rotation of arms closed/oracle/retrieved','training':False,'gold_available_to_harness':False}
 try:
   for arm in ARMS:
     target=ROOT/'runs'/f'{arm}.jsonl';target.parent.mkdir(exist_ok=True)
     handles[arm]=target.open('x');handles[arm].write(json.dumps({'meta':{**meta,'arm':arm}},ensure_ascii=False)+'\n');handles[arm].flush()
   sequence=0
   for i,id in enumerate(ids):
     order=ARMS[i%3:]+ARMS[:i%3]
     for arm in order:
       r=maps[id,arm];sequence+=1
       result=generate(r['prompt'],OUT);result.update(id=id,arm=arm,sequence=sequence,prompt_sha256=r['sha256'])
       handles[arm].write(json.dumps(result,ensure_ascii=False)+'\n');handles[arm].flush()
       print(f'{sequence}/180 {id} {arm}: {result["seconds"]:.2f}s, out={result["generation_tokens"]}, finish={result["finish_reason"]}',flush=True)
   dump_json(ROOT/'runs/completion.json',{'completed':True,'questions':60,'arms':ARMS,'answers':sequence})
 finally:
   for f in handles.values():f.close()
if __name__=='__main__':main()
