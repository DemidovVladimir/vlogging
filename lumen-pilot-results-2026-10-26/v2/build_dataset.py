"""Deterministic source-grounded expansion. Never reads exam items or model outputs."""
import copy
import hashlib
import itertools
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PARAPHRASES = [
['Какое название носит учебный кинотеатр?', 'Назови кинотеатр из учебных правил.'],
['Укажи внутренний идентификатор справочника.', 'Как обозначен код регламента «Люмена»?'],
['Какова вместимость зала с названием «Сумрак»?', 'На сколько зрителей рассчитан зал «Сумрак»?'],
['Сколько кресел для зрителей в зале «Астра»?', 'На какое количество посетителей рассчитана «Астра»?'],
['Сколько евро стоит обычный билет с понедельника по пятницу?', 'Назови будничную цену одного обычного билета в «Люмене».'],
['Укажи цену одного обычного билета на субботу либо воскресенье.', 'Какой тариф обычного билета установлен на выходные?'],
['Назови цену одного билета на премьеру в «Люмене».', 'В какую сумму обойдётся один премьерный билет?'],
['С какого количества зрителей компания считается группой для скидки?', 'Сколько людей минимум должно прийти на один сеанс для группового тарифа?'],
['На сколько процентов снижается цена при групповой скидке?', 'Какой размер скидки положен подходящей группе?'],
['На какие дни недели распространяется скидка для группы?', 'Назови период недели, когда доступен групповой тариф.'],
['Допускается ли групповая скидка для билетов на премьеру?', 'Работает ли групповой тариф, если сеанс премьерный?'],
['Можно ли дополнительно получить скидку для группы при покупке абонементов?', 'Разрешено ли совместить групповую скидку с абонементом?'],
['Какова стоимость абонемента с названием «Искра»?', 'Во сколько евро обходится покупка «Искры»?'],
['На какое число посещений рассчитан абонемент «Искра»?', 'Сколько раз можно посетить кинотеатр по одной «Искре»?'],
['В какие дни недели принимают абонемент «Искра»?', 'Назови разрешённые дни посещения по «Искре».'],
['Сколько дней со включением даты активации действует «Искра»?', 'Какова длительность действия «Искры» в календарных днях?'],
['Разрешена ли передача посещений «Искры» приятелю?', 'Может ли другой человек воспользоваться посещением по моей «Искре»?'],
['Сколько евро нужно за абонемент «Туман»?', 'Какова стоимость покупки абонемента «Туман»?'],
['На сколько визитов рассчитан абонемент «Туман»?', 'Сколько сеансов входит в покупку «Тумана»?'],
['Какие дни недели допускаются для использования «Тумана»?', 'Когда в течение недели разрешён проход по «Туману»?'],
['Сколько календарных дней действует «Туман», если считать день активации?', 'Каков срок действия абонемента «Туман»?'],
['Может ли знакомый использовать посещение по моему «Туману»?', 'Разрешается передавать посещения «Тумана» другим людям?'],
['Какой суточный предел посещений установлен для каждого абонемента?', 'Сколько раз в день можно использовать один абонемент?'],
['Разрешён ли проход на премьерный сеанс по одному из абонементов?', 'Можно ли попасть на премьеру с «Искрой» или «Туманом»?'],
['Какая доля оплаты обычного билета возвращается, когда осталось минимум шесть часов?', 'Какова доля возврата обычного билета при обращении за шесть часов или раньше?'],
['Какую часть оплаты обычного билета вернут в интервале от двух часов включительно до шести не включая?', 'Возврат обычного билета за два или более часа, но менее шести: какая доля положена?'],
['Какова доля возврата обычного билета, когда осталось меньше двух часов?', 'Какую часть оплаты возвращают за обычный билет менее чем за два часа?'],
['Какую часть оплаты премьеры вернут, если осталось не меньше суток?', 'Какова доля возврата премьерного билета за 24 часа или раньше?'],
['Какова доля возврата премьеры менее чем за сутки до начала?', 'Какую часть стоимости премьерного билета вернут, если осталось меньше 24 часов?'],
['Назови имя учебного администратора.', 'Как зовут администратора из правил «Люмена»?'],
]


def read(path):
    return [json.loads(x) for x in path.read_text().splitlines() if x.strip()]


