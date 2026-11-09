"""Audit generated labels against the handbook's small deterministic rule system."""
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path
from common import ROOT, read_jsonl, dump_json, sha


def main():
    splits = {s: read_jsonl(ROOT / 'expanded-data-draft' / (s + '.jsonl')) for s in ['train', 'valid']}
    checked = Counter()
    for split, rows in splits.items():
        for row in rows:
            g, o = row['gold'], row.get('oracle')
            assert row['fields']
            if not o:
                continue  # Cleaned originals are separately audited by invariant/source checks.
            d = g['data']
            if o['kind'] == 'ticket':
                n, day, prem = o['n'], o['day'], o['premiere']
                assert str(n) + ' зрителей' in row['question']
                discount = not prem and day <= 4 and n >= 5
                base = Decimal(17 if prem else 14 if day >= 5 else 11)
                expected = Decimal(n) * base * (Decimal('0.8') if discount else Decimal(1))
                assert Decimal(str(d['amount'])) == expected
                if 'group_discount' in d:
                    assert d['group_discount'] is discount
            elif o['kind'] == 'refund':
                paid, h = Decimal(str(o['paid'])), Decimal(str(o['hours']))
                if o['premiere']:
                    rate = Decimal(1) if h >= 24 else Decimal(0)
                elif h >= 6:
                    rate = Decimal(1)
                elif h >= 2:
                    rate = Decimal('0.5')
                else:
                    rate = Decimal(0)
                assert Decimal(str(d['amount'])) == paid * rate
            elif o['kind'] == 'pass':
                assert 'осталось хотя бы одно посещение' in row['question']
                within_days = o['elapsed'] <= (21 if o['name'] == 'Искра' else 40)
                weekday_ok = o['name'] == 'Туман' or o['day'] in [0, 1, 2, 3]
                expected = bool(within_days and weekday_ok and o['owner'] and not o['used'])
                assert d == {'passes_valid': expected}
            elif o['kind'] == 'capacity':
                assert d['halls'] == [name for name, seats in [('Сумрак', 18), ('Астра', 32)] if seats >= o['n']]
            elif o['kind'] == 'unknown':
                assert g['status'] == 'unknown' and d == {}
                assert 'нет сведений' in g['answer']
            else:
                raise AssertionError(o['kind'])
            checked[o['kind']] += 1
    report = {'source_sha256': sha(ROOT / 'source-handbook.txt'),
              'counts': {s: len(v) for s, v in splits.items()},
              'oracle_checked_records': dict(checked),
              'source_rules': 'F03/04 capacities18/32; F05–12 prices11/14/17, group>=5 and20% weekdays ordinary only; F15–24 pass ownership/days/daily limit/expiry with positive remaining; F25–29 refund thresholds2/6/24',
              'uses_model_judging': False,
              'files': {s: sha(ROOT / 'expanded-data-draft' / (s + '.jsonl')) for s in splits}}
    dump_json(ROOT / 'label-oracle-audit.json', report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
