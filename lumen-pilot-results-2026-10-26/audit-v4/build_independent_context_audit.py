"""Read-only audit of retained v3 outputs; writes only this new audit directory."""
from __future__ import annotations
import ast, collections, datetime, hashlib, json, math
from pathlib import Path

OUT = Path(__file__).resolve().parent
ARCHIVE = OUT.parent
V3 = ARCHIVE / 'v3'
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def readj(p): return json.loads(Path(p).read_text())
def jsonl(p): return [json.loads(s) for s in Path(p).read_text().splitlines() if s.strip()]
def dump(name, x): (OUT / name).write_text(json.dumps(x, ensure_ascii=False, indent=2)+'\n')

inputs = ['manifest.json','v3/runs/context.jsonl','v3/seeds/test.jsonl','v3/source-handbook.txt','v3/runs/semantic-review.json','v3/common.py','v3/compare.py','v3/run_eval.py','v3/protocol.json','v3/model-lock.json','v3/preflight.json']
before = {p:sha(ARCHIVE/p) for p in inputs}
rows_list = jsonl(V3/'runs/context.jsonl')
meta = rows_list[0]['meta']
rows = {x['id']:x for x in rows_list[1:]}
tests = jsonl(V3/'seeds/test.jsonl')
hist = readj(V3/'runs/semantic-review.json')
historical = {x['id']:x for x in hist['items']}
assert len(rows_list)==61 and len(rows)==len(tests)==60
assert set(rows)=={x['id'] for x in tests}
assert before['v3/runs/context.jsonl']==hist['file_sha256']
assert before['v3/seeds/test.jsonl']==meta['exam_sha256']==hist['exam_sha256']
assert before['v3/source-handbook.txt']==meta['source_in_context_sha256']==hist['source_sha256']
# Execute only the two pure grader functions from the retained source, without importing model code.
grader_ast=ast.parse((V3/'compare.py').read_text())
ns={'json':json,'math':math}
for n in grader_ast.body:
    if isinstance(n,ast.FunctionDef) and n.name in ('equal','grade'):
        exec(compile(ast.Module(body=[n],type_ignores=[]),str(V3/'compare.py'),'exec'),ns)

# Labels are the independent agent's manual review of all raw strings, questions and F01-F30.
# The primary category describes the observed failure, not its unobserved internal cause.
# c23 passes the existing truthful-answer criterion, with a separate explanation-quality caveat.
L = {}
def add(id,primary,note,tags=(),content=None,prose=None,borderline=False):
    L[id]={'primary_observed_category':primary,'tags':list(tags),'note_ru':note,
           'content_only_correct': primary in ('correct','json_only','status_fields_only_correct_content') if content is None else content,
           'answer_text_only_correct': primary in ('correct','json_only','status_fields_only_correct_content') if prose is None else prose,
           'borderline_explanation':borderline}
