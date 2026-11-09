"""Compare actual before/after output files. Does not run or call a language model."""
import argparse
import html
import json
import math
from pathlib import Path
from common import ROOT, read_jsonl, sha

def equal(actual, expected):
    if isinstance(expected, bool):
        return isinstance(actual, bool) and actual is expected
    if isinstance(expected, (int, float)):
        return isinstance(actual, (int, float)) and not isinstance(actual, bool) and math.isclose(actual, expected, abs_tol=1e-6)
    if isinstance(expected, str):
        return isinstance(actual, str) and actual.strip().casefold() == expected.strip().casefold()
    if isinstance(expected, dict):
        return isinstance(actual, dict) and set(actual) == set(expected) and all(equal(actual[k], v) for k, v in expected.items())
    return actual == expected

def grade(raw, gold):
    try:
        obj = json.loads(raw)
        return (isinstance(obj, dict) and obj.get('status') == gold['status'] and
                isinstance(obj.get('answer'), str) and bool(obj['answer'].strip()) and equal(obj.get('data'), gold['data']))
    except (ValueError, TypeError):
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--before', type=Path, required=True)
    parser.add_argument('--after', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=Path('runs/comparison.html'))
    args = parser.parse_args()
    a, b = read_jsonl(args.before), read_jsonl(args.after)
    ma, mb = a[0]['meta'], b[0]['meta']
    for key in ['model_fingerprint', 'system_sha256', 'exam_sha256', 'versions', 'decoding', 'closed_book']:
        if ma[key] != mb[key]:
            raise SystemExit('Incomparable runs; mismatch: ' + key)
    if ma['exam_sha256'] != sha(ROOT / 'seeds/test.jsonl'):
        raise SystemExit('Exam file changed after generation. Do not grade against a changed key.')
    if ma['adapter'] is not None or mb['adapter'] is None:
        raise SystemExit('Expected before without adapter and after with adapter.')
    tests = read_jsonl(ROOT / 'seeds/test.jsonl')
    aa, bb = {x['id']: x for x in a[1:]}, {x['id']: x for x in b[1:]}
    if set(aa) != {t['id'] for t in tests} or set(bb) != set(aa) or len(a) != len(tests)+1 or len(b) != len(tests)+1:
        raise SystemExit('Incomplete/duplicate exam results. Do not silently omit failed questions.')
    totals = [0, 0]
    rows = []
    for t in tests:
        ar, br = aa[t['id']], bb[t['id']]
        ok = [grade(ar['raw'], t['gold']), grade(br['raw'], t['gold'])]
        totals = [v + int(k) for v, k in zip(totals, ok)]
        cells = [html.escape(t['id'] + ': ' + t['question']),
                 '<pre>'+html.escape(json.dumps(t['gold'], ensure_ascii=False, indent=2))+'</pre>']
        for r, passed in zip([ar, br], ok):
            cells.append(('<b>Поля совпали</b>' if passed else '<b>Проверить ошибку / формат</b>') +
                         '<p>'+str(round(r['seconds'], 2))+' s</p><pre>'+html.escape(r['raw'])+'</pre>')
        rows.append('<tr>' + ''.join('<td>'+c+'</td>' for c in cells) + '</tr>')
    title = f'Мини-пилот: до {totals[0]}/{len(tests)}, после {totals[1]}/{len(tests)} по автоматической проверке полей'
    doc = '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Люмен — фактическое сравнение</title><style>body{font:15px/1.5 system-ui;margin:30px;background:#101724;color:#dce7f4}table{border-collapse:collapse;width:100%}td,th{border:1px solid #42536b;padding:14px;text-align:left;vertical-align:top}td{min-width:200px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}a{color:#70f5df}.scroll{overflow:auto}</style><h1>'+html.escape(title)+'</h1><p>Это 8 пробных вопросов, а не полный экзамен на 80 задач. Проверьте объяснения и ограничения вручную: совпадение числовых полей не гарантирует верность всей рекомендации. Невалидный JSON считается ошибкой формата и может скрывать содержательно верный ответ.</p><div class="scroll"><table><tr><th>Задача</th><th>Эталон</th><th>До</th><th>После</th></tr>'+''.join(rows)+'</table></div></html>'
    args.out.parent.mkdir(parents=True, exist_ok=True)
    if args.out.exists():
        raise SystemExit('Report already exists; choose another --out path.')
    args.out.write_text(doc)
    print(title)
    print('Saved', args.out)
    print('Manual review required. This mini-pilot does not establish the full success criterion.')

if __name__ == '__main__':
    main()
