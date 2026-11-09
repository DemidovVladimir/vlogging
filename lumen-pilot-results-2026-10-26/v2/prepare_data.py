"""Validate fixed splits, then optionally verify actual tokenizer and loss-mask boundaries."""
import argparse
import hashlib
import json
import os
from common import ROOT, MODEL, SYSTEM, messages, read_jsonl, dump_json, sha, verify_model, require_managed

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-only', action='store_true', help='No MLX/Transformers imports or downloads')
    parser.add_argument('--seeds', default='seeds')
    parser.add_argument('--data-out', default='data')
    parser.add_argument('--lock-out', default='data-lock.json')
    args = parser.parse_args()
    rows = {s: read_jsonl(ROOT / args.seeds / (s + '.jsonl')) for s in ['train', 'valid', 'test']}
    seen = set()
    seen_ids = set()
    for split, items in rows.items():
        for item in items:
            q = item['question'].strip().casefold()
            if q in seen:
                raise SystemExit('Repeated question across or within splits: ' + q)
            seen.add(q)
            assert item['id'] not in seen_ids, 'Repeated record ID: ' + item['id']
            seen_ids.add(item['id'])
            assert item['gold']['status'] in ['known', 'unknown']
            assert isinstance(item['gold']['data'], dict)
            assert item['fields'] and all(isinstance(k, str) and v in ['string', 'number', 'boolean', 'array'] for k, v in item['fields'].items())
            if item['gold']['status'] == 'known':
                assert set(item['fields']) == set(item['gold']['data'])
            else:
                assert item['gold']['data'] == {}
    covered = {e for item in rows['train'] for e in item['evidence'] if e.startswith('F')}
    assert covered == {'F' + str(n).zfill(2) for n in range(1, 31)}, covered
    print('Split counts:', {s: len(items) for s, items in rows.items()})
    print('30 rule IDs covered in train; no identical questions shared across splits.')
    if args.check_only:
        return
    require_managed()
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    fingerprint = verify_model()
    from transformers import AutoTokenizer
    from mlx_lm.tuner.datasets import ChatDataset
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL), local_files_only=True, trust_remote_code=False)
    out = ROOT / args.data_out
    out.mkdir(parents=True, exist_ok=True)
    lengths = []
    for split in ['train', 'valid']:
        records = []
        for item in rows[split]:
            msg = messages(item)
            full = msg + [{'role': 'assistant', 'content': json.dumps(item['gold'], ensure_ascii=False)}]
            record = {'messages': full}
            # Validate the real MLX loss-mask path rather than assume a compatible template.
            tokens, offset = ChatDataset([record], tokenizer, mask_prompt=True).process(record)
            prompt_tokens = tokenizer.apply_chat_template(msg, add_generation_prompt=True, return_dict=False)
            if offset != len(prompt_tokens) or tokens[:offset] != prompt_tokens:
                raise SystemExit('Chat-template/loss-mask boundary mismatch. Stop and review versions.')
            if not (0 < offset < len(tokens)) or len(tokens) > 512:
                raise SystemExit('Empty target or sequence over 512 tokens. Review data/config before training.')
            lengths.append(len(tokens))
            records.append(record)
        text = ''.join(json.dumps(r, ensure_ascii=False) + '\n' for r in records)
        path = out / (split + '.jsonl')
        if path.exists() and path.read_text() != text:
            raise SystemExit('Prepared data differs from existing file. Use a new experiment directory.')
        path.write_text(text)
    lock = {'source_sha256': sha(ROOT / 'source-handbook.txt'), 'model_fingerprint': fingerprint,
            'system_sha256': hashlib.sha256(SYSTEM.encode()).hexdigest(),
            'splits': {s: {'count': len(rows[s]), 'sha256': sha(ROOT / args.seeds / (s + '.jsonl'))} for s in rows},
            'maximum_sequence_tokens': max(lengths), 'mask_boundary_checked': True}
    dump_json(ROOT / args.lock_out, lock)
    print('Prepared data/train.jsonl and data/valid.jsonl; token lengths and masks checked.')

if __name__ == '__main__':
    main()