C='correct';J='json_only';S='status_fields_only_correct_content';A='unsupported_abstention';F='wrong_fact_rule';R='calculation_application'
add('v2-a01',J,'Название и data верны по F01, но один лишний завершающий ``` делает весь raw невалидным JSON. Название уже есть в SYSTEM.',['invalid_json','trailing_fence','system_provides_answer'])
add('v2-a02',C,'Код NFR-27 верен по F02; текст и поле согласованы.')
add('v2-a03',C,'18 мест в «Сумраке» верны по F03.')
add('v2-a04',C,'32 места в «Астре» верны по F04.')
add('v2-a05',C,'11 EUR в будни верны по F05. Опечатка «пятницень» смысл не меняет.',['minor_language_error'])
add('v2-a06',F,'Цена 14 EUR верна по F06, но первая фраза ложно отрицает наличие этой цены в источнике; затем та же цена приводится. Нельзя считать только ошибкой status.',['wrong_status','internal_contradiction','false_source_absence_claim','correct_core_fact_present'])
add('v2-a07',C,'17 евро верны по F07. Euro и EUR семантически обозначают одну валюту; требование именно EUR явно не дано в prompt.',['strict_string_false_negative'])
add('v2-a08',A,'Отказ вместо явно данного порога 5 человек по F08.',['false_source_absence_claim'])
add('v2-a09',A,'Отказ вместо явно данных 20% по F09.',['false_insufficient_information_claim'])
add('v2-a10',S,'Правильные дни понедельник–пятница по F10; status unknown противоречит известному ответу. Диапазон строкой эквивалентен эталону.',['wrong_status','noncanonical_equivalent_string'])
add('v2-a11',C,'Запрет скидки на премьеру верен по F11.')
add('v2-a12',S,'Текст и false верны по F12, неверен только status unknown.',['wrong_status'])
add('v2-a13',A,'Отказ вместо явно данной цены «Искры» 24 евро по F13.',['false_source_absence_claim'])
add('v2-a14',C,'Три посещения верны по F14; языковая шероховатость не меняет смысл.',['minor_language_error'])
add('v2-a15',C,'Понедельник–четверг верно по F15; строка диапазона эквивалентна эталону.',['strict_string_false_negative'])
add('v2-a16',S,'21 календарный день с активацией верен по F16; неверен status unknown.',['wrong_status'])
add('v2-a17',C,'Запрет передачи посещения верен по F17.')
add('v2-a18',A,'Отказ вместо цены «Тумана» 44 евро по F18. Дополнительно null-поля нарушают unknown => data={}.',['false_source_absence_claim','unknown_nonempty_data','null_fields'])
add('v2-a19',A,'Текст отказывается извлечь 5 посещений из F19, а data.visits=0 добавляет неверное число. Основной наблюдаемый тип — отказ при явном факте.',['false_source_absence_claim','wrong_numeric_field','unknown_nonempty_data'])
add('v2-a20',C,'Все дни недели верны по F20; естественная строка эквивалентна эталону.',['strict_string_false_negative'])
add('v2-a21',C,'40 календарных дней с включением активации верны по F21.')
add('v2-a22',A,'Отрицание существования правила передачи противоречит F22. Правильный false не делает весь ответ правильным.',['false_source_absence_claim','correct_field_wrong_explanation','unknown_nonempty_data'])
add('v2-a23',A,'Отказ вместо суточного лимита 1 по F23.',['false_source_absence_claim'])
add('v2-a24',C,'Запрет обоих абонементов на премьеры верен по F24.')
add('v2-a25',F,'На интервале >=6 часов положена доля 1 по F25, а не 0,5. Ошибка есть в тексте и data.',['wrong_refund_rule'])
add('v2-a26',A,'Для заданного интервала 2<=t<6 достаточен F26. Требование календарной даты/точного времени не нужно.',['false_insufficient_information_claim'])
add('v2-a27',A,'Отказ вместо прямо указанного нулевого возврата при t<2 по F27.',['false_source_absence_claim'])
add('v2-a28',F,'Первая фраза верно цитирует полный возврат по F28, но затем отрицается заданная доля, выдумывается правило по умолчанию и data=0. Это содержательное противоречие.',['correct_core_fact_present','false_source_absence_claim','wrong_numeric_field','internal_contradiction'])
add('v2-a29',F,'Для премьеры менее чем за 24 часа F29 требует 0, а не половину.',['wrong_refund_rule'])
add('v2-a30',C,'Имя Сол Мерн верно по F30.')
add('v2-c01',C,'Верно применены F05/F08/F09/F10: 12×11×0,8=105,6 EUR.')
add('v2-c02',R,'121 EUR — верное умножение без обязательной скидки. Нужно 11×11×0,8=96,8 EUR. Арифметика умножения сама по себе не сломана.',['omitted_applicable_discount'])
add('v2-c03',C,'13×14=182 EUR верно, скидка в воскресенье не положена по F10.')
add('v2-c04',A,'При явных F07/F11/F24 отказано в цене/ограничениях. Нужны 238 EUR, false, false.',['false_source_absence_claim','unknown_nonempty_data','null_fields'])
add('v2-c05',R,'Для 6ч15м нужен полный возврат 8,8 по F25. Перепутаны интервалы и номера правил; 8,8−1,76 ошибочно записано 6,04, итоговые суммы противоречат друг другу.',['wrong_interval','wrong_rule_citation','arithmetic_error','internal_contradiction'])
add('v2-c06',R,'Проза верно говорит о половине по F26, но итоговое amount=8,8 не равен половине 8,8 (4,4). Нельзя объявить только синтаксической ошибкой поля: числовое содержание противоречит прозе.',['correct_prose_wrong_numeric_field','internal_contradiction'],prose=True)
add('v2-c07',R,'1ч59м попадает под F27: 0. Применена половина и получено 7 вместо 0.',['wrong_interval','wrong_refund_rule'])
add('v2-c08',C,'Половина 11=5,5 EUR для 5ч30м верна по F26.')
add('v2-c09',R,'24ч30м для премьеры требует полного возврата 17 по F28, а не 8,5.',['wrong_interval','wrong_refund_rule'])
add('v2-c10',R,'При 23ч30м F29 требует 0. Цитируется нулевой возврат, но выдуманы 85% и сумма 14,45.',['invented_percentage','internal_contradiction','wrong_refund_rule'])
add('v2-c11',C,'«Астра» — верный минимальный подходящий зал для 23 человек по F03/F04. Краткий ответ допустим.',['minimal_explanation'])
add('v2-c12',A,'Отказ от выбора зала с ложным заявлением, будто вместимости отсутствуют. F03/F04 дают «Астру» для 31 человека.',['false_source_absence_claim','unknown_nonempty_data'])
add('v2-c13',C,'27>18, fits=false верно по F03; задача явно только о вместимости.')
add('v2-c14',S,'Лимит одного посещения в день правильно применён по F23, covers_both=false верно; status unknown неверен. Передача здесь лишняя, но правило истинно.',['wrong_status','irrelevant_true_rule'])
add('v2-c15',C,'Итоговый запрет верен: дневной лимит уже исчерпан по F23. Вставка об условии места двусмысленна, но заключение прямо применяет дневной запрет.',['awkward_intermediate_condition'])
add('v2-c16',C,'Передача именной «Искры» от Марины Льву запрещена по F17. Остальные условия не отменяют запрет.')
add('v2-c17',F,'Флаг false совпал, но объяснение переворачивает F24: якобы «Туман» только для премьер и не для обычных посещений.',['correct_field_wrong_explanation','strict_false_positive'])
add('v2-c18',C,'Пятница исключена для «Искры» по F15; false верен.')
add('v2-c19',C,'Все заданные условия «Тумана» соблюдены, true верен; отсутствие развёрнутого вывода допустимо.',['minimal_explanation'])
add('v2-c20',R,'21-й включённый день и среда разрешены; нужен true. Ответ false, а заданная среда подменена четвергом. Сам срок цитируется верно.',['boundary_application_error','question_day_changed','irrelevant_true_rule'])
add('v2-c21',R,'22-й день выходит за срок 21 по F16. Ответ цитирует срок, но ошибочно разрешает проход.',['boundary_application_error','correct_rule_wrong_application'])
add('v2-c22',C,'40-й день включён, суббота для «Тумана» допустима; прочие условия соблюдены по F20/F21/F23/F24.')
add('v2-c23',C,'False и срок 40 дней верны: 41-й день вне срока. Объяснение ссылается преимущественно на непередачу, хотя идёт владелец. Не утверждается, что пришёл другой человек; при прежнем критерии правдивого краткого ответа pass допустим, но причинный вывод по номеру дня не показан.',['weak_relevant_justification','irrelevant_true_rule'],borderline=True)
add('v2-c24',R,'Нужны 15 именных «Искр» по 24=360 EUR. Ответ сравнивает фактически один день, подменяет цену абонемента 11, quantity=1 и противоречит собственному запрету скидки.',['multi_step_optimization_error','wrong_price_fact','wrong_quantity','internal_contradiction'])
for i,note in enumerate([
 'Парковочный тариф не дан; unknown/data={} корректны.',
 'Студенческая скидка не описана; unknown не подменён отрицанием скидки.',
 'Капучино и его цена не описаны; корректный отказ без выдуманной цены.',
 'Безбарьерный доступ не описан; нельзя утверждать наличие или отсутствие.',
 'Наличие гардероба неизвестно; «не указано наличие» не утверждает отсутствие.',
 'Детский тариф и возраст не описаны; корректный отказ без числа.'
],1): add(f'v2-u{i:02}',C,note,['appropriate_abstention'])
assert set(L)==set(rows)
items=[]
for t in tests:
    id=t['id'];r=rows[id];v=L[id]
    try: obj=json.loads(r['raw']); valid=True
    except json.JSONDecodeError: obj=None;valid=False
    strict=bool(ns['grade'](r['raw'],t['gold']))
    items.append({'id':id,'category':t['category'],'question':t['question'],'source_evidence':t['evidence'],
      'raw_sha256':hashlib.sha256(r['raw'].encode()).hexdigest(), 'raw_utf8_bytes':len(r['raw'].encode()),
      'historical_full_answer_correct':historical[id]['full_answer_correct'],'strict_fields_correct':strict,
      'json_valid':valid,'parsed_status':obj.get('status') if isinstance(obj,dict) else None,
      **v})
