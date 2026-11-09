"""Read-only integrity/process audit; records evidence without loading a model."""
import datetime
import json
import subprocess
import sys
from pathlib import Path

from common import ROOT, SYSTEM, dump_json, read_jsonl, sha, verify_model
from compare import grade
import hashlib


def managed_status(root):
    return json.loads(subprocess.check_output(
        [sys.executable, str(root / 'manage.py'), 'status'], cwd=root, text=True))


def main():
    freeze = json.loads((ROOT / 'freeze.json').read_text())
    assert all(sha(ROOT / name) == expected for name, expected in freeze['files'].items())
    fingerprint = verify_model()
    tests = read_jsonl(ROOT / 'seeds/test.jsonl')
    assert len(tests) == 60
    review = json.loads((ROOT / 'runs/semantic-review.json').read_text())
    assert review['exam_sha256'] == sha(ROOT / 'seeds/test.jsonl')
    assert review['source_sha256'] == sha(ROOT / 'source-handbook.txt')
    scores = {}
    common_meta = None
    for arm in ['base', 'v1', 'clean200', 'expanded200', 'expanded800']:
        path = ROOT / 'runs' / ('eval-' + arm + '.jsonl')
        rows = read_jsonl(path)
        meta = rows[0]['meta']
        assert len(rows) == 61
        assert [r['id'] for r in rows[1:]] == [t['id'] for t in tests]
        comparable = {k: meta[k] for k in ['model_fingerprint', 'system_sha256',
                     'exam_sha256', 'versions', 'decoding', 'closed_book']}
        if common_meta is None:
            common_meta = comparable
        assert comparable == common_meta
        assert meta['model_fingerprint'] == fingerprint
        assert meta['system_sha256'] == hashlib.sha256(SYSTEM.encode()).hexdigest()
        assert meta['exam_sha256'] == sha(ROOT / 'seeds/test.jsonl')
        assert meta['closed_book'] is True
        if meta['adapter']:
            assert sha(Path(meta['adapter']) / 'adapters.safetensors') == meta['adapter_sha256']
        reviewed = review['arms'][arm]
        assert reviewed['file_sha256'] == sha(path)
        assert [r['id'] for r in reviewed['items']] == [t['id'] for t in tests]
        scores[arm] = {'strict': sum(grade(r['raw'], t['gold']) for r, t in zip(rows[1:], tests)),
                       'semantic_agent_review': sum(r['full_answer_correct'] for r in reviewed['items']),
                       'count': 60}
    ck = json.loads((ROOT / 'adapters/expanded-200/checkpoint-provenance.json').read_text())
    assert ck['iteration'] == 200 and ck['trajectory_planned_iters'] == 800
    assert sha(ROOT / ck['source']) == ck['sha256'] == sha(ROOT / 'adapters/expanded-200/adapters.safetensors')
    recall = read_jsonl(ROOT / 'runs/training-recall.jsonl')
    recall_review = json.loads((ROOT / 'runs/training-recall-semantic.json').read_text())
    assert len(recall) == 31 and recall[0]['meta']['held_out'] is False
    assert recall_review['raw_sha256'] == sha(ROOT / 'runs/training-recall.jsonl')
    assert recall_review['training_sha256'] == recall[0]['meta']['train_sha256'] == sha(ROOT / 'seeds/train.jsonl')
    assert recall_review['source_sha256'] == sha(ROOT / 'source-handbook.txt')
    train_first30 = read_jsonl(ROOT / 'seeds/train.jsonl')[:30]
    assert [r['id'] for r in recall_review['items']] == [r['id'] for r in recall[1:]]
    assert all(r['id'] == t['id'] and r['question'] == t['question'] and r['gold'] == t['gold']
               and r['inference_prompt_equals_training_prefix'] is True
               for r, t in zip(recall[1:], train_first30))
    assert sum(grade(r['raw'], t['gold']) for r, t in zip(recall[1:], train_first30)) == 21
    assert sum(r['full_answer_correct'] for r in recall_review['items']) == 19
    state = json.loads((ROOT / 'runs/pipeline-state.json').read_text())
    assert state['status'] == 'completed'
    assert all(x['status'] == 'completed' and x['exit_code'] == 0 for x in state['stages'])
    p = subprocess.run(['ps', '-p', str(state['pid']), '-o', 'command='], capture_output=True, text=True)
    assert not p.stdout.strip(), 'Original pipeline PID still exists; inspect before concluding idle.'
    local = managed_status(ROOT)
    parent = ROOT.parent.parent
    whole = managed_status(parent)
    assert not local['tracked_running_jobs']
    assert all(x['stage'] == 'report-server' for x in whole['tracked_running_jobs'])
    dump_json(ROOT / 'runs/final-status.json', local)
    plan = json.loads(subprocess.check_output([sys.executable, str(parent / 'manage.py'), 'cleanup'],
                                             cwd=parent, text=True))
    assert plan['dry_run'] is True
    dump_json(ROOT / 'runs/cleanup-plan.json', plan)
    kb = subprocess.run(['/usr/sbin/lsof', '-nP', '-iTCP:7341', '-sTCP:LISTEN'], capture_output=True, text=True)
    assert kb.returncode == 0 and 'chaos-kb' in kb.stdout
    resources = [json.loads(p.read_text()) for p in sorted((ROOT / 'runs/resources').glob('*.json'))]
    assert all(r['status'] == 'completed' and r['guard_exit_code'] == 0 for r in resources)
    result = {'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'frozen_inputs_verified': len(freeze['files']), 'base_model_fingerprint': fingerprint,
              'all_exam_and_adapter_hashes_verified': True, 'scores': scores,
              'training_and_inference_jobs_running': 0, 'orchestrator_exited': True,
              'remaining_parent_jobs': whole['tracked_running_jobs'],
              'ks_kb_preserved_listening_port': 7341,
              'v2_guarded_stages': len(resources),
              'peak_observed_physical_footprint_bytes': max(r['peak_footprint_bytes'] for r in resources),
              'max_observed_swap_growth_bytes': max(r['max_swap_growth_bytes'] for r in resources),
              'cleanup_executed': False, 'runtime_logical_file_bytes_at_audit': whole['logical_file_bytes'],
              'note': 'Runtime and adapters retained for review; parent cleanup preview only. Local report server still runs.'}
    dump_json(ROOT / 'runs/final-integrity.json', result)
    state['semantic_review_pending'] = False
    state['semantic_review_sha256'] = sha(ROOT / 'runs/semantic-review.json')
    dump_json(ROOT / 'runs/pipeline-state.json', state)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
