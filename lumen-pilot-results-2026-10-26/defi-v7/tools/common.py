"""Shared prompt and file helpers for the proposed local pilot (no model imports)."""
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL = ROOT / "models/qwen3-4b-instruct-2507-4bit"
SYSTEM = ('Ты учебный помощник кинотеатра «Люмен». Отвечай по известным тебе правилам. '
          'Если сведений нет, признай это. Не используй общие предположения как правила кинотеатра. '
          'Верни только JSON с полями status (known или unknown), answer (краткое объяснение) '
          'и data (объект с запрошенными полями; пустой объект при unknown).')

def require_managed():
    if os.environ.get('LUMEN_EXPERIMENT_ROOT') != str(ROOT):
        raise SystemExit('Run this stage through manage.py exec so caches and processes stay scoped.')

def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def read_jsonl(path):
    return [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]

def dump_json(path, obj):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def user_message(item):
    fields = item.get('fields', {})
    suffix = '\nПоля объекта data (названия и типы): ' + json.dumps(fields, ensure_ascii=False)
    return item['question'] + suffix

def messages(item):
    # Deliberately exclude source text, gold answers, evidence and training examples.
    return [{'role': 'system', 'content': SYSTEM},
            {'role': 'user', 'content': user_message(item)}]

def verify_model():
    lock_path = ROOT / 'model-lock.json'
    if not lock_path.exists():
        raise SystemExit('Run download_model.py first.')
    lock = json.loads(lock_path.read_text())
    current = {str(p.relative_to(MODEL)) for p in MODEL.rglob('*')
               if p.is_file() and '.cache' not in p.relative_to(MODEL).parts}
    if current != set(lock['files']):
        raise SystemExit('Local model file set changed. Review before continuing.')
    for name, expected in lock['files'].items():
        file = MODEL / name
        if not file.exists() or sha(file) != expected:
            raise SystemExit('Model file changed or missing: ' + name)
    return sha(lock_path)
