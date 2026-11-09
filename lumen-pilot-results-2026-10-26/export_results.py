"""Export small review/reproduction artifacts, excluding weights, runtimes and caches."""
import datetime
import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from common import ROOT, sha

DEST = ROOT.parent / 'lumen-pilot-results-2026-10-26'

def main():
    marker = DEST / '.lumen-result-export.json'
    identity = json.loads((ROOT / '.lumen-experiment.json').read_text())['id']
    if DEST.exists():
        assert marker.exists() and json.loads(marker.read_text())['experiment_id'] == identity
    else:
        DEST.mkdir()
        marker.write_text(json.dumps({'experiment_id': identity, 'source': str(ROOT)}, indent=2))
    files = set()
    for pattern in ['*.py', '*.txt', '*.yaml', '*.json']:
        files.update(p for p in ROOT.glob(pattern) if p.is_file())
    for name in ['seeds', 'data', 'provenance', '.control/jobs', '.control/logs', 'runs']:
        for p in (ROOT / name).rglob('*'):
            if not p.is_file():
                continue
            rel = p.relative_to(ROOT)
            if any(x in rel.parts for x in ['__pycache__', 'profile', 'tmp', '.openai']):
                continue
            if 'qa' in rel.parts and p.suffix not in ['.json', '.cjs', '.txt', '.md']:
                continue
            if p.name in ['manifest.json', 'reproduction.zip']:
                continue
            files.add(p)
    for p in sorted(files):
        target = DEST / p.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
        assert sha(p) == sha(target)
    with zipfile.ZipFile(DEST / 'reproduction.zip', 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for p in sorted(files):
            rel = p.relative_to(ROOT)
            runnable = (len(rel.parts) == 1 and (p.suffix == '.py' or p.name in ['requirements.in', 'requirements.lock.txt', 'source-handbook.txt', 'train-config.yaml', 'README.txt', 'AGENT-RUNBOOK.txt'])) or rel.parts[0] == 'seeds'
            if runnable:
                z.write(p, rel)
            elif p.name in ['model-lock.json', 'data-lock.json', 'protocol-amendments.json', 'primary-run-freeze.json']:
                z.write(p, Path('original-run-provenance') / rel)
        z.writestr('REPRODUCE.txt', 'Start in a NEW directory named lumen-local-... . No runtime marker, model-lock, adapters, generated data or output files are installed at the top level. original-run-provenance is historical evidence only. Run manage.py init, create .venv, install locked requirements, doctor, download_model.py, prepare_data.py, make_calibration.py, preflight.py and a guarded calibration. Only after passing capacity checks run before, fresh200-step training, after, compare and separateopenbook control. Follow AGENT-RUNBOOK.txt for scoped execution. All original measurements and answers are in the separate result export, not rerun outputs. Rebuild a new protocol/freeze/semantic review for a new report.\n')
    (DEST / 'index.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=runs/report.html"><a href="runs/report.html">Открыть отчёт мини-пилота</a>')
    (DEST / 'DELIVERY.txt').write_text('Локальный результат мини-пилота, 26.10.2026.\n\nНачни с runs/report.html; презентация: runs/video/dist/index.html.\nСам HTML-отчёт автономен; для переходов между материалами удобнее локальный HTTP.\nВ этой папке нет весов моделей, .venv и кешей. Экспорт сохраняется после cleanup runtime.\nreproduction.zip содержит фактически использованные скрипты, данные и конфигурацию.\nДля нового прогона распакуй в НОВЫЙ каталог lumen-local-… и выполни manage.py init. Не переноси старый маркер.\n\nТекущий результат: 0/8 до, 0/8 после, 3/8 при источнике в контексте. Это один пилот, не общий вывод о LoRA.\n')
    rows = {str(p.relative_to(DEST)): {'bytes': p.stat().st_size, 'sha256': sha(p)}
            for p in sorted(DEST.rglob('*')) if p.is_file() and p.name != 'manifest.json'}
    manifest = {'created_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'experiment_id': identity, 'source': str(ROOT), 'export': str(DEST),
                'excludes': ['model weights', '.venv', 'caches', 'temporary browser profiles'],
                'files': rows, 'total_bytes': sum(x['bytes'] for x in rows.values())}
    (DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    assert all(sha(DEST / name) == row['sha256'] for name, row in rows.items())
    print(json.dumps({'export': str(DEST), 'files': len(rows), 'MiB': round(manifest['total_bytes']/2**20, 2), 'manifest_verified': True}, ensure_ascii=False))

if __name__ == '__main__':
    main()
