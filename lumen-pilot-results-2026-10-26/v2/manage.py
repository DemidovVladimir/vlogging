"""Scoped process/cache lifecycle for one disposable local experiment.

No MLX imports. cleanup is a preview unless --apply and the exact marker ID are given.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).absolute().parent
MARKER = ROOT / '.lumen-experiment.json'
CONTROL = ROOT / '.control'

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)

def safe_root():
    if ROOT.is_symlink() or ROOT != ROOT.resolve():
        raise SystemExit('Refusing a symlinked experiment root.')
    if not ROOT.name.startswith('lumen-local-') or ROOT in [Path.home(), Path('/'), Path.home() / 'development']:
        raise SystemExit('Use a dedicated directory named lumen-local-...; never run lifecycle commands in the source repository.')
    if (ROOT / '.git').exists():
        raise SystemExit('Refusing lifecycle operations in a Git checkout; use a disposable copy.')
    for name in ['source-handbook.txt', 'train-config.yaml', 'requirements.in']:
        if not (ROOT / name).is_file():
            raise SystemExit('Missing bundle file: ' + name)

def marker():
    safe_root()
    if not MARKER.exists():
        raise SystemExit('Initialize this disposable copy with manage.py init first.')
    data = json.loads(MARKER.read_text())
    if data.get('root') != str(ROOT) or data.get('uid') != os.getuid() or data.get('schema') != 1:
        raise SystemExit('Marker path/owner mismatch. Refusing to proceed.')
    uuid.UUID(data['id'])
    return data

def environment(online=False):
    env = os.environ.copy()
    paths = {
        'HF_HOME': ROOT / '.cache/huggingface',
        'HF_HUB_CACHE': ROOT / '.cache/huggingface/hub',
        'HF_XET_CACHE': ROOT / '.cache/huggingface/xet',
        'HF_ASSETS_CACHE': ROOT / '.cache/huggingface/assets',
        'PIP_CACHE_DIR': ROOT / '.cache/pip',
        'XDG_CACHE_HOME': ROOT / '.cache/xdg',
        'PYTHONPYCACHEPREFIX': ROOT / '.cache/pycache',
        'TMPDIR': ROOT / '.tmp',
    }
    for key, path in paths.items():
        path.mkdir(parents=True, exist_ok=True)
        env[key] = str(path)
    env['HF_TOKEN_PATH'] = str(ROOT / '.cache/huggingface/token')
    env['HF_HUB_DISABLE_IMPLICIT_TOKEN'] = '1'
    env['HF_HUB_DISABLE_TELEMETRY'] = '1'
    env['HF_HUB_OFFLINE'] = '0' if online else '1'
    env['TRANSFORMERS_OFFLINE'] = '0' if online else '1'
    env['PIP_CONFIG_FILE'] = os.devnull
    env['PIP_REQUIRE_VIRTUALENV'] = '1'
    env['PYTHONNOUSERSITE'] = '1'
    env['LUMEN_EXPERIMENT_ROOT'] = str(ROOT)
    env['PATH'] = str(ROOT / '.venv/bin') + os.pathsep + env.get('PATH', '')
    return env

def identity(pid):
    r = subprocess.run(['ps', '-p', str(pid), '-o', 'lstart=', '-o', 'stat='], capture_output=True, text=True)
    parts = r.stdout.split()
    if len(parts) < 6 or parts[-1].startswith('Z'):
        return None
    return ' '.join(parts[:-1])

def group_members(pgid):
    r = subprocess.run(['ps', '-axo', 'pid=,pgid=,stat='], capture_output=True, text=True, check=True)
    out = []
    for line in r.stdout.splitlines():
        parts = line.split()
        if len(parts) == 3 and int(parts[1]) == pgid and not parts[2].startswith('Z'):
            out.append(int(parts[0]))
    return out

def jobs():
    return [(p, json.loads(p.read_text())) for p in sorted((CONTROL / 'jobs').glob('*.json'))]

def running_jobs():
    return [j for _, j in jobs() if group_members(j['pgid']) or
            (j.get('manager_birth') and identity(j['manager_pid']) == j['manager_birth'])]

def tree_bytes():
    total = 0
    for base, dirs, files in os.walk(ROOT, followlinks=False):
        for name in files:
            try:
                total += (Path(base) / name).lstat().st_size
            except FileNotFoundError:
                pass
    return total

def open_holders():
    lsof = shutil.which('lsof')
    if not lsof:
        raise SystemExit('lsof unavailable; cannot verify that experiment files are closed.')
    r = subprocess.run([lsof, '-nP', '+D', str(ROOT), '-Fp'], capture_output=True, text=True)
    if r.returncode not in [0, 1] or r.stderr.strip():
        raise SystemExit('Could not complete the open-file audit; inspect lsof output locally.')
    return sorted({int(line[1:]) for line in r.stdout.splitlines() if line.startswith('p')} - {os.getpid()})

def stop_owned():
    # Never signal a reused PID. An unverifiable remaining group requires inspection.
    for _, j in jobs():
        members = group_members(j['pgid'])
        if members:
            if identity(j['pid']) != j['birth'] or os.getpgid(j['pid']) != j['pgid']:
                raise SystemExit('Remaining process group has no verifiable leader; inspect PIDs ' + str(members))
            os.killpg(j['pgid'], signal.SIGTERM)
            deadline = time.monotonic() + 6
            while group_members(j['pgid']) and time.monotonic() < deadline:
                time.sleep(.1)
            if group_members(j['pgid']):
                if identity(j['pid']) != j['birth']:
                    raise SystemExit('Leader disappeared but group remains; inspect it before cleanup.')
                os.killpg(j['pgid'], signal.SIGKILL)
        deadline = time.monotonic() + 4
        while j.get('manager_birth') and identity(j['manager_pid']) == j['manager_birth'] and time.monotonic() < deadline:
            time.sleep(.1)
        if j.get('manager_birth') and identity(j['manager_pid']) == j['manager_birth']:
            os.kill(j['manager_pid'], signal.SIGTERM)
    deadline = time.monotonic() + 4
    while running_jobs() and time.monotonic() < deadline:
        time.sleep(.1)
    if running_jobs():
        raise SystemExit('Owned processes have not exited; cleanup refused.')

def execute(stage, command, online=False):
    marker()
    if not command:
        raise SystemExit('Provide a command after --.')
    if running_jobs():
        raise SystemExit('Another tracked job is active; finish or stop it first.')
    job_id = uuid.uuid4().hex
    logfile = CONTROL / 'logs' / (job_id + '.log')
    logfile.parent.mkdir(parents=True, exist_ok=True)
    child = subprocess.Popen(command, cwd=ROOT, env=environment(online), start_new_session=True,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    record = {'id': job_id, 'stage': stage, 'command': command, 'pid': child.pid, 'pgid': child.pid,
              'birth': identity(child.pid), 'manager_pid': os.getpid(), 'manager_birth': identity(os.getpid()),
              'state': 'running', 'log': str(logfile.relative_to(ROOT))}
    path = CONTROL / 'jobs' / (job_id + '.json')
    write_json(path, record)
    def interrupted(signum, frame):
        try:
            os.killpg(child.pid, signal.SIGTERM)
            child.wait(timeout=6)
        except subprocess.TimeoutExpired:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait()
        except ProcessLookupError:
            pass
        raise SystemExit(128 + signum)
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        with logfile.open('w') as log:
            for line in child.stdout:
                log.write(line); log.flush()
                print(line, end='', flush=True)
        code = child.wait()
    finally:
        if child.poll() is None:
            try:
                os.killpg(child.pid, signal.SIGTERM)
                child.wait(timeout=6)
            except subprocess.TimeoutExpired:
                os.killpg(child.pid, signal.SIGKILL)
                child.wait()
            except ProcessLookupError:
                pass
        if child.poll() is not None:
            record.update(state='finished', exit_code=child.returncode)
            write_json(path, record)
    return code

def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('init')
    sub.add_parser('status')
    run = sub.add_parser('exec'); run.add_argument('--stage', required=True); run.add_argument('--online', action='store_true'); run.add_argument('command', nargs=argparse.REMAINDER)
    for name in ['stop', 'cleanup']:
        p = sub.add_parser(name); p.add_argument('--apply', action='store_true'); p.add_argument('--expect-id')
    args = parser.parse_args()
    if args.action == 'init':
        safe_root()
        if not MARKER.exists():
            write_json(MARKER, {'schema': 1, 'id': str(uuid.uuid4()), 'root': str(ROOT),
                                'uid': os.getuid(), 'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat()})
        print(json.dumps(marker(), ensure_ascii=False, indent=2))
        return
    m = marker()
    if args.action == 'exec':
        cmd = args.command[1:] if args.command[:1] == ['--'] else args.command
        raise SystemExit(execute(args.stage, cmd, args.online))
    plan = {'experiment_id': m['id'], 'root': str(ROOT), 'tracked_running_jobs': running_jobs(),
            'logical_file_bytes': tree_bytes(), 'dry_run': not getattr(args, 'apply', False)}
    if args.action == 'status':
        plan['jobs'] = [j for _, j in jobs()]
        print(json.dumps(plan, ensure_ascii=False, indent=2)); return
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    if not args.apply:
        return
    if args.expect_id != m['id']:
        raise SystemExit('Exact --expect-id from this marker is required; nothing was stopped or deleted.')
    stop_owned()
    if args.action == 'stop':
        print(json.dumps({'owned_running_jobs': 0, 'files_preserved': True})); return
    holders = open_holders()
    if holders:
        raise SystemExit('Untracked open-file/cwd holders remain; do not kill unrelated apps. Inspect PIDs ' + str(holders))
    if marker()['id'] != m['id']:
        raise SystemExit('Marker changed during cleanup.')
    free_before = shutil.disk_usage(ROOT.parent).free
    os.chdir(ROOT.parent)
    shutil.rmtree(ROOT)
    print(json.dumps({'deleted_root': not ROOT.exists(), 'tracked_running_jobs': 0,
                      'logical_bytes_removed_estimate': plan['logical_file_bytes'],
                      'observed_free_disk_delta_bytes': shutil.disk_usage(ROOT.parent).free - free_before,
                      'scope': 'dedicated experiment directory; no global caches or other services touched'}, ensure_ascii=False))

if __name__ == '__main__':
    main()