primary=dict(collections.Counter(x['primary_observed_category'] for x in items))
assert sum(primary.values())==60
content=sum(x['content_only_correct'] for x in items)
assert content==35
assert sum(x['historical_full_answer_correct'] for x in items)==30
assert sum(x['strict_fields_correct'] for x in items)==28
result={
 'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'reviewer_agent':'/root/video_draft','review_type':'independent_agent_review_of_all_60_raw_outputs',
 'human_validation':False,'independence_limits':'This agent did not produce the historical semantic labels. The prior labels were visible during this audit; this is not blinded human review.',
 'historical_result_unchanged':{'full_correct':30,'count':60,'strict_fields_correct':28},
 'input_sha256':before,
 'diagnostic_definitions':{
  'primary_observed_category':'Exactly one observed failure category per row. Not an identified internal/model/prompt cause; refusal takes priority if no usable answer is provided.',
  'content_only':'Ignore JSON packaging, known/unknown status and equivalent string representation; require substantively correct answer AND data, no material false fact or internal contradiction. Missing reasoning alone is allowed as in the historical concise-answer criterion.',
  'answer_text_only':'Diagnostic of answer prose alone, excluding status and data. Not a system success metric; c06 additionally qualifies but has a wrong numeric payload.',
  'borderline':'c23 is accepted only under the historical truthful concise-answer criterion; relevant reasoning is weak. Sensitivity count excluding it is not a replacement score or confidence interval.'
 },
 'summary':{
  'count':60,'json_valid':sum(x['json_valid'] for x in items),'primary_categories':primary,
  'content_only_correct':content,'content_only_sensitivity_excluding_c23':content-1,
  'answer_text_only_correct':sum(x['answer_text_only_correct'] for x in items),
  'content_only_by_category':{k:sum(x['content_only_correct'] for x in items if x['category']==k) for k in ['atomic','composition','unknown']},
  'historical_false_rows_with_only_contract_failure':[x['id'] for x in items if not x['historical_full_answer_correct'] and x['content_only_correct']],
  'material_content_failures_remaining':sum(not x['content_only_correct'] for x in items)
 },
 'limitations':[
  'One retained deterministic response per question cannot identify whether model size, quantization, prompt, language or decoding caused an error.',
  'No model was run, no counterfactual prompt or repair was evaluated; content-only is retrospective reclassification of the same outputs.',
  'All task-solving facts are present in the injected handbook; refusals here do not establish insufficient source information. They also do not establish that more training data cannot help.',
  'The same60 were already used in earlier arms; v3 is a post-hoc method comparison, not an untouched external benchmark.',
  'Cinema name is already in SYSTEM. The eight historical v1 questions are not compared with the60 denominator.',
  'No human validation. All judgments are agent-reviewed and may require adjudication.'
 ],
 'items':items}
dump('independent-context-review.json',result)
dump('input-sha256.json',before)
# Guard exact integrity of all specifically-read evidence and historical manifest.
after={p:sha(ARCHIVE/p) for p in inputs}
assert before==after
dump('audit-integrity.json',{'read_inputs_unchanged':True,'historical_manifest_unchanged':before['manifest.json']==after['manifest.json'],'files_verified':len(inputs),'input_sha256':after})
print(json.dumps(result['summary'],ensure_ascii=False,indent=2))