def write(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    assert not path.exists(), path
    path.write_text(''.join(json.dumps(x, ensure_ascii=False) + '\n' for x in rows))


def item(q, data, answer, evidence, category, oracle, status='known', fields=None):
    if fields is None:
        fields = {k: ('boolean' if isinstance(v, bool) else 'number' if isinstance(v, (int, float)) else 'array' if isinstance(v, list) else 'string') for k, v in data.items()}
    return {'question': q, 'fields': fields, 'gold': {'status': status, 'answer': answer, 'data': data},
            'evidence': evidence, 'category': category, 'oracle': oracle}


DAYS = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье']


def ticket(n, day, premiere, extra, prefix='Рассчитай по правилам «Люмена».'):
    group = not premiere and day < 5 and n >= 5
    unit = 17 if premiere else 11 if day < 5 else 14
    amount = round(n * unit * (0.8 if group else 1), 2)
    data = {'amount': amount, 'currency': 'EUR'}
    q = f'{prefix} {n} зрителей покупают разовые билеты на один {"премьерный" if premiere else "обычный"} сеанс в {DAYS[day]}. Места есть. Сколько заплатят вместе?'
    if extra:
        q += ' Применяется ли групповая скидка?'
        data['group_discount'] = group
    if premiere:
        explanation = f'Билет на премьеру стоит 17 евро, групповая скидка не применяется. {n} × 17 = {amount:g} евро.'
        evidence = ['F07', 'F11']
    elif day >= 5:
        explanation = f'В выходной обычный билет стоит 14 евро. Групповая скидка действует только в будни, поэтому {n} × 14 = {amount:g} евро.'
        evidence = ['F06', 'F10']
    elif group:
        explanation = f'Обычный будничный билет стоит 11 евро. Группа от пяти зрителей получает скидку 20%: {n} × 11 × 0,8 = {amount:g} евро.'
        evidence = ['F05', 'F08', 'F09', 'F10']
    else:
        explanation = f'Обычный будничный билет стоит 11 евро. Зрителей меньше пяти, групповой скидки нет: {n} × 11 = {amount:g} евро.'
        evidence = ['F05', 'F08']
    return item(q, data, explanation, evidence, 'tickets', {'kind': 'ticket', 'n': n, 'day': day, 'premiere': premiere})


def refund(paid, hours, premiere):
    fraction = (1 if hours >= 24 else 0) if premiere else (1 if hours >= 6 else 0.5 if hours >= 2 else 0)
    amount = paid * fraction
    if premiere:
        rule = 'За премьерный билет возвращают всю оплату за 24 часа или раньше; менее чем за 24 часа возврат нулевой.'
        ev = ['F28' if fraction else 'F29']
    else:
        rule = ('За обычный билет за шесть часов или раньше возвращают всю оплату.' if fraction == 1 else
                'За обычный билет от двух часов включительно до шести часов не включая возвращают половину оплаты.' if fraction == 0.5 else
                'Менее чем за два часа оплата обычного билета не возвращается.')
        ev = ['F25' if fraction == 1 else 'F26' if fraction == 0.5 else 'F27']
    q = f'Кассир «Люмена» оформляет возврат {"премьерного" if premiere else "обычного"} билета: уплачено {paid:g} евро, до начала {hours:g} ч. Какая сумма положена к возврату?'
    return item(q, {'amount': amount, 'currency': 'EUR'}, f'{rule} Сумма возврата: {paid:g} × {fraction:g} = {amount:g} евро.', ev, 'refund', {'kind': 'refund', 'paid': paid, 'hours': hours, 'premiere': premiere})


def passcase(name, day=1, elapsed=1, owner=True, used=False):
    limit = 21 if name == 'Искра' else 40
    allowed = owner and not used and elapsed <= limit and (name == 'Туман' or day < 4)
    terms = f'Владелец' if owner else 'Друг владельца'
    q = f'{terms} абонемента «{name}» хочет пройти на обычный сеанс в {DAYS[day]}. Места есть, на абонементе осталось хотя бы одно посещение. Сейчас {elapsed}-й календарный день, день активации считается первым; сегодня абонемент {"уже использован" if used else "ещё не использован"}. Разрешён проход по нему?'
    ev = ['F15' if name == 'Искра' else 'F20', 'F16' if name == 'Искра' else 'F21', 'F17' if name == 'Искра' else 'F22', 'F23']
    if not owner:
        explanation = f'«{name}» — именной абонемент. Друг владельца не может использовать его посещение.'
    elif used:
        explanation = f'По «{name}» допускается не более одного посещения в день. Сегодня лимит уже использован.'
    elif elapsed > limit:
        explanation = f'«{name}» действует {limit} календарных дней с включением активации. На {elapsed}-й день срок уже истёк.'
    elif name == 'Искра' and day >= 4:
        explanation = '«Искра» действует только с понедельника по четверг. Указанный день не подходит.'
    else:
        explanation = f'Проход допустим: «{name}» не просрочен, день недели разрешён, пришёл владелец и дневной лимит не использован.'
    return item(q, {'passes_valid': allowed}, explanation, ev, 'pass', {'kind': 'pass', 'name': name, 'day': day, 'elapsed': elapsed, 'owner': owner, 'used': used})


TOPICS = [
('car_rental_available', 'boolean', 'можно ли арендовать автомобиль у кинотеатра', 'прокате автомобилей'),
('overnight_stay_available', 'boolean', 'можно ли остаться ночевать в кинотеатре', 'проживании'),
('amount', 'number', 'какова стоимость порции попкорна', 'цене попкорна'),
('seats_available', 'boolean', 'есть ли места на ближайший сеанс прямо сейчас', 'текущей доступности сеансов'),
('rental_terms', 'string', 'какие условия частной аренды зала', 'частной аренде залов'),
('refund_policy', 'string', 'каковы условия возврата неиспользованного абонемента «Туман»', 'возврате абонементов'),
]
PREFIXES = ['Посетитель интересуется', 'Уточни по учебным правилам', 'Для ответа клиенту нужно выяснить', 'Вопрос по услугам «Люмена»', 'Нужны достоверные сведения', 'Сможешь сказать по правилам', 'Укажи, известно ли из регламента', 'Ответь на вопрос посетителя']


def unknown(topic, prefix):
    key, typ, q, about = topic
    fields = {key: typ}
    if key == 'amount':
        fields['currency'] = 'string'
    return item(f'{prefix}: {q}?', {}, f'В учебном справочнике нет сведений о {about}. Подтвердить или опровергнуть это по нему нельзя.', ['НЕОПИСАННЫЕ УСЛОВИЯ'], 'unknown', {'kind': 'unknown', 'topic': about}, status='unknown', fields=fields)


def main():
    clean = read(ROOT / 'clean-data-draft/clean-train.jsonl')
    valid = read(ROOT / 'clean-data-draft/clean-valid.jsonl')
    train = copy.deepcopy(clean)
    for r in train:
        r['category'] = 'original-clean'
        if r['id'] in ['train-a16', 'train-a17']:
            r['question'] += ' Пришёл владелец абонемента, осталось как минимум одно посещение. Свободное место есть.'
            r['category'] = 'clarified-original-pass'
    for j, choices in enumerate(PARAPHRASES):
        src = clean[j]
        assert src['id'] == f'train-f{j+1:02d}'
        for q in choices:
            row = copy.deepcopy(src)
            row['question'] = q
            row['category'] = 'atomic-paraphrase'
            train.append(row)
    rng = random.Random(20261026)
    buckets = [list(itertools.product(range(2, 11), range(5), [False])),
               list(itertools.product(range(1, 11), [5, 6], [False])),
               list(itertools.product(range(2, 11), range(7), [True]))]
    leftovers = []
    for bucket in buckets:
        rng.shuffle(bucket)
        selected = bucket[:20]
        assert len(selected) == 20
        train.extend(ticket(*t, extra=(i % 2 == 0)) for i, t in enumerate(selected))
        leftovers.extend(bucket[20:])
    times = [0, 1, 1.5, 2, 3, 6, 6.5, 8, 10, 24, 30, 48]
    train.extend(refund(paid, t, prem) for paid, prem in [(11, False), (14, False), (17, True)] for t in times)
    train.extend(passcase(name, day=d) for name in ['Искра', 'Туман'] for d in range(7))
    train.extend(passcase(name, elapsed=t) for name, ts in [('Искра', [2, 20, 23]), ('Туман', [2, 39, 42])] for t in ts)
    train.extend(passcase(name, owner=False) for name in ['Искра', 'Туман'])
    train.extend(passcase(name, used=True) for name in ['Искра', 'Туман'])
    for n in [2, 6, 12, 16, 18, 19, 20, 26, 28, 30, 32, 34]:
        halls = (['Сумрак', 'Астра'] if n <= 18 else ['Астра'] if n <= 32 else [])
        train.append(item(f'Компании из {n} человек нужен зал. Перечисли все залы «Люмена», подходящие по вместимости; наличие билетов проверять не нужно.', {'halls': halls}, f'«Сумрак» рассчитан на 18 человек, «Астра» — на 32. Для {n} человек подходят: {", ".join(halls) if halls else "ни один из залов"}.', ['F03', 'F04'], 'capacity', {'kind': 'capacity', 'n': n}))
    train.extend(unknown(topic, prefix) for topic in TOPICS for prefix in PREFIXES)
    # Extra validation examples use unused numerical scenarios, without examining test items.
    rng.shuffle(leftovers)
    valid.extend(ticket(*t, extra=(i % 2 == 0), prefix='Проверь расчёт для заявки в кассу.') for i, t in enumerate(leftovers[:8]))
    valid.extend(unknown(TOPICS[i], 'Помоги найти ответ в регламенте') for i in range(4))
    assert len(train) == 300 and len(valid) == 24, (len(train), len(valid))
    for split, rows in [('train', train), ('valid', valid)]:
        for i, row in enumerate(rows, 1):
            row['id'] = f'v2-{split}-{i:03d}'
        write(ROOT / 'expanded-data-draft' / (split + '.jsonl'), rows)
    seen = set()
    for row in train + valid:
        q = row['question'].strip().casefold()
        assert q not in seen, q
        seen.add(q)
        assert isinstance(row['gold']['answer'], str)
        try:
            json.loads(row['gold']['answer'])
        except ValueError:
            pass
        else:
            raise AssertionError('Nested JSON label')
    print('Expanded draft: 300 train /24 valid. No test file read. Deterministic rule-derived labels and natural explanations.')


if __name__ == '__main__':
    main()
