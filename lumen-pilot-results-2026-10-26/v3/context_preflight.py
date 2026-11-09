"""Token and resource checks before loading any language-model weights."""
import datetime
import json
import math
import shutil
import subprocess
from common import ROOT, MODEL, messages, read_jsonl, require_managed, sha, verify_model, dump_json

def value(key):
    return subprocess.check_output(['/usr/sbin/sysctl', '-n', key], text=True).strip()

def main():
    require_managed()
    assert int(value('kern.memorystatus_vm_pressure_level')) == 1
    assert shutil.disk_usage(ROOT).free >= 12 * 2**30
    fingerprint = verify_model()
    from transformers import AutoTokenizer
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL), local_files_only=True, trust_remote_code=False)
    source = (ROOT/'source-handbook.txt').read_text().split('ДЛЯ АВТОРА ЭКСПЕРИМЕНТА')[0]
    prompts = []
    for item in read_jsonl(ROOT/'seeds/test.jsonl'):
        msg = messages(item)
        msg[-1]['content'] = 'Справочник для ответа:\n'+source+'\nВопрос:\n'+msg[-1]['content']
        prompt = tokenizer.apply_chat_template(msg, tokenize=False, add_generation_prompt=True, enable_thinking=False)
        bos = tokenizer.bos_token
        tokens = tokenizer.encode(prompt, add_special_tokens=bos is None or not prompt.startswith(bos))
        prompts.append({'id':item['id'], 'tokens':len(tokens), 'sha256':__import__('hashlib').sha256(prompt.encode()).hexdigest()})
    config = json.loads((MODEL/'config.json').read_text())
    maximum = max(x['tokens'] for x in prompts)
    total = maximum + 256
    allocated_tokens = (math.ceil(total/256)+1)*256
    kv = 2*config['num_hidden_layers']*config['num_key_value_heads']*config['head_dim']*allocated_tokens*4
    logits = min(maximum,2048)*config['vocab_size']*4
    assert total < config['max_position_embeddings']
    assert (MODEL/'model.safetensors').stat().st_size + kv + logits < 5 * 2**30
    row = {'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
           'cpu':value('machdep.cpu.brand_string'), 'cpu_cores':int(value('hw.logicalcpu')),
           'unified_memory_bytes':int(value('hw.memsize')), 'pressure':int(value('kern.memorystatus_vm_pressure_level')),
           'host_swap':value('vm.swapusage'), 'disk_free_bytes':shutil.disk_usage(ROOT).free,
           'model_fingerprint':fingerprint, 'exam_sha256':sha(ROOT/'seeds/test.jsonl'),
           'source_file_sha256':sha(ROOT/'source-handbook.txt'),
           'injected_source_sha256':__import__('hashlib').sha256(source.encode()).hexdigest(),
           'injected_source_characters':len(source), 'max_prompt_tokens':maximum,
           'max_total_tokens':total, 'model_context_limit':config['max_position_embeddings'],
           'static_estimates_not_peak_measurements':{'conservative_fp32_KV_bytes':kv,
              'single_fp32_logits_prefill_chunk_bytes':logits,
              'note':'Runtime, attention workspaces and allocator overhead are additional. Guarded inference probe required before exam.'},
           'prompts':prompts, 'gate':'static_pass; resource_probe_required'}
    dump_json(ROOT/'preflight.json',row)
    print(json.dumps({k:v for k,v in row.items() if k!='prompts'},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
