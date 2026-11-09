"""Closed-book generation: only question and requested field names reach the model."""
import argparse
import hashlib
import importlib.metadata as md
import json
import os
import time
from pathlib import Path
from common import ROOT, MODEL, SYSTEM, messages, read_jsonl, sha, verify_model, require_managed

def main():
    require_managed()
    parser = argparse.ArgumentParser()
    parser.add_argument('--adapter', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--question', help='One additional interactive question; does not alter the locked exam')
    args = parser.parse_args()
    if not args.question and not args.out:
        parser.error('--out is required for the exam')
    if args.out and args.out.exists():
        raise SystemExit('Refusing to overwrite existing results: ' + str(args.out))
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    fingerprint = verify_model()
    import mlx.core as mx
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler
    mx.set_default_device(mx.gpu)
    adapter = str(args.adapter.resolve()) if args.adapter else None
    model, tokenizer = load(str(MODEL), adapter_path=adapter, trust_remote_code=False)
    versions = {p: md.version(p) for p in ['mlx', 'mlx-lm', 'transformers']}
    meta = {'model_fingerprint': fingerprint, 'system_sha256': hashlib.sha256(SYSTEM.encode()).hexdigest(),
            'exam_sha256': sha(ROOT / 'seeds/test.jsonl'), 'versions': versions,
            'decoding': {'temperature': 0.0, 'max_tokens': 256, 'enable_thinking': False},
            'adapter': adapter, 'closed_book': True}
    if args.adapter:
        meta['adapter_sha256'] = sha(args.adapter / 'adapters.safetensors')
    items = ([{'id': 'extra', 'question': args.question, 'fields': {}}] if args.question
             else read_jsonl(ROOT / 'seeds/test.jsonl'))
    output = None
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        output = args.out.open('x')
        output.write(json.dumps({'meta': meta}, ensure_ascii=False) + '\n')
        output.flush()
    try:
        for number, item in enumerate(items, 1):
            # No gold answers, evidence IDs or handbook content are passed here.
            prompt = tokenizer.apply_chat_template(messages(item), tokenize=False,
                        add_generation_prompt=True, enable_thinking=False)
            mx.random.seed(42)
            start = time.perf_counter()
            raw = generate(model, tokenizer, prompt=prompt, max_tokens=256,
                           sampler=make_sampler(temp=0.0), verbose=False)
            elapsed = time.perf_counter() - start
            row = {'id': item['id'], 'question': item['question'], 'raw': raw,
                   'seconds': elapsed, 'process_peak_memory_GB': mx.get_peak_memory() / 1e9}
            if output:
                output.write(json.dumps(row, ensure_ascii=False) + '\n')
                output.flush()
            print(f'{number}/{len(items)} {item["id"]}: {elapsed:.2f}s', flush=True)
            print(raw, flush=True)
    finally:
        if output:
            output.close()

if __name__ == '__main__':
    main()
