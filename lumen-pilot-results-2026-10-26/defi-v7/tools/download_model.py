"""One pinned public native non-thinking MLX4bit checkpoint. No patches/training."""
import json
from common import ROOT,MODEL,sha,require_managed,dump_json,verify_model
def main():
 require_managed()
 cfg=json.loads((ROOT/'config.json').read_text());repo=cfg['repo'];rev=cfg['revision']
 from huggingface_hub import HfApi,snapshot_download
 assert HfApi(token=False).model_info(repo,revision=rev).sha==rev
 snapshot_download(repo_id=repo,revision=rev,local_dir=str(MODEL),token=False,max_workers=4,
   allow_patterns=['*.json','*.safetensors','*.model','*.txt','*.jinja','*.tiktoken','*LICENSE*','README.md'])
 conf=json.loads((MODEL/'config.json').read_text());assert conf['model_type']=='qwen3' and conf['quantization']['bits']==4
 assert sha(MODEL/'model.safetensors')==cfg['weight_sha256']
 template=(MODEL/'chat_template.jinja').read_text();(ROOT/'provenance/original-chat-template.jinja').write_text(template)
 files={str(p.relative_to(MODEL)):sha(p) for p in sorted(MODEL.rglob('*')) if p.is_file() and '.cache' not in p.relative_to(MODEL).parts}
 dump_json(ROOT/'model-lock.json',{'repo':repo,'revision':rev,'formatting_patch':None,'native_non_thinking':True,'files':files})
 print('Pinned weights verified:',cfg['weight_sha256'],'lock:',verify_model(),flush=True)
if __name__=='__main__':main()
