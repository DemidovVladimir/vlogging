"""Preserve v2 evidence and selected tiny adapters outside the disposable runtime."""
import datetime
import json
import shutil
import zipfile
from pathlib import Path
from common import ROOT, sha

PILOT = ROOT.parent.parent
DEST = PILOT.parent / 'lumen-pilot-results-2026-10-26'


def main():
    assert json.loads((DEST / '.lumen-result-export.json').read_text())['source'] == str(PILOT)
    state = json.loads((ROOT / 'runs/pipeline-state.json').read_text())
    assert state['status'] == 'completed'
    report = json.loads((ROOT / 'runs/report-data.json').read_text())
    assert report['status'] == 'complete'
    freeze = json.loads((ROOT / 'freeze.json').read_text())
    assert all(sha(ROOT / n) == h for n, h in freeze['files'].items())
    target = DEST / 'v2'
    target.mkdir(exist_ok=True)
    files = {p for p in ROOT.iterdir() if p.is_file() and not p.name.startswith('.') and p.suffix in ['.py', '.json', '.yaml', '.txt']}
    for name in ['seeds', 'seeds-clean', 'data', 'data-clean', 'evaluation-draft', 'clean-data-draft',
                 'expanded-data-draft', 'runs', '.control/jobs', '.control/logs']:
        for p in (ROOT / name).rglob('*'):
            if p.is_file() and not any(x in p.relative_to(ROOT).parts for x in ['__pycache__', 'profile', 'tmp', 'node_modules']):
                files.add(p)
    for p in sorted(files):
        out = target / p.relative_to(ROOT)
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, out)
        assert sha(p) == sha(out)
        if p.relative_to(ROOT) == Path('runs/report.html'):
            # The evidence export has one less nesting level than the runtime.
            # Keep the history link usable both over loopback and as a local file.
            out.write_text(out.read_text().replace('href="../../../runs/report.html"',
                                                  'href="../../runs/report.html"'))
    adapters = {'v1': PILOT / 'adapters/lumen-v1', 'clean200': ROOT / 'adapters/clean',
                'expanded200': ROOT / 'adapters/expanded-200', 'expanded800': ROOT / 'adapters/expanded'}
    for label, folder in adapters.items():
        out = target / 'adapters' / label
        out.mkdir(parents=True, exist_ok=True)
        for n in ['adapters.safetensors', 'adapter_config.json', 'checkpoint-provenance.json']:
            p = folder / n
            if p.is_file():
                shutil.copy2(p, out / n)
                assert sha(p) == sha(out / n)
    with zipfile.ZipFile(target / 'reproduction.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for p in sorted(files):
            rel = p.relative_to(ROOT)
            if rel.parts[0] in ['runs', '.control']:
                continue
            if len(rel.parts) == 1 and p.suffix == '.json':
                z.write(p, Path('original-run-provenance') / rel)
            else:
                z.write(p, rel)
    info = {'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'source': str(ROOT), 'selected_adapters': list(adapters), 'model_weights_included': False,
            'runtime_and_caches_included': False, 'scope': 'Frozen data, actual raw outputs, metrics, source, code and selected adapters. Keep after parent cleanup.'}
    info['presentation_path_adjustment'] = 'History href in exported report adjusted for one less parent directory; evidence bytes unchanged.'
    (target / 'export-info.json').write_text(json.dumps(info, ensure_ascii=False, indent=2) + '\n')
    # Preserve the original dashboard and add a plain route to the new, separately scored study.
    old = DEST / 'runs/report.html'
    body = old.read_text()
    if 'id="v2-banner"' not in body:
        banner = '<aside id="v2-banner" style="background:#172326;color:#fff;padding:16px;text-align:center;font:16px system-ui"><a style="color:inherit" href="../v2/runs/report.html">Готов повтор с исправленными данными → новый отчёт на 60 вопросах</a></aside>'
        old.write_text(body.replace('<body>', '<body>' + banner, 1))
    (DEST / 'index.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=v2/runs/report.html"><a href="v2/runs/report.html">Последний отчёт: исправленные данные</a>')
    rows = {str(p.relative_to(DEST)): {'bytes': p.stat().st_size, 'sha256': sha(p)}
            for p in sorted(DEST.rglob('*')) if p.is_file() and p.name != 'manifest.json'}
    original = json.loads((DEST / 'manifest.json').read_text())
    original.update(updated_at=info['created_at'], latest_report='v2/runs/report.html', files=rows,
                    total_bytes=sum(x['bytes'] for x in rows.values()))
    (DEST / 'manifest.json').write_text(json.dumps(original, ensure_ascii=False, indent=2) + '\n')
    assert all(sha(DEST / n) == row['sha256'] for n, row in rows.items())
    print(json.dumps({'export': str(target), 'total_export_MiB': original['total_bytes']/2**20,
                      'manifest_files': len(rows), 'verified': True}, ensure_ascii=False))


if __name__ == '__main__':
    main()
