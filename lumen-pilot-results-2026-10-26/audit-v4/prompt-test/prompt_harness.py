"""One no-training A/B; exact raw plus actual generation metadata, no answer repair."""
import argparse
import hashlib
import importlib.metadata as md
import json
import time
from common import ROOT, MODEL, SYSTEM, messages, read_jsonl, sha, verify_model, require_managed, dump_json

def text_sha(text):return hashlib.sha256(text.encode()).hexdigest()
def system(arm):return SYSTEM if arm=='baseline' else (ROOT/'revised-system.txt').read_text().strip()
def source():return (ROOT/'source-handbook.txt').read_text().split('ДЛЯ АВТОРА ЭКСПЕРИМЕНТА')[0]
def prompt_for(tokenizer,item,arm):
    msg=messages(item);msg[0]['content']=system(arm)
    msg[-1]['content']='Справочник для ответа:\n'+source()+'\nВопрос:\n'+msg[-1]['content']
    return tokenizer.apply_chat_template(msg,tokenize=False,add_generation_prompt=True,enable_thinking=False)

def main():
    require_managed()
    parser=argparse.ArgumentParser();parser.add_argument('--arm',choices=['baseline','revised'],default='baseline')
    parser.add_argument('--out');parser.add_argument('--probe',action='store_true');parser.add_argument('--preflight',action='store_true')
    args=parser.parse_args()
    fingerprint=verify_model()
    assert fingerprint=='7194cb92967c90dbdc5b133371a5aa14d5fc90556c3d4dff887a650378c94094'
    from transformers import AutoTokenizer
    token=AutoTokenizer.from_pretrained(str(MODEL),local_files_only=True,trust_remote_code=False)
    def tokens(prompt):
        bos=token.bos_token
        return token.encode(prompt,add_special_tokens=bos is None or not prompt.startswith(bos))
    tests=read_jsonl(ROOT/'seeds/test.jsonl');assert len(tests)==60
    if args.preflight:
        import subprocess,shutil
        value=lambda k:subprocess.check_output(['/usr/sbin/sysctl','-n',k],text=True).strip()
        assert int(value('kern.memorystatus_vm_pressure_level'))==1
        assert shutil.disk_usage(ROOT).free>=12*2**30
        rows=[{'arm':arm,'id':t['id'],'tokens':len(tokens(prompt_for(token,t,arm))),'sha256':text_sha(prompt_for(token,t,arm))} for arm in ['baseline','revised'] for t in tests]
        maximum=max(x['tokens'] for x in rows);config=json.loads((MODEL/'config.json').read_text())
        assert maximum+256<32768
        kv=2*config['num_hidden_layers']*config['num_key_value_heads']*config['head_dim']*((maximum+767)//256*256)*4
        logits=min(maximum,2048)*config['vocab_size']*4
        assert (MODEL/'model.safetensors').stat().st_size+kv+logits<5*2**30
        result={'pressure':int(value('kern.memorystatus_vm_pressure_level')),'swap':value('vm.swapusage'),'cpu':value('machdep.cpu.brand_string'),
                'memory_bytes':int(value('hw.memsize')),'disk_free_bytes':shutil.disk_usage(ROOT).free,'model_fingerprint':fingerprint,
                'max_prompt_tokens':maximum,'max_total_tokens':maximum+256,'static_KV_fp32_bytes':kv,'static_logits_chunk_fp32_bytes':logits,
                'static_estimates_not_peak_measurement':True,'gate':'probe required before exam','prompts':rows}
        dump_json(ROOT/'preflight.json',result)
        print(json.dumps({k:v for k,v in result.items() if k!='prompts'},ensure_ascii=False));return
    frozen=json.loads((ROOT/'freeze.json').read_text())
    assert all(sha(ROOT/n)==v for n,v in frozen['files'].items())
    import mlx.core as mx
    from mlx_lm import load,stream_generate
    from mlx_lm.sample_utils import make_sampler
    mx.set_default_device(mx.gpu)
    model,tokenizer=load(str(MODEL),trust_remote_code=False)
    if args.probe:
        maximum=json.loads((ROOT/'preflight.json').read_text())['max_prompt_tokens']
        item={'question':'Контроль ресурсов. Сообщи, есть ли в справочнике сведения о курсе испанского языка.','fields':{'available':'boolean'}}
        prompt=prompt_for(tokenizer,item,'revised')
        while len(tokens(prompt))<maximum+16:
            item['question']+=' Проверка.';prompt=prompt_for(tokenizer,item,'revised')
        mx.random.seed(42);parts=[];last=None
        for response in stream_generate(model,tokenizer,prompt,max_tokens=256,sampler=make_sampler(temp=0.0)):
            parts.append(response.text);last=response
        assert last is not None
        dump_json(ROOT/'runs/probe.json',{'not_exam':True,'prompt_tokens':len(tokens(prompt)),'max_exam_prompt':maximum,
                  'generation_tokens':last.generation_tokens,'finish_reason':last.finish_reason,'raw':''.join(parts)})
        print('Capacity probe completed, prompt length',len(tokens(prompt)));return
    assert args.out
    target=ROOT/args.out;assert not target.exists()
    meta={'arm':args.arm,'model_fingerprint':fingerprint,'weight_sha256':sha(MODEL/'model.safetensors'),
          'system_sha256':text_sha(system(args.arm)),'exam_sha256':sha(ROOT/'seeds/test.jsonl'),
          'source_sha256':sha(ROOT/'source-handbook.txt'),'injected_source_sha256':text_sha(source()),'adapter':None,'closed_book':False,
          'versions':{p:md.version(p) for p in ['mlx','mlx-lm','transformers','huggingface_hub']},
          'decoding':{'temperature':0,'max_tokens':256,'enable_thinking':False,'seed':42},'raw_postprocessing':'none'}
    target.parent.mkdir(parents=True,exist_ok=True)
    with target.open('x') as output:
        output.write(json.dumps({'meta':meta},ensure_ascii=False)+'\n');output.flush()
        for i,item in enumerate(tests,1):
            prompt=prompt_for(tokenizer,item,args.arm);mx.random.seed(42);start=time.perf_counter();parts=[];last=None
            for response in stream_generate(model,tokenizer,prompt,max_tokens=256,sampler=make_sampler(temp=0.0)):
                parts.append(response.text);last=response
            assert last is not None
            row={'id':item['id'],'question':item['question'],'raw':''.join(parts),'seconds':time.perf_counter()-start,
                 'prompt_tokens':last.prompt_tokens,'generation_tokens':last.generation_tokens,'finish_reason':last.finish_reason,
                 'prompt_sha256':text_sha(prompt),'mlx_peak_decimal_GB':mx.get_peak_memory()/1e9}
            output.write(json.dumps(row,ensure_ascii=False)+'\n');output.flush()
            print(f'{args.arm} {i}/60 {item["id"]}: {row["seconds"]:.2f}s, {row["generation_tokens"]} tokens, {row["finish_reason"]}',flush=True)

if __name__=='__main__':main()
