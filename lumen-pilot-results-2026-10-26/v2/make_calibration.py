"""Build a training-only, 481–512-token capacity probe; never use exam items."""
import copy
import json
from common import ROOT, MODEL, require_managed, verify_model, read_jsonl, dump_json, sha

def main():
    require_managed()
    verify_model()
    from transformers import AutoTokenizer
    from mlx_lm.tuner.datasets import ChatDataset
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL), local_files_only=True, trust_remote_code=False)
    records = read_jsonl(ROOT / 'data/train.jsonl')
    process = ChatDataset(records, tokenizer, mask_prompt=True).process
    original = max(records, key=lambda x: len(process(x)[0]))
    record = copy.deepcopy(original)
    while len(process(record)[0]) < 481:
        record['messages'][-2]['content'] += ' калибровка'
    tokens, offset = process(record)
    assert 481 <= len(tokens) <= 512 and 0 < offset < len(tokens)
    folder = ROOT / 'calibration-data'
    folder.mkdir(exist_ok=False)
    text = json.dumps(record, ensure_ascii=False) + '\n'
    for split in ['train', 'valid']:
        (folder / (split + '.jsonl')).write_text(text)
    dump_json(ROOT / 'calibration-plan.json', {
        'purpose': 'Technical forward/backward memory and adapter-loading probe only',
        'tokens': len(tokens), 'loss_start': offset, 'padded_batch_tokens': 512,
        'source': 'Longest prepared training example, user message padded before assistant target',
        'uses_test_or_validation_questions': False,
        'main_training_data_unchanged': True,
        'iterations': 20, 'adapter': 'adapters/smoke',
        'train_sha256': sha(ROOT / 'data/train.jsonl'),
        'calibration_sha256': sha(folder / 'train.jsonl')
    })
    print('Capacity probe ready:', len(tokens), 'tokens; MLX batch pads to 512; no exam input.')

if __name__ == '__main__':
    main()
