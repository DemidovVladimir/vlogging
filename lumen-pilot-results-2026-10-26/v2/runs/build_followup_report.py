#!/usr/bin/env python3
"""Read-only evidence builder: stdlib + the frozen compare.grade; never imports MLX.

Writes only runs/report.html, report-data.json and video-angle.txt. Incomplete or
incompatible arms remain visibly pending; no missing response becomes a success.
"""
import argparse
import base64
import hashlib
import html
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone

sys.dont_write_bytecode = True
RUNS = Path(__file__).resolve().parent
ROOT = RUNS.parent
V1_ROOT = ROOT.parent.parent
ARMS = [
    ('base', 'База', 'Без адаптера', 0, 0),
    ('v1', 'Прежняя LoRA', '60 / 12 · 200 шагов', 60, 200),
    ('clean200', 'Чистые ответы', '60 / 12 · 200 шагов', 60, 200),
    ('expanded200', 'Больше примеров', '300 / 24 · шаг 200', 300, 200),
    ('expanded800', 'Дольше обучение', '300 / 24 · шаг 800', 300, 800),
]
CATEGORIES = {'atomic': ('Факты', 30), 'composition': ('Сочетания правил', 24), 'unknown': ('Нет сведений', 6)}
METADATA_KEYS = ['model_fingerprint', 'system_sha256', 'exam_sha256', 'versions', 'decoding', 'closed_book']
PAIRINGS = [('v1', 'clean200', 'Только целевые ответы'),
            ('clean200', 'expanded200', 'Расширенный набор'),
            ('expanded200', 'expanded800', 'Ещё 600 шагов той же траектории'),
            ('base', 'expanded800', 'Итог против исходной базы')]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_json(path, default=None):
    path = Path(path)
    return json.loads(path.read_text()) if path.is_file() else default


def jsonl(path):
    return [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]


