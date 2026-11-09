"""Post-hoc diagnostic on exact TRAINING questions, not a held-out accuracy test."""
import json
import math
import time
from common import ROOT, MODEL, require_managed, read_jsonl, messages, sha, verify_model, dump_json
from compare import grade


def main():
    require_managed()
    verify_model()
    import mlx.core as mx
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler
    from mlx_lm.tuner.datasets import ChatDataset
    from mlx_lm.tuner.trainer import default_loss
    mx.set_default_device(mx.gpu)
    adapter = ROOT / 'adapters/expanded'
    model, tokenizer = load(str(MODEL), adapter_path=str(adapter), trust_remote_code=False)
    items = read_jsonl(ROOT / 'seeds/train.jsonl')[:30]
    records = read_jsonl(ROOT / 'data/train.jsonl')[:30]
    rows = []
    with (ROOT / 'runs/training-recall.jsonl').open('x') as out:
        out.write(json.dumps({'meta': {'diagnostic': 'exact first30 training atomic questions', 'held_out': False,
                  'adapter_sha256': sha(adapter / 'adapters.safetensors'), 'train_sha256': sha(ROOT / 'seeds/train.jsonl'),
                  'max_output_tokens': 256, 'temperature': 0}}, ensure_ascii=False) + '\n')
        for item, record in zip(items, records):
            msg = messages(item)
            assert record['messages'][:-1] == msg
            tokens, offset = ChatDataset([record], tokenizer, mask_prompt=True).process(record)
            prompt = tokenizer.apply_chat_template(msg, tokenize=False, add_generation_prompt=True, enable_thinking=False)
            templated = tokenizer.apply_chat_template(msg, tokenize=True, add_generation_prompt=True, enable_thinking=False, return_dict=False)
            # Match the exact string-encoding path used by this installed MLX generate API.
            add_special = tokenizer.bos_token is None or not prompt.startswith(tokenizer.bos_token)
            encoded = tokenizer.encode(prompt, add_special_tokens=add_special)
            prompt_matches_training = encoded == list(tokens[:offset]) == templated
            mx.random.seed(42)
            start = time.perf_counter()
            raw = generate(model, tokenizer, prompt=prompt, max_tokens=256, sampler=make_sampler(temp=0), verbose=False)
            elapsed = time.perf_counter() - start
            loss, ntoks = default_loss(model, mx.array([tokens], dtype=mx.int32), mx.array([[offset, len(tokens)]], dtype=mx.int32))
            mx.eval(loss, ntoks)
            row = {'id': item['id'], 'question': item['question'], 'gold': item['gold'], 'raw': raw,
                   'strict_training_recall': bool(grade(raw, item['gold'])), 'seconds': elapsed,
                   'teacher_forced_loss_on_gold_target': loss.item(), 'target_tokens': ntoks.item(),
                   'inference_prompt_equals_training_prefix': prompt_matches_training,
                   'prompt_token_count': len(encoded), 'training_offset': offset}
            rows.append(row)
            out.write(json.dumps(row, ensure_ascii=False) + '\n'); out.flush()
            print(item['id'], row['strict_training_recall'], 'prefix_match', prompt_matches_training, 'target_loss', round(loss.item(), 4), flush=True)
            mx.clear_cache()
    total_tokens = sum(x['target_tokens'] for x in rows)
    summary = {'held_out': False, 'post_hoc': True, 'purpose': 'Training recall and exact inference/train prompt compatibility; not added to primary60 score',
               'count': len(rows), 'strict_training_recall': sum(x['strict_training_recall'] for x in rows),
               'all_inference_prefixes_match_training': all(x['inference_prompt_equals_training_prefix'] for x in rows),
               'token_weighted_teacher_forced_loss': sum(x['teacher_forced_loss_on_gold_target']*x['target_tokens'] for x in rows)/total_tokens,
               'raw': 'runs/training-recall.jsonl'}
    dump_json(ROOT / 'runs/training-recall-summary.json', summary)
    print(json.dumps(summary, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
