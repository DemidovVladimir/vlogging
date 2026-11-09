"""Download one pinned public MLX checkpoint. No training and no uploads."""
import json
from pathlib import Path
from common import ROOT, MODEL, dump_json, sha, verify_model, require_managed

def main():
    require_managed()
    if (ROOT / 'model-lock.json').exists():
        verify_model()
        print('Existing local model verified. No download required.')
        return
    from huggingface_hub import HfApi, snapshot_download
    repo = 'mlx-community/Qwen3-1.7B-4bit'
    revision = '3b1b1768f8f8cf8351c712464f906e86c2b8269e'
    assert HfApi(token=False).model_info(repo, revision=revision).sha == revision
    print('Downloading', repo, 'revision', revision, flush=True)
    snapshot_download(repo_id=repo, revision=revision, local_dir=str(MODEL),
                      token=False, max_workers=4,
                      allow_patterns=['*.json', '*.safetensors', '*.model', '*.txt', '*.jinja',
                                      '*.tiktoken', '*LICENSE*', 'README.md'])
    config = json.loads((MODEL / 'config.json').read_text())
    quant = config.get('quantization', config.get('quantization_config', {}))
    if config.get('model_type') != 'qwen3' or quant.get('bits') != 4:
        raise SystemExit('Unexpected checkpoint architecture/quantization. Review before continuing.')
    tc_path = MODEL / 'tokenizer_config.json'
    tc = json.loads(tc_path.read_text())
    template_file = MODEL / 'chat_template.jinja'
    template = template_file.read_text() if template_file.exists() else tc.get('chat_template')
    if not isinstance(template, str):
        raise SystemExit('Expected one string chat template; review this checkpoint manually.')
    provenance = ROOT / 'provenance'
    provenance.mkdir(exist_ok=True)
    (provenance / 'original-chat-template.jinja').write_text(template)
    # Fix the same non-thinking formatting for MLX trainer and both evaluation arms.
    # This changes formatting only; the downloaded weight files are unchanged.
    prefix = '{%- set enable_thinking = false -%}\n'
    template = prefix + template
    tc['chat_template'] = template
    dump_json(tc_path, tc)
    template_file.write_text(template)
    files = {str(p.relative_to(MODEL)): sha(p) for p in sorted(MODEL.rglob('*'))
             if p.is_file() and '.cache' not in p.relative_to(MODEL).parts}
    dump_json(ROOT / 'model-lock.json', {'repo': repo, 'revision': revision,
              'formatting_patch': 'non-thinking Jinja default, same for train/before/after',
              'files': files})
    print('Saved model-lock.json. Base weights unchanged; non-thinking template fixed.')

if __name__ == '__main__':
    main()