def load_grade():
    # compare.py imports only common.py and stdlib; do not execute its CLI main.
    sys.path.insert(0, str(ROOT))
    spec = importlib.util.spec_from_file_location('lumen_v2_frozen_compare', ROOT / 'compare.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.grade


def semantic_index(review):
    """Accept parent review as arms->{arm}->{items:[id,...]} or arms->{arm}:[...]."""
    result = {}
    container = review.get('arms', {}) if isinstance(review, dict) else {}
    aliases = {'eval-base': 'base', 'before': 'base', 'eval-v1': 'v1', 'eval-clean200': 'clean200',
               'eval-expanded200': 'expanded200', 'eval-expanded800': 'expanded800'}
    for key, value in container.items():
        key = aliases.get(key, key)
        rows = value.get('items', []) if isinstance(value, dict) else value
        if isinstance(rows, list):
            result[key] = {row['id']: row for row in rows if isinstance(row, dict) and 'id' in row}
    return result


def semantic_correct(row):
    for name in ['full_answer_correct', 'semantic_correct', 'fully_correct']:
        if isinstance(row.get(name), bool):
            return row[name]
    return row.get('classification') == 'correct'


def paired(left, right, ids):
    if left is None or right is None:
        return None
    cells = Counter(('both' if left[i] and right[i] else 'gain' if right[i] else
                     'loss' if left[i] else 'neither') for i in ids)
    return {'both': cells['both'], 'gain': cells['gain'], 'loss': cells['loss'],
            'neither': cells['neither'], 'net': cells['gain'] - cells['loss'], 'total': len(ids)}


def track_jobs():
    rows = []
    for path in sorted((ROOT / '.control/jobs').glob('*.json')):
        try:
            job = read_json(path, {})
        except (ValueError, OSError):
            continue  # Snapshot raced a live manager write; never infer that job completed.
        pid = job.get('pid')
        live = False
        if isinstance(pid, int) and pid > 1 and job.get('birth'):
            probe = subprocess.run(['ps', '-p', str(pid), '-o', 'lstart='], capture_output=True, text=True)
            live = probe.returncode == 0 and probe.stdout.strip() == job['birth'].strip()
        rows.append({'id': job.get('id', path.stem), 'stage': job.get('stage', ''),
                     'state': job.get('state', ''), 'pid': pid, 'verified_alive': live,
                     'exit_code': job.get('exit_code')})
    return rows


def resource_rows():
    out = []
    for path in sorted((RUNS / 'resources').glob('*.json')):
        try:
            obj = read_json(path, {})
        except (ValueError, OSError):
            out.append({'file': str(path.relative_to(ROOT)), 'stage': path.stem, 'status': 'writing'})
            continue
        if not isinstance(obj, dict) or 'stage' not in obj:
            continue
        out.append({'file': str(path.relative_to(ROOT)), 'sha256': sha(path),
                    'stage': obj.get('stage'), 'status': obj.get('status'),
                    'wall_seconds': obj.get('wall_seconds'),
                    'peak_footprint_bytes': obj.get('peak_footprint_bytes'),
                    'max_swap_growth_bytes': obj.get('max_swap_growth_bytes'),
                    'observed_pressure_levels': obj.get('observed_pressure_levels', []),
                    'child_exit_code': obj.get('child_exit_code'),
                    'guard_exit_code': obj.get('guard_exit_code'),
                    'reason': obj.get('reason')})
    return out


def collect():
    freeze = read_json(ROOT / 'freeze.json', {})
    frozen_files = freeze.get('files', {})
    mismatches = []
    for relative, expected in frozen_files.items():
        file = ROOT / relative
        if not file.is_file() or sha(file) != expected:
            mismatches.append(relative)
    freeze_check = {'manifest_present': bool(frozen_files), 'checked': len(frozen_files),
                    'passed': bool(frozen_files) and not mismatches, 'mismatches': mismatches}
    if 'compare.py' in mismatches:
        raise ValueError('Frozen compare.py changed: refusing to execute a different grader.')
    grade = load_grade()
    test_path = ROOT / 'seeds/test.jsonl'
    frozen_exam = test_path.is_file()
    if not frozen_exam:
        test_path = ROOT / 'evaluation-draft/new-test.jsonl'
    tests = jsonl(test_path) if test_path.is_file() else []
    ids = [t['id'] for t in tests]
    warnings = []
    if not freeze_check['passed']:
        warnings.append('Проверка freeze не пройдена: ' + (', '.join(mismatches) if mismatches else 'нет манифеста.'))
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate exam IDs: refusing to generate a misleading report.')
    categories = Counter(t.get('category', 'other') for t in tests)
    exam_hash = sha(test_path) if test_path.is_file() else None
    if not frozen_exam:
        warnings.append('Пока используется проект экзамена; окончательный seeds/test.jsonl ещё не найден.')
    if categories != Counter({k: n for k, (_, n) in CATEGORIES.items()}):
        warnings.append('Состав экзамена отличается от запланированных 30/24/6; проверить протокол.')
    review_path = RUNS / 'semantic-review.json'
    try:
        review = read_json(review_path, {})
    except (ValueError, OSError):
        review = {}  # A live optional review is not a complete semantic result.
    semantic = semantic_index(review)
    for key, value in review.get('arms', {}).items():
        raw_path = RUNS / ('eval-' + key + '.jsonl')
        if isinstance(value, dict) and value.get('file_sha256') and raw_path.is_file() and value['file_sha256'] != sha(raw_path):
            semantic.pop(key, None)
            warnings.append('Raw hash не совпал с разбором: ' + key)
    if review.get('exam_sha256') and review['exam_sha256'] != exam_hash:
        warnings.append('Разбор агента относится к другому hash экзамена; его баллы не используются.')
        semantic = {}
    arms, valid_meta = {}, None
    fingerprints = {'exam': {'path': str(test_path.relative_to(ROOT)) if test_path.exists() else '',
                             'sha256': exam_hash}}
    for key, label, detail, train_n, steps in ARMS:
        path = RUNS / ('eval-' + key + '.jsonl')
        arm = {'key': key, 'label': label, 'detail': detail, 'train_n': train_n, 'steps': steps,
               'file': str(path.relative_to(ROOT)), 'status': 'pending', 'received': 0,
               'total': len(tests), 'meta': None, 'rows': {}, 'strict': None,
               'semantic': None, 'valid_json': None, 'categories': {}, 'issues': []}
        if path.is_file():
            raw_rows = []
            streaming = False
            lines = [line for line in path.read_text().splitlines() if line.strip()]
            for index, line in enumerate(lines):
                try:
                    raw_rows.append(json.loads(line))
                except ValueError:
                    if index == len(lines) - 1:
                        streaming = True
                    else:
                        arm['issues'].append('Повреждённая строка JSONL до конца файла.')
            meta = raw_rows[0].get('meta') if raw_rows else None
            rows = raw_rows[1:]
            rid = [row.get('id') for row in rows]
            arm.update(received=len(rows), meta=meta)
            if not isinstance(meta, dict):
                arm['issues'].append('Первая строка не содержит metadata.')
            if len(rid) != len(set(rid)):
                arm['issues'].append('Есть повторяющиеся ID ответов.')
            if set(rid) - set(ids):
                arm['issues'].append('Есть ответы на вопросы за пределами текущего экзамена.')
            for row in rows:
                if not isinstance(row.get('raw'), str):
                    arm['issues'].append('raw должен быть строкой.')
            if meta and meta.get('exam_sha256') != exam_hash:
                arm['issues'].append('Hash экзамена не совпадает с seeds/test.jsonl.')
            if meta and meta.get('closed_book') is not True:
                arm['issues'].append('Ветка должна быть closed book.')
            complete = not streaming and len(rows) == len(tests) == 60 and set(rid) == set(ids)
            if complete and meta and not arm['issues']:
                if valid_meta is None:
                    valid_meta = meta
                mismatched = [k for k in METADATA_KEYS if meta.get(k) != valid_meta.get(k)]
                if mismatched:
                    arm['issues'].append('Сравнение metadata не прошло: ' + ', '.join(mismatched))
            if key == 'base' and meta and meta.get('adapter') is not None:
                arm['issues'].append('У базовой ветки неожиданно указан адаптер.')
            if key != 'base' and meta and not meta.get('adapter'):
                arm['issues'].append('У обученной ветки не указан адаптер.')
            arm['rows'] = {row['id']: row for row in rows if row.get('id') in ids and isinstance(row.get('raw'), str)}
            if arm['issues']:
                arm['status'] = 'incompatible'
            elif complete:
                arm['status'] = 'complete'
                passed = {t['id']: bool(grade(arm['rows'][t['id']]['raw'], t['gold'])) for t in tests}
                arm['strict_by_id'] = passed
                arm['strict'] = sum(passed.values())
                valid = 0
                for row in arm['rows'].values():
                    try:
                        obj = json.loads(row['raw'])
                        valid += int(isinstance(obj, dict))
                    except (ValueError, TypeError):
                        pass
                arm['valid_json'] = valid
                srows = semantic.get(key, {})
                if set(srows) == set(ids):
                    spassed = {i: semantic_correct(srows[i]) for i in ids}
                    arm['semantic_by_id'] = spassed
                    arm['semantic'] = sum(spassed.values())
                for cat, (name, _) in CATEGORIES.items():
                    subset = [t['id'] for t in tests if t.get('category') == cat]
                    arm['categories'][cat] = {'label': name, 'total': len(subset),
                                              'strict': sum(passed[i] for i in subset),
                                              'semantic': sum(arm['semantic_by_id'][i] for i in subset)
                                              if 'semantic_by_id' in arm else None}
            else:
                arm['status'] = 'partial'
            arm['sha256'] = sha(path)
            fingerprints[key] = {'path': str(path.relative_to(ROOT)), 'sha256': arm['sha256']}
        arms[key] = arm
    if any(a['status'] == 'incompatible' for a in arms.values()):
        warnings.append('Есть несовместимая ветка; её итог не показан как сопоставимый результат.')
    protocols = []
    for path in sorted(ROOT.glob('*.json')):
        if any(word in path.name.lower() for word in ['protocol', 'freeze']):
            protocols.append({'path': path.name, 'sha256': sha(path), 'data': read_json(path)})
    jobs = track_jobs()
    resources = resource_rows()
    all_complete = frozen_exam and len(tests) == 60 and all(a['status'] == 'complete' for a in arms.values())
    # Final acceptance also requires the independent semantic review of all arms.
    all_reviewed = all(a['semantic'] is not None for a in arms.values())
    status = 'complete' if all_complete and all_reviewed and not warnings else 'draft'
    paired_rows = []
    for left, right, label in PAIRINGS:
        aa, bb = arms[left], arms[right]
        paired_rows.append({'left': left, 'right': right, 'label': label,
                            'strict': paired(aa.get('strict_by_id'), bb.get('strict_by_id'), ids),
                            'semantic': paired(aa.get('semantic_by_id'), bb.get('semantic_by_id'), ids)})
    source = ROOT / 'source-handbook.txt'
    if source.is_file():
        fingerprints['source'] = {'path': source.name, 'sha256': sha(source)}
    if review_path.is_file():
        fingerprints['semantic_review'] = {'path': str(review_path.relative_to(ROOT)), 'sha256': sha(review_path)}
    clean_audit_path = ROOT / 'clean-data-draft/clean-format-audit.json'
    clean_audit = read_json(clean_audit_path, {})
    if clean_audit_path.is_file():
        fingerprints['clean_audit'] = {'path': str(clean_audit_path.relative_to(ROOT)), 'sha256': sha(clean_audit_path)}
    model = read_json(ROOT / 'model-lock.json', {})
    train_path = ROOT / 'seeds/train.jsonl'
    training = jsonl(train_path) if train_path.is_file() else []
    choices = [
        ('Факт', lambda t: 'F13' in t.get('evidence', []) and len(t.get('evidence', [])) == 1),
        ('Сочетание правил', lambda t: all(f in t.get('evidence', []) for f in ['F05', 'F09', 'F10'])),
        ('Честная неизвестность', lambda t: t.get('gold', {}).get('status') == 'unknown' and t.get('category') != 'original-clean'),
    ]
    training_examples = []
    for label, predicate in choices:
        row = next((t for t in training if predicate(t)), None)
        if row:
            training_examples.append({'label': label, 'item': row})
    result = {'schema': 1, 'created_at_utc': datetime.now(timezone.utc).isoformat(), 'status': status,
              'frozen_exam': frozen_exam, 'test_path': str(test_path.relative_to(ROOT)) if test_path.exists() else '',
              'exam_sha256': exam_hash, 'categories': dict(categories), 'total': len(tests),
              'tests': tests, 'training_examples': training_examples, 'arms': arms, 'paired': paired_rows, 'warnings': warnings,
              'protocols': protocols, 'freeze_check': freeze_check, 'resources': resources, 'jobs': jobs,
              'active_verified_jobs': sum(j['verified_alive'] for j in jobs),
              'semantic_review': review, 'semantic_by_arm': semantic,
              'clean_audit': clean_audit, 'recall_summary': read_json(RUNS / 'training-recall-summary.json', {}), 'recall_semantic': read_json(RUNS / 'training-recall-semantic.json', {}), 'final_integrity': read_json(RUNS / 'final-integrity.json', {}), 'resource_lifecycle_review': read_json(RUNS / 'resource-lifecycle-review.json', {}), 'fingerprints': fingerprints,
              'model': {'repo': model.get('repo'), 'revision': model.get('revision')}}
    return result


def embed_asset(path, mime):
    path = Path(path)
    if not path.is_file():
        return ''
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()


def angle(data):
    a = data['arms']
    if data['status'] != 'complete':
        return 'ЛЮМЕН V2 — результаты ещё не завершены. Не использовать как итоговый сюжет.\n'
    lines = ['ЛЮМЕН V2 — ДАННЫЕ ИСПРАВИЛИ, ПЕРЕНОС НЕ УЛУЧШИЛИ', '',
             'Угол для короткого ролика: понятные обучающие объяснения и больше примеров сами по себе не гарантируют полезного усвоения.', '',
             'Основной результат на одних и тех же 60 новых задачах:']
    for key, label, _, _, _ in ARMS:
        lines.append(f'{label}: полностью верных {a[key]["semantic"]}/60; совпадение полей {a[key]["strict"]}/60.')
    lines += ['', 'Ход рассказа:',
              '1. Сохранили старую LoRA как контроль. Её заново проверили на том же новом экзамене, что и все остальные варианты.',
              '2. В чистой ветке сохранили 60/12 вопросов и все настройки. Изменили только 72 gold.answer: вместо вложенного JSON написали естественные объяснения. Полностью верных ответов стало 3/60 против 16/60 у старого адаптера.',
              '3. Расширили материал до 300/24 и отдельно уточнили два старых вопроса об абонементах. Это комплексное изменение данных, не чистая проверка одного объёма.',
              '4. Заранее выбрали шаги 200 и 800 одной траектории. Они дали 7/60 и 6/60 полных решений. По экзамену параметры не подбирали.',
              '5. После основного теста спросили expanded800 точные первые 30 вопросов из train: поля совпали 21/30, полные ответы — 19/30. На новых атомарных формулировках — 4/30. Это отдельная post-hoc диагностика виденных примеров, не новый held-out успех. Исходную базу на этих точных 30 вопросах не запускали; причинный эффект обучения ими не установлен.',
              '6. Префиксы запроса совпали с обучающими во всех 30 диагностических случаях. Такое несовпадение здесь не объяснило провал; причины слабого переноса не установлены.',
              '7. Название Люмен уже дано в SYSTEM. Его правильное повторение не доказывает обучение весов; все 60 основных вопросов и scoring оставлены неизменными.', '',
              'Вывод: в этой конфигурации модель частично воспроизводит виденные вопросы, но улучшения переноса против прежней LoRA не добились. Это не доказательство невозможности LoRA или обучения малых моделей вообще.',
              'Оговорка: экзамен создан после известных результатов v1, но до запусков v2. Это локальная заранее отложенная проверка, а не внешний benchmark. Все оценки смысла агентные, без человеческой валидации.', '']
    return '\n'.join(lines)


def render(data):
    brand_dir = V1_ROOT / 'runs/video/dist/assets'
    logo = embed_asset(brand_dir / 'tengu-wordmark-horizontal.svg', 'image/svg+xml')
    manrope = embed_asset(brand_dir / 'fonts/manrope-cyrillic.woff2', 'font/woff2')
    manrope_latin = embed_asset(brand_dir / 'fonts/manrope-latin.woff2', 'font/woff2')
    data_json = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    doc = TEMPLATE.replace('__REPORT_DATA__', data_json).replace('__LOGO__', logo)
    doc = doc.replace('__FONT_CYRILLIC__', manrope).replace('__FONT_LATIN__', manrope_latin)
    license_path = V1_ROOT / 'runs/video/licenses/Manrope-OFL.txt'
    license_text = license_path.read_text() if license_path.is_file() else ''
    license_json = json.dumps({'font': 'Manrope', 'license': license_text}, ensure_ascii=False).replace('<', '\\u003c')
    return doc.replace('__FONT_LICENSE_JSON__', license_json)


TEMPLATE = r'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TENGU · Люмен V2 — что изменили данные</title>
<style>
@font-face{font-family:Manrope;src:url('__FONT_CYRILLIC__') format('woff2');font-weight:200 800;unicode-range:U+0400-052F,U+2DE0-2DFF,U+A640-A69F,U+1C80-1C8F;font-display:swap}@font-face{font-family:Manrope;src:url('__FONT_LATIN__') format('woff2');font-weight:200 800;font-display:swap}
:root{--paper:#f0e7d5;--white:#fffaf0;--ink:#11110f;--red:#c92f20;--muted:#5a5a50;--line:#c9bfae;--green:#2c6652;--indigo:#1d3342}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Manrope,system-ui,sans-serif}button,select,input{font:inherit}a{color:inherit;text-underline-offset:4px}button{cursor:pointer}header,main,footer{max-width:1280px;padding:25px 4vw;margin:auto}header{display:flex;justify-content:space-between;align-items:center;gap:28px;border-bottom:1px solid var(--line)}.logo{width:175px;height:auto;display:block}.brand-fallback{font-weight:800;font-size:24px;letter-spacing:.15em}nav{display:flex;gap:18px;flex-wrap:wrap;font-size:12px}.eyebrow{font:12px/1.5 ui-monospace,monospace;letter-spacing:.1em;color:var(--red);text-transform:uppercase;margin:0 0 18px}h1{font-size:clamp(38px,5.4vw,70px);font-weight:750;line-height:1.08;letter-spacing:-.055em;max-width:1000px;margin:0}h2{font-size:clamp(27px,3.2vw,42px);font-weight:700;line-height:1.18;letter-spacing:-.035em;margin:0 0 20px}h3{font-size:20px;line-height:1.3;margin:0 0 12px}p{margin:0 0 16px}section{padding:38px 0;border-bottom:1px solid var(--line)}.hero{padding-top:30px}.lead{font-size:20px;color:var(--muted);max-width:970px;margin:24px 0}.muted,.small{color:var(--muted)}.small{font-size:12px;line-height:1.65}.pill{display:inline-block;padding:5px 9px;border:1px solid var(--line);font-size:12px}.pill.ready{border-color:var(--green);color:var(--green)}.warning{padding:15px 18px;border-left:3px solid var(--red);background:#f2d8c8;font-size:14px;margin:18px 0}.score-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:26px 0 15px}.score{min-width:0;border:1px solid var(--line);background:var(--white);padding:18px 16px}.score h3{font-size:16px;min-height:42px}.score strong{font-size:44px;line-height:1.2;display:block;letter-spacing:-.05em}.score .detail{font-size:11px;line-height:1.5;display:block;margin:10px 0;color:var(--muted)}.score .meta{font-size:11px;color:var(--muted)}.score:last-child{border-top:3px solid var(--red)}.metric-controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:20px 0;font-size:13px}select,input{min-width:0;max-width:100%;border:1px solid var(--line);padding:10px 12px;background:var(--white);color:var(--ink)}button{border:1px solid var(--line);background:var(--white);color:var(--ink);padding:9px 13px}button:disabled{opacity:.4;cursor:default}.scroll-table{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:12px 10px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:11px;color:var(--muted);font-weight:600}td.num{font-variant-numeric:tabular-nums;white-space:nowrap}.positive{color:var(--green)}.negative{color:var(--red)}.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}.method{padding:22px;background:var(--white);border-top:2px solid var(--ink);min-width:0}.method ul{padding-left:18px;margin:10px 0}.method li{margin:8px 0;font-size:14px}pre{font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.code-pair{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:22px 0}.code-pair>div{padding:18px;background:var(--white);border:1px solid var(--line);min-width:0}.code-pair span{font-size:11px;display:block;color:var(--red);margin-bottom:10px}.filters{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:20px 0}.filters label{font-size:12px}.question-picker{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.question-picker select{flex:1;min-width:200px}.question-title{font-size:23px;line-height:1.45;margin:24px 0 18px;max-width:1100px}.expected{background:#e0e5d9;padding:16px 18px;margin:18px 0;overflow-wrap:anywhere;font-size:14px}.raw-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,285px),1fr));gap:15px}.raw-card{background:var(--white);border:1px solid var(--line);padding:18px;min-width:0}.raw-card h3{font-size:17px}.raw-card pre{margin:13px 0;font-size:11px}.badge{font-size:11px;padding:4px 7px;display:inline-block;background:#edd4c8;color:#8a3328;margin:5px 0}.badge.pass{background:#dce9dc;color:var(--green)}.badge.pending{background:#e5e1d6;color:var(--muted)}.review-note{font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:12px;margin-top:12px}details{padding:14px 18px;border:1px solid var(--line);margin:12px 0}summary{font-weight:650;cursor:pointer;font-size:14px}details p,details pre{margin-top:14px}.limits{font-size:14px;line-height:1.75;padding-left:20px}.limits li{margin:9px 0}.process{display:flex;gap:18px;flex-wrap:wrap}.process>div{background:var(--white);border:1px solid var(--line);padding:18px;flex:1;min-width:200px}.process strong{display:block;font-size:26px;margin-bottom:5px}.path{overflow-wrap:anywhere;font:12px/1.7 ui-monospace,monospace}.links{display:flex;flex-wrap:wrap;gap:15px;font-size:13px;margin-top:20px}.outcome{border-left:4px solid var(--red);padding:8px 0 8px 22px;font-size:20px;max-width:1050px;margin-top:24px}.sources-list{font-size:12px}.bar{height:4px;background:#ded7ca;margin-top:6px;max-width:100px}.bar i{display:block;height:4px;background:var(--red)}footer{font-size:12px;color:var(--muted)}:focus-visible{outline:3px solid var(--red);outline-offset:3px}
.hero>.eyebrow{display:inline-block;margin:0 15px 12px 0}.hero>.pill{vertical-align:middle}.hero h1{font-size:clamp(38px,4.2vw,60px);margin-top:16px!important}.hero .lead{font-size:18px;line-height:1.5;margin:18px 0 14px}.hero .metric-controls{margin:12px 0}.hero .metric-controls select{padding:7px 10px;font-size:12px}.score-grid{margin-top:18px;gap:10px}.score{padding:14px}.score h3{font-size:15px;min-height:30px;margin-bottom:8px}.score strong{font-size:40px}.score .detail{font-size:10px;margin:7px 0}header{padding-top:18px;padding-bottom:18px}
@media(max-width:1000px){.score-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.score strong{font-size:42px}}@media(max-width:700px){header{align-items:flex-start;flex-direction:column;gap:15px}.two,.code-pair{grid-template-columns:1fr}.score-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.score h3{min-height:0}.lead{font-size:18px}.hero{padding-top:24px}.question-title{font-size:20px}.filters>*{width:100%}.filters input,.filters select{width:100%}.question-picker select{order:-1;width:100%;flex-basis:100%}.metric-controls select{max-width:100%}}@media(max-width:420px){header,main,footer{padding-left:20px;padding-right:20px}.score-grid{gap:9px}.score{padding:14px 12px}.score strong{font-size:37px}h1{font-size:38px}.logo{width:155px}nav{gap:13px}.process>div{min-width:100%}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body>
<header><div><img class="logo" src="__LOGO__" alt="TENGU — практический ИИ для людей"></div><nav><a href="#comparison">Результаты</a><a href="#data">Что исправили</a><a href="#answers">Все ответы</a><a href="#resources">Ресурсы</a><a href="#cleanup">Cleanup</a></nav></header>
<main><section class="hero" id="top"><p class="eyebrow">Люмен · контролируемый повтор · локально на Mac</p><span class="pill" id="status">Загрузка отчёта</span><h1 style="margin-top:20px">Данные исправили.<br>Прежнюю LoRA не улучшили.</h1><p class="lead">Повторили опыт с естественными объяснениями и набором из 300 QA. На общем экзамене новые адаптеры не обошли прежний. Ниже — фактические ответы, исправленные данные и замеры этого запуска.</p><div id="warnings"></div>
<div class="metric-controls"><label for="metric">Счёт:</label><select id="metric"><option value="strict">Совпадение полей по эталону</option><option value="semantic">Полностью верный ответ по разбору агента</option></select><span class="small" id="metricHelp"></span></div><div class="score-grid" id="scores"></div><p class="small">Старые восемь вопросов остаются историей первого запуска. Здесь все пять веток получают одинаковые 60 новых вопросов; числа X/60 не сравниваются напрямую с прежними 0/8.</p><p class="outcome" id="outcome">Ожидаются фактические ответы.</p></section>

<section id="comparison"><p class="eyebrow">Одни вопросы · разные изменения</p><h2>Какие задачи стали получаться?</h2><div class="scroll-table"><table><thead id="categoryHead"></thead><tbody id="categoryRows"></tbody></table></div><h3 style="margin-top:30px">Парные изменения на тех же 60 задачах</h3><p class="small">«Новые верные» — было неверно, стало верно. «Потерянные» — было верно, стало неверно. Это описательные счёты, без утверждения статистической значимости.</p><div class="scroll-table"><table><thead><tr><th>Сравнение</th><th>Новые верные</th><th>Потерянные</th><th>Верны в обоих</th><th>Неверны в обоих</th><th>Чистый сдвиг</th></tr></thead><tbody id="pairedRows"></tbody></table></div></section>

<section id="recall"><p class="eyebrow">Отдельная диагностика после основного экзамена</p><h2>Повторили точные обучающие вопросы</h2><div class="two"><article class="score"><h3>Точные вопросы из train · expanded800</h3><strong id="recallFull">— / 30</strong><p class="small" id="recallStrict"></p><p class="small">Уже виденные обучающие вопросы. Это post-hoc диагностика; в основной счёт из 60 она не входит.</p></article><article class="score"><h3>Новые формулировки тех же атомарных правил</h3><strong id="freshAtomic">— / 30</strong><p class="small">Атомарная часть основного экзамена, полностью верные ответы expanded800 по разбору агента.</p></article></div><p class="outcome">Адаптер воспроизвёл 19 из 30 виденных примеров. Исходную базу на этих точных вопросах не проверяли; приобретение новых знаний этой диагностикой не доказано.</p><details><summary>Что ещё проверили в диагностике</summary><p class="small" id="recallPrompt"></p><p class="small">Название «Люмен» уже присутствует в SYSTEM, включая соответствующий вопрос train. Эта диагностика не доказывает общую способность учиться по книгам и не устанавливает причину слабого переноса.</p><div class="links"><a href="training-recall.jsonl">Все 30 raw-ответов</a><a href="training-recall-semantic.json">Разбор диагностики</a><a href="training-recall-summary.json">Префикс и loss</a></div></details></section>
<section id="data"><p class="eyebrow">Проверяем предположения по отдельности</p><h2>Сначала цель ответа, затем набор</h2><div class="code-pair"><div><span>ПРЕЖНЯЯ ЦЕЛЬ · JSON ВНУТРИ СТРОКИ ANSWER</span><pre>{"status":"known",
 "answer":"{\"amount\":24,\"currency\":\"EUR\"}",
 "data":{"amount":24,"currency":"EUR"}}</pre></div><div><span>ИСПРАВЛЕННАЯ ЦЕЛЬ · ЕСТЕСТВЕННОЕ ОБЪЯСНЕНИЕ</span><pre>{"status":"known",
 "answer":"Абонемент «Искра» стоит 24 евро.",
 "data":{"amount":24,"currency":"EUR"}}</pre></div></div><p class="small">Иллюстрация изменения поля answer. Все числа в примере — из учебного справочника; это не выход модели.</p>
<div class="two"><article class="method"><h3>Чистая ветка · 60 / 12</h3><ul><li>Переписаны только 72 поля gold.answer естественными объяснениями.</li><li>Сохранены вопросы, ID, порядок, схемы, status, data и evidence.</li><li>Те же 200 шагов, learning rate, batch, rank и последние четыре блока.</li><li>Это изменение обучающего содержания ответа, а не только пробелов или сериализации.</li></ul><p class="small" id="cleanInvariant">Инварианты сверяются по сохранённому аудиту.</p></article><article class="method"><h3>Расширенная ветка · 300 / 24</h3><ul><li>Добавлены формулировки, сочетания правил и естественные объяснения.</li><li>Два унаследованных вопроса об абонементах уточнены: владелец, остаток посещений и место.</li><li>Шаги 200 и 800 принадлежат одной заранее выбранной траектории; были оценены после завершения обучения.</li><li>Объём, разнообразие и уточнения меняются вместе. Эта ветка не изолирует только число примеров.</li></ul></article></div>
<details><summary>Три реальных примера из расширенного train</summary><p class="small">Это обучающие эталоны из сохранённого набора, а не ответы модели после обучения.</p><div id="trainingExamples"></div></details><h3 style="margin-top:28px">Скачать исправленный материал</h3><p class="small">Это реальные файлы, использованные в повторе. Чистая ветка сохраняет исходные вопросы; расширенная добавляет примеры и уточнения.</p><div class="two"><article class="method"><h3>Контролируемая правка · 60 / 12</h3><div class="links"><a href="../seeds-clean/train.jsonl" download>Train · 60 QA</a><a href="../seeds-clean/valid.jsonl" download>Validation · 12 QA</a></div></article><article class="method"><h3>Расширенный набор · 300 / 24</h3><div class="links"><a href="../seeds/train.jsonl" download>Train · 300 QA</a><a href="../seeds/valid.jsonl" download>Validation · 24 QA</a></div></article></div><div class="links"><a href="../seeds/test.jsonl" download>Общий экзамен · 60</a><a href="../DATA-CHANGES.txt" download>Что изменено в данных</a><a href="../label-oracle-audit.json" download>Проверка эталонов</a><a href="../source-handbook.txt" download>Исходный справочник</a></div>
<details><summary>Как отложили новый экзамен</summary><p>30 атомарных вопросов покрывают 30 правил; 24 составных проверяют их сочетания; 6 требуют честно признать отсутствие сведений. Название «Люмен» уже присутствует в неизменном SYSTEM, поэтому успех v2-a01 сам по себе не доказывает усвоение знания в весах. Формулировки, часть чисел и темы неизвестности удержаны от нового обучения. Нужные факты присутствуют в train.</p><p>Экзамен написан после известных результатов v1, но до запусков v2. Это заранее отложенная проверка повтора, а не независимый внешний benchmark. В чистой ветке унаследованные неоднозначности сохранены ради изоляции изменения answer. В расширенной они исправлены отдельно.</p><p class="path" id="examHash"></p></details></section>

<section id="answers"><p class="eyebrow">Проверить самостоятельно</p><h2>Все вопросы и неизменённые ответы</h2><div class="filters"><label>Категория <select id="category"><option value="all">Все 60</option><option value="atomic">Факты · 30</option><option value="composition">Сочетания · 24</option><option value="unknown">Нет сведений · 6</option></select></label><label>Поиск <input id="query" type="search" placeholder="ID, слово или число"></label><span class="small" id="filteredCount"></span></div><div class="question-picker"><button id="previous" type="button" aria-label="Предыдущий вопрос">←</button><select id="questionSelect" aria-label="Выбрать контрольный вопрос"></select><button id="next" type="button" aria-label="Следующий вопрос">→</button></div><p class="question-title" id="questionText"></p><div class="expected" id="expected"></div><div class="raw-grid" id="rawAnswers"></div><p class="small" style="margin-top:18px">Raw выводится без исправлений. Совпадение числовых полей ещё не подтверждает правильность объяснения. Разбор выполнен агентом; это не человеческая валидация.</p></section>

<section id="resources"><p class="eyebrow">Фактические замеры</p><h2>Время, память и давление macOS</h2><div class="scroll-table"><table><thead><tr><th>Этап</th><th>Время</th><th>Пик footprint, ГиБ</th><th>Рост swap, МиБ</th><th>Pressure</th><th>Состояние</th></tr></thead><tbody id="resourcesRows"></tbody></table></div><p class="small">Guard наблюдает физический footprint дерева процессов раз в секунду. Это дискретный пик, а не вся память системы. 1 ГиБ = 2³⁰ байт; внутренний MLX peak в десятичных GB — другая метрика. Прирост swap 0 не означает, что системный swap до запуска был пуст.</p></section>

<section id="cleanup"><p class="eyebrow">Процессы и завершение работы</p><h2>Что осталось после проверки</h2><div class="process"><div><strong id="activeJobs">—</strong><span>подтверждённых процессов из журнала эксперимента</span></div><div><strong id="completedArms">—</strong><span>полных веток экзамена</span></div><div><strong>Cleanup отдельно</strong><span>результаты сохраняются до просмотра</span></div></div><p class="path" id="rootPath" style="margin-top:20px"></p><p class="small" id="finalLifecycle"></p><p class="small">Проверка PID сопоставляет время старта процесса с журналом. Удаление здесь не запускается. Папка v2 использует зависимости и базу из v1; это заимствованные файлы, а не отдельные копии v2. Полную очистку общего окружения проводят отдельно после сохранения результатов v1 и v2. Локальный сервер просмотра может работать отдельно от GPU-этапов.</p><h3 style="margin-top:25px">Cleanup через агента</h3><p class="small">Сначала проверяется внешняя копия результатов v1/v2 и четырёх небольших адаптеров. Базовые веса, окружение и кеши в экспорт не входят. Оркестратор может работать вне реестра manage.py, поэтому нулевого счётчика PID из журнала недостаточно.</p><div class="expected" id="cleanupPrompt">Заверши cleanup локального эксперимента «Люмен». Сначала проверь сохранённый внешний экспорт: отчёты v1 и v2, все raw-ответы, исправленные данные, эталоны, протоколы, замеры и небольшие выбранные адаптеры v2/adapters/{v1,clean200,expanded200,expanded800}. Сверь файлы и хеши; экспорт должен оставаться доступным после удаления рабочей папки. Прочитай runs/resource-lifecycle-review.json в v2 и убедись, что оркестратор вне реестра manage.py уже завершился. Останови только подтверждённые процессы и серверы этого эксперимента. Для родительской рабочей папки /Users/vladimirdemidov/development/vlogging/lumen-local-pilot сначала выполни manage.py cleanup в режиме dry-run, затем cleanup --apply --expect-id 10cc942d-fd1d-4042-b33b-404efa0196f9. Сохрани внешний экспорт и выбранные адаптеры. Проверь отсутствие рабочей папки и процессов эксперимента, покажи фактически освобождённое место.</div><button id="copyCleanup" type="button">Скопировать промпт cleanup</button><details><summary>Финальный аудит и ранний снимок жизненного цикла</summary><pre id="lifecycleText"></pre></details>
<details><summary>Журнал этапов</summary><div class="scroll-table"><table><thead><tr><th>Этап</th><th>Запись</th><th>PID подтверждён</th><th>Код</th></tr></thead><tbody id="jobsRows"></tbody></table></div></details></section>

<section id="limits"><p class="eyebrow">Граница вывода</p><h2>Что показал этот повтор</h2><ul class="limits"><li>Все пять вариантов сравнили на одних и тех же 60 задачах. Исправленные данные и дополнительные шаги не повысили результат против прежней LoRA.</li><li>Сравнение прежней LoRA и clean200 выделяет изменение обучающего answer. Расширенная ветка меняет несколько свойств данных вместе.</li><li>Один seed, один вымышленный справочник и 60 задач не дают общего вывода о любых книгах, моделях или LoRA.</li><li>В SYSTEM уже назван кинотеатр «Люмен». Ответ на v2-a01 доступен из контекста; его успех не является доказательством нового знания в весах. Вопрос остаётся в неизменном счёте из 60, без исключения после просмотра результатов. Остальные атомарные вопросы тоже нельзя автоматически называть чистым тестом памяти весов; исходная база служит парным контролем.</li><li>Все checkpoint и шаги выбраны заранее; выбирать лучший по увиденному экзамену или менять этот экзамен после генерации нельзя.</li><li>Общие способности и их возможная регрессия здесь отдельно не измеряются. Факт, формат, объяснение и честное воздержание читаются раздельно.</li></ul><details><summary>Протокол, freeze и первичные артефакты</summary><p class="small" id="modelInfo"></p><pre id="protocolText"></pre><p class="small" style="margin-top:15px">Хеши входных и выходных файлов:</p><pre id="fingerprintText"></pre></details><div class="links"><a href="report-data.json">Все данные отчёта JSON</a><a href="semantic-review.json">Разбор ответов</a><a href="../../../runs/report.html">Первый запуск · только история</a><a href="video-angle.txt">Короткий сюжет для видео</a></div></section></main>
<footer><span id="timestamp"></span> · TENGU · локальный отчёт · публикация не выполнялась</footer>
<script type="application/json" id="fontLicense">__FONT_LICENSE_JSON__</script>
<script type="application/json" id="reportData">__REPORT_DATA__</script>
<script>
'use strict';
const D=JSON.parse(document.getElementById('reportData').textContent),$=s=>document.querySelector(s);
const KEYS=['base','v1','clean200','expanded200','expanded800'];
const CATS={atomic:'Факты',composition:'Сочетания правил',unknown:'Нет сведений'};
let metric=KEYS.every(k=>D.arms[k].semantic!==null)?'semantic':'strict',selectedId=D.tests[0]?.id||null,filtered=D.tests;
const text=(tag,content,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=content;return e;};
const number=x=>x===null||x===undefined?'—':String(x);
const statusLabels={pending:'Ожидается',partial:'Выполняется',incompatible:'Не сопоставимо',complete:'Завершено',completed:'Завершено',writing:'Замер выполняется',protective_stop:'Защитная остановка'};
const armValue=(key,m=metric)=>D.arms[key][m];
const signed=x=>x>0?'+'+x:String(x);
function renderScores(){
 const box=$('#scores');box.replaceChildren();
 KEYS.forEach(key=>{const a=D.arms[key],card=text('article','', 'score');card.dataset.arm=key;card.append(text('h3',a.label),text('strong',a.status==='complete'?number(armValue(key))+'/'+D.total:(a.status==='partial'?a.received+'/'+D.total:'—')));card.append(text('span',a.detail,'detail'));let note=a.status==='complete'?(metric==='strict'?'по полям эталона':a.semantic===null?'разбор ещё не готов':'полностью верных ответов'):statusLabels[a.status];card.append(text('span',note,'meta'));box.append(card);});
 $('#metricHelp').textContent=metric==='strict'?'Статус, непустой answer и все поля data.':'Факты, объяснение и отсутствие противоречий. Агентная проверка.';
 const head=$('#categoryHead');head.replaceChildren();const hr=document.createElement('tr');hr.append(text('th','Категория'));KEYS.forEach(k=>hr.append(text('th',D.arms[k].label)));head.append(hr);
 const rows=$('#categoryRows');rows.replaceChildren();
 Object.entries(CATS).forEach(([cat,label])=>{const tr=document.createElement('tr');tr.append(text('td',label+' · '+(D.categories[cat]||0)));KEYS.forEach(k=>{const c=D.arms[k].categories[cat],n=c?.[metric];const td=text('td',c?number(n)+'/'+c.total:'—','num');if(c&&n!==null){const bar=text('div','','bar'),i=document.createElement('i');i.style.width=(n/c.total*100)+'%';bar.append(i);td.append(bar);}tr.append(td);});rows.append(tr);});
 const pp=$('#pairedRows');pp.replaceChildren();D.paired.forEach(p=>{const tr=document.createElement('tr');tr.append(text('td',p.label));const v=p[metric];['gain','loss','both','neither','net'].forEach(k=>tr.append(text('td',v?(k==='net'?signed(v[k]):String(v[k])):'—','num')));pp.append(tr);});
 renderOutcome();
}
function renderOutcome(){
 const done=KEYS.every(k=>D.arms[k].status==='complete');
 if(!done){$('#outcome').textContent='Часть веток ещё не завершена. Итоговые сравнения появятся после полного общего экзамена.';return;}
 const v=KEYS.map(k=>D.arms[k][metric]);
 if(v.some(n=>n===null)){$('#outcome').textContent='Автоматические поля уже проверены; содержательный разбор всех ответов ещё не завершён.';return;}
 $('#outcome').textContent='На одних и тех же '+D.total+' задачах: база '+v[0]+', прежняя LoRA '+v[1]+', чистые ответы '+v[2]+', расширенный набор на шаге 200 — '+v[3]+', на шаге 800 — '+v[4]+'.';
}
function refilter(){
 const category=$('#category').value,q=$('#query').value.trim().toLocaleLowerCase('ru');
 filtered=D.tests.filter(t=>(category==='all'||t.category===category)&&(!q||(t.id+' '+t.question).toLocaleLowerCase('ru').includes(q)));
 if(!filtered.some(t=>t.id===selectedId))selectedId=filtered[0]?.id||null;
 const s=$('#questionSelect');s.replaceChildren();filtered.forEach(t=>{const o=text('option',t.id+' · '+t.question);o.value=t.id;s.append(o);});s.value=selectedId||'';
 $('#filteredCount').textContent=filtered.length+' из '+D.total;showQuestion();
}
function showQuestion(){
 const t=D.tests.find(x=>x.id===selectedId),box=$('#rawAnswers');box.replaceChildren();
 const at=filtered.findIndex(x=>x.id===selectedId);$('#previous').disabled=at<=0;$('#next').disabled=at<0||at>=filtered.length-1;
 if(!t){$('#questionText').textContent='Нет вопросов по этому фильтру.';$('#expected').textContent='';return;}
 $('#questionText').textContent=t.id+' · '+t.question;
 $('#expected').textContent='Эталон: '+t.gold.answer+'\nstatus='+t.gold.status+'; data='+JSON.stringify(t.gold.data)+(t.id==='v2-a01'?' · Название уже дано в SYSTEM; успех не доказывает обучение весов.':'');
 KEYS.forEach(key=>{const a=D.arms[key],r=a.rows[t.id],card=text('article','','raw-card');card.dataset.arm=key;card.append(text('h3',a.label));if(!r){card.append(text('span',statusLabels[a.status]||'Ожидается','badge pending'));box.append(card);return;}
  const ok=a.strict_by_id?.[t.id];card.append(text('span',ok===undefined?'Итог ещё не проверен':ok?'Поля совпали':'Поля не совпали','badge'+(ok?' pass':'')));
  card.append(text('p',typeof r.seconds==='number'?r.seconds.toFixed(2)+' с':'Время не записано','small'));
  card.append(text('pre',r.raw));
  const sr=D.semantic_by_arm[key]?.[t.id],note=sr?(sr.note_ru||sr.note||sr.reason||sr.comment||'Нет текстового пояснения.'):'Содержательный разбор ещё не готов.';
  const n=text('p',note,'review-note');if(sr){const explicit=['full_answer_correct','semantic_correct','fully_correct'].map(k=>sr[k]).find(v=>typeof v==='boolean');const correct=explicit===undefined?sr.classification==='correct':explicit;const b=text('b',correct?'Полный ответ верен. ':'Полный ответ не засчитан. ');n.prepend(b);}card.append(n);box.append(card);
 });
}
function renderResources(){const out=$('#resourcesRows');out.replaceChildren();if(!D.resources.length){const tr=document.createElement('tr'),td=text('td','Замеры ещё не сохранены.');td.colSpan=6;tr.append(td);out.append(tr);return;}D.resources.forEach(r=>{const tr=document.createElement('tr');const p=r.observed_pressure_levels||[];const labels={'calibration':'Ресурсная проба · 20 шагов','train-clean':'Чистый набор · 200 шагов','train-expanded':'Расширенный набор · 800 шагов','eval-base':'Экзамен · база','eval-v1':'Экзамен · прежняя LoRA','eval-clean200':'Экзамен · чистый набор','eval-expanded200':'Экзамен · шаг 200','eval-expanded800':'Экзамен · шаг 800'};const values=[labels[r.stage]||r.stage,typeof r.wall_seconds==='number'?r.wall_seconds.toFixed(1)+' с':'—',typeof r.peak_footprint_bytes==='number'?(r.peak_footprint_bytes/2**30).toFixed(2):'—',typeof r.max_swap_growth_bytes==='number'?(r.max_swap_growth_bytes/2**20).toFixed(0):'—',p.length?p.join(', '):'—',statusLabels[r.status]||r.status||'—'];values.forEach(v=>tr.append(text('td',v)));out.append(tr);});}
function init(){
 const ready=D.status==='complete';$('#status').textContent=ready?'Все пять веток и разбор завершены':'Рабочий отчёт · результаты дополняются';$('#status').classList.toggle('ready',ready);
 D.warnings.forEach(w=>$('#warnings').append(text('div',w,'warning')));
 const issues=KEYS.flatMap(k=>D.arms[k].issues.map(x=>D.arms[k].label+': '+x));issues.forEach(w=>$('#warnings').append(text('div',w,'warning')));
 $('#examHash').textContent=D.test_path+'\nSHA-256: '+(D.exam_sha256||'ещё нет');
 const trainBox=$('#trainingExamples');for(const sample of D.training_examples||[]){const card=text('article','','method');card.style.marginTop='12px';card.append(text('span',sample.label+' · '+sample.item.id,'eyebrow'),text('p',sample.item.question),text('p',sample.item.gold.answer),text('pre','status='+sample.item.gold.status+'; data='+JSON.stringify(sample.item.gold.data)));trainBox.append(card);}
 const audit=D.clean_audit;
 $('#cleanInvariant').textContent=audit.invariants_passed===true?'Аудит инвариантов пройден: остальные поля и порядок сохранены.':'Финальный аудит инвариантов ещё не подтверждён.';
 $('#activeJobs').textContent=D.active_verified_jobs;$('#completedArms').textContent=KEYS.filter(k=>D.arms[k].status==='complete').length+'/5';$('#rootPath').textContent='Рабочая папка: '+D.root;
 const jobs=$('#jobsRows');D.jobs.forEach(j=>{const tr=document.createElement('tr');[j.stage,j.state,j.verified_alive?'Да · '+j.pid:'Нет',number(j.exit_code)].forEach(v=>tr.append(text('td',v)));jobs.append(tr);});
 const fin=D.final_integrity||{},rec=D.recall_summary||{},rs=D.recall_semantic||{};
 $('#finalLifecycle').textContent=fin.orchestrator_exited===true?'Финальный аудит: оркестратор завершён; процессов обучения и инференса — '+fin.training_and_inference_jobs_running+'. Отдельно остаётся сервер первого отчёта. Cleanup не выполнялся. Логический размер общего runtime на момент аудита — '+(fin.runtime_logical_file_bytes_at_audit/2**30).toFixed(2)+' ГиБ; это не измеренное освобождение SSD.':'Завершение оркестратора ещё не подтверждено финальным аудитом.';
 $('#recallFull').textContent=number(rs.full_correct)+' / '+(rs.count||rec.count||30);$('#recallStrict').textContent='По одному лишь status/data совпали '+number(rec.strict_training_recall)+'/'+(rec.count||30)+'. Объяснения проверены отдельно агентом.';$('#freshAtomic').textContent=number(D.arms.expanded800.categories.atomic?.semantic)+' / 30';$('#recallPrompt').textContent='Префикс инференса совпал с обучающим во всех '+(rec.count||30)+' случаях: '+(rec.all_inference_prefixes_match_training===true?'да':'не подтверждено')+'. Teacher-forced loss на верном продолжении: '+(typeof rec.token_weighted_teacher_forced_loss==='number'?rec.token_weighted_teacher_forced_loss.toFixed(4):'—')+'. Несовпадения шаблона в этих 30 случаях не нашли; это не доказывает отсутствие всех других проблем.';
 $('#lifecycleText').textContent=JSON.stringify({final_audit:D.final_integrity,earlier_snapshot:D.resource_lifecycle_review},null,2);
 $('#copyCleanup').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#cleanupPrompt').textContent);$('#copyCleanup').textContent='Скопировано';}catch{const range=document.createRange();range.selectNodeContents($('#cleanupPrompt'));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);$('#copyCleanup').textContent='Текст выделен — скопируй';}});
 $('#protocolText').textContent=JSON.stringify({freeze_check:D.freeze_check,protocols:D.protocols},null,2);$('#fingerprintText').textContent=JSON.stringify(D.fingerprints,null,2);$('#modelInfo').textContent=[D.model.repo,D.model.revision].filter(Boolean).join(' · ');
 $('#timestamp').textContent='Снимок '+new Date(D.created_at_utc).toLocaleString('ru-RU',{timeZone:'Europe/Berlin'})+' (Берлин)';
 $('#metric').value=metric;$('#metric').addEventListener('change',e=>{metric=e.target.value;renderScores();});$('#category').addEventListener('change',refilter);$('#query').addEventListener('input',refilter);$('#questionSelect').addEventListener('change',e=>{selectedId=e.target.value;showQuestion();});
 for(const [id,delta] of [['previous',-1],['next',1]])$(id.startsWith('#')?id:'#'+id).addEventListener('click',()=>{const n=filtered.findIndex(t=>t.id===selectedId)+delta;if(filtered[n]){selectedId=filtered[n].id;$('#questionSelect').value=selectedId;showQuestion();}});
 renderScores();refilter();renderResources();
}
init();
</script></body></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-complete', action='store_true', help='Refuse final output until all five arms and semantic review are complete.')
    args = parser.parse_args()
    data = collect()
    data['root'] = str(ROOT)
    if args.require_complete and data['status'] != 'complete':
        raise SystemExit('Report is still draft: finish compatible runs and all semantic reviews first.')
    (RUNS / 'report-data.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    (RUNS / 'report.html').write_text(render(data))
    (RUNS / 'video-angle.txt').write_text(angle(data))
    print(json.dumps({'status': data['status'], 'exam': data['total'], 'arms': {k: {'status': a['status'], 'strict': a['strict'], 'semantic': a['semantic']} for k, a in data['arms'].items()}}, ensure_ascii=False))
    print('Saved runs/report.html, report-data.json, video-angle.txt')


if __name__ == '__main__':
    main()
