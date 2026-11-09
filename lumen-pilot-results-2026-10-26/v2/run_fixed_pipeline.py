"""Execute the predeclared follow-up once; stop on any failure, never tune from exams."""
import datetime
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from common import ROOT, dump_json, read_jsonl, sha
from compare import grade


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def frozen():
    f = json.loads((ROOT / 'freeze.json').read_text())
    assert all(sha(ROOT / n) == digest for n, digest in f['files'].items()), 'Frozen input changed'


def main():
    os.chdir(ROOT)
    state_path = ROOT / 'runs/pipeline-state.json'
    assert not state_path.exists(), 'One-shot pipeline; inspect prior state before any rerun'
    probe = json.loads((ROOT / 'runs/resources/calibration.json').read_text())
    assert probe['status'] == 'completed' and probe['observed_pressure_levels'] == [1]
    assert probe['max_swap_growth_bytes'] == 0
    frozen()
    preflight = json.loads((ROOT / 'preflight.json').read_text())
    preflight.update(training_capacity_approved=True, approved_at=now(), measured_probe='runs/resources/calibration.json')
    dump_json(ROOT / 'preflight.json', preflight)
    state = {'started_at': now(), 'pid': os.getpid(), 'status': 'running', 'stages': [], 'protocol_sha256': sha(ROOT / 'protocol.json')}
    dump_json(state_path, state)

    def run(stage, command):
        frozen()
        row = {'stage': stage, 'started_at': now(), 'status': 'running'}
        state['stages'].append(row)
        dump_json(state_path, state)
        argv = ['/opt/homebrew/bin/python3.12', 'manage.py', 'exec', '--stage', stage, '--',
                '/usr/bin/caffeinate', '-i', '.venv/bin/python', 'resource_guard.py', '--stage', stage,
                '--max-footprint-gib', '6', '--max-swap-growth-gib', '0.75', '--interval', '1', '--'] + command
        print('\nSTART', stage, now(), flush=True)
        code = subprocess.call(argv, cwd=ROOT)
        row.update(finished_at=now(), exit_code=code, status='completed' if code == 0 else 'failed')
        if code:
            state.update(status='stopped_on_failure', finished_at=now())
        dump_json(state_path, state)
        if code:
            raise SystemExit(code)

    run('train-clean', ['.venv/bin/mlx_lm.lora', '--config', 'train-clean.yaml'])
    run('train-expanded', ['.venv/bin/mlx_lm.lora', '--config', 'train-config.yaml'])
    # Both training trajectories are over before the first new exam generation.
    checkpoint = ROOT / 'adapters/expanded/0000200_adapters.safetensors'
    assert checkpoint.exists()
    target = ROOT / 'adapters/expanded-200'
    target.mkdir(exist_ok=False)
    shutil.copy2(ROOT / 'adapters/expanded/adapter_config.json', target / 'adapter_config.json')
    shutil.copy2(checkpoint, target / 'adapters.safetensors')
    dump_json(target / 'checkpoint-provenance.json', {'iteration': 200, 'trajectory_planned_iters': 800,
              'source': str(checkpoint.relative_to(ROOT)), 'sha256': sha(checkpoint), 'copied_at': now(),
              'selection': 'fixed in protocol before training; not selected by exam'})
    old = ROOT.parent.parent / 'adapters/lumen-v1'
    arms = {'base': None, 'v1': old, 'clean200': ROOT / 'adapters/clean',
            'expanded200': target, 'expanded800': ROOT / 'adapters/expanded'}
    for arm, adapter in arms.items():
        command = ['.venv/bin/python', 'run_eval.py', '--out', f'runs/eval-{arm}.jsonl']
        if adapter:
            command += ['--adapter', str(adapter)]
        run('eval-' + arm, command)
    tests = read_jsonl(ROOT / 'seeds/test.jsonl')
    totals = {}
    for arm in arms:
        rows = read_jsonl(ROOT / f'runs/eval-{arm}.jsonl')
        assert len(rows) == 61
        assert {x['id'] for x in rows[1:]} == {t['id'] for t in tests}
        totals[arm] = sum(grade(x['raw'], t['gold']) for x, t in zip(rows[1:], tests))
    state.update(status='completed', finished_at=now(), automatic_scores=totals, semantic_review_pending=True)
    dump_json(state_path, state)
    print('ALL FIXED STAGES COMPLETE', json.dumps(totals), flush=True)


if __name__ == '__main__':
    main()
