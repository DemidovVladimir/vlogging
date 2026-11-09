"""Source-in-context prefill probe padded beyond all exam prompt lengths; no exam answer generated."""
import json
from common import ROOT, MODEL, SYSTEM, require_managed, verify_model, dump_json

require_managed()
verify_model()
preflight=json.loads((ROOT/'preflight.json').read_text())
from mlx_lm import load, generate
from mlx_lm.sample_utils import make_sampler
import mlx.core as mx
mx.set_default_device(mx.gpu)
model,tokenizer=load(str(MODEL),trust_remote_code=False)
source=(ROOT/'source-handbook.txt').read_text().split('ДЛЯ АВТОРА ЭКСПЕРИМЕНТА')[0]
content='Справочник для ответа:\n'+source+'\nВопрос:\nЭто проверка ресурсов. Верни JSON с status unknown, кратким answer и пустым data.\n'
while True:
    prompt=tokenizer.apply_chat_template([{'role':'system','content':SYSTEM},{'role':'user','content':content}],tokenize=False,add_generation_prompt=True,enable_thinking=False)
    bos=tokenizer.bos_token
    count=len(tokenizer.encode(prompt,add_special_tokens=bos is None or not prompt.startswith(bos)))
    if count>=preflight['max_prompt_tokens']+16: break
    content+=' Проверка.'
mx.random.seed(42)
raw=generate(model,tokenizer,prompt=prompt,max_tokens=256,sampler=make_sampler(temp=0.0),verbose=False)
dump_json(ROOT/'runs/probe.json',{'not_exam':True,'purpose':'Capacity only, synthetic padded prompt; no scored answer',
          'prompt_tokens':count,'max_exam_prompt_tokens':preflight['max_prompt_tokens'],
          'output_limit':256,'raw':raw,'mlx_reported_peak_decimal_GB':mx.get_peak_memory()/1e9})
print('Padded prompt tokens',count,'exam maximum',preflight['max_prompt_tokens'])
print(raw)
