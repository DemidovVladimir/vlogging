"""Build a self-contained comparison, including actual cleanup receipt when available."""
import argparse
import datetime
import hashlib
import html
import json
import re
from pathlib import Path
from common import ROOT, read_jsonl, sha
from compare import grade


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--history',type=Path,default=ROOT.parent/'v2')
    args=parser.parse_args()
    history=args.history.resolve()
    tests=read_jsonl(ROOT/'seeds/test.jsonl')
    assert len(tests)==60
    freeze=json.loads((ROOT/'freeze.json').read_text())
    assert all(sha(ROOT/n)==v for n,v in freeze['files'].items())
    prior=json.loads((history/'runs/semantic-review.json').read_text())
    current=json.loads((ROOT/'runs/semantic-review.json').read_text())
    arms={}
    metadata=[]
    for key,label,path,review in [
        ('base','Без источника',history/'runs/eval-base.jsonl',prior['arms']['base']),
        ('lora','Прежняя LoRA',history/'runs/eval-v1.jsonl',prior['arms']['v1']),
        ('context','Справочник в контексте',ROOT/'runs/context.jsonl',current)]:
        rows=read_jsonl(path)
        assert len(rows)==61 and [r['id'] for r in rows[1:]]==[t['id'] for t in tests]
        assert review['file_sha256']==sha(path)
        assert [r['id'] for r in review['items']]==[t['id'] for t in tests]
        meta=rows[0]['meta']; metadata.append(meta)
        assert meta['exam_sha256']==sha(ROOT/'seeds/test.jsonl')
        arms[key]={'label':label,'meta':meta,'file_sha256':sha(path),'rows':{},'strict':0,'semantic':0,'categories':{}}
        for row,test,judged in zip(rows[1:],tests,review['items']):
            strict=bool(grade(row['raw'],test['gold']))
            semantic=judged['full_answer_correct']
            assert isinstance(semantic,bool)
            arms[key]['rows'][row['id']]={**row,'strict':strict,'semantic':semantic,'review':judged}
            arms[key]['strict']+=int(strict);arms[key]['semantic']+=int(semantic)
            category=arms[key]['categories'].setdefault(test['category'],{'strict':0,'semantic':0,'count':0})
            category['strict']+=int(strict);category['semantic']+=int(semantic);category['count']+=1
    for field in ['model_fingerprint','system_sha256','exam_sha256','versions','decoding']:
        assert len({json.dumps(m[field],sort_keys=True) for m in metadata})==1,field
    assert metadata[0]['closed_book'] and metadata[1]['closed_book']
    assert metadata[2]['closed_book'] is False and metadata[2]['adapter'] is None
    assert metadata[2]['source_in_context_sha256']==sha(ROOT/'source-handbook.txt')
    resource=json.loads((ROOT/'runs/resources/context-exam.json').read_text())
    assert resource['status']=='completed'
    preflight=json.loads((ROOT/'preflight.json').read_text())
    receipt_path=ROOT.parent/'cleanup-2026-10-26.json'
    receipt=json.loads(receipt_path.read_text()) if receipt_path.exists() else None
    source=(ROOT/'source-handbook.txt').read_text().split('ДЛЯ АВТОРА ЭКСПЕРИМЕНТА')[0]
    data={'tests':tests,'arms':arms,'resources':resource,'preflight':preflight,'cleanup':receipt,
          'protocol':json.loads((ROOT/'protocol.json').read_text()),'human_validation':False,
          'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'freeze_verified':len(freeze['files'])}
    (ROOT/'runs/report-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    oldhtml=(history/'runs/report.html').read_text()
    css=re.search(r'<style>(.*?)</style>',oldhtml,re.S).group(1)
    logo=re.search(r'<img class="logo"[^>]+>',oldhtml).group(0)
    css+='\n.score-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.score h3{min-height:25px}.score strong{font-size:54px}.raw-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero .lead{max-width:950px}.method{overflow-wrap:anywhere}summary{overflow-wrap:anywhere}.score .bar{max-width:none}@media(max-width:800px){.score-grid,.raw-grid,.two{grid-template-columns:1fr}}'
    score=arms['context']['semantic'];delta=score-arms['base']['semantic']
    heading='Источник помог. Надёжность ещё низкая.' if delta>0 else 'Источник не дал улучшения в этом прогоне.'
    cleanup_html='<p>Очистка ещё не завершена.</p>'
    if receipt:
        assert receipt['runtime_removed'] and receipt['owned_jobs_remaining']==0
        cleanup_html=f'<div class="process"><div><strong>0</strong><span>процессов обучения и инференса</span></div><div><strong>{receipt["logical_bytes_removed_estimate"]/2**30:.2f} ГиБ</strong><span>логический размер удалённого runtime</span></div><div><strong>{receipt["observed_free_disk_delta_bytes"]/2**30:.2f} ГиБ</strong><span>наблюдаемое изменение свободного места SSD</span></div></div><p style="margin-top:20px">Удалены общая рабочая папка, базовые веса, Python-окружение, кеши и временные файлы всех трёх запусков. Сервер отчётов остановлен. KS KB и Docker сохранены. Остался небольшой архив результатов; для этой страницы сервер не нужен.</p><details><summary>Квитанция очистки</summary><pre>{html.escape(json.dumps(receipt,ensure_ascii=False,indent=2))}</pre></details>'
    document='''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TENGU · Дать маленькой модели источник</title><style>__CSS__</style>
<header>__LOGO__<nav><a href="#results">Результат</a><a href="#answers">Ответы</a><a href="#method">Что проверили</a><a href="#cleanup">Cleanup</a></nav></header><main>
<section id="top" class="hero"><p class="eyebrow">Люмен · тот же Qwen3 1.7B · без нового обучения</p><h1>__HEADING__</h1><p class="lead">Дали базовой модели весь учебный справочник перед каждым вопросом. Сравнили с базой без источника и прежней LoRA на тех же 60 задачах. Главный результат ниже — полный ответ, включая правдивое объяснение и корректные поля.</p>
<div class="metric-controls"><label for="metric">Счёт:</label><select id="metric"><option value="semantic">Полностью верный ответ · разбор агента</option><option value="strict">Совпадение полей · прежний автотест</option></select></div><div id="scores" class="score-grid"></div><div class="outcome" id="outcome"></div><p class="small">Агентная оценка, без человеческой валидации. Правильное число при неверном объяснении не считается полным успехом. Ошибки JSON и противоречивый status сохраняются как ошибки контракта.</p></section>
<section id="results"><p class="eyebrow">Где источник помогает, а где остаются ошибки</p><h2>Факты, сочетания правил, отсутствие сведений</h2><div class="scroll-table"><table><thead><tr><th>Категория</th><th>Без источника</th><th>LoRA</th><th>С источником</th></tr></thead><tbody id="categories"></tbody></table></div><h3 style="margin-top:25px">Парные изменения на тех же задачах</h3><div id="paired"></div><p class="small">Это описательные результаты одного локального опыта. Повторные вопросы уже известны исследователю; новый вариант зафиксирован до генерации, параметры по ответам не подбирались.</p></section>
<section id="method"><p class="eyebrow">Контекст и обучение решают разные задачи</p><h2>Один справочник вместо новых весов</h2><div class="two"><article class="method"><h3>Что сделали</h3><ul><li>Та же публичная Qwen3-1.7B-4bit, тот же системный запрос и схема ответа.</li><li>Перед каждым вопросом добавили исходный справочник. Эталоны и готовые ответы в запрос не передавали.</li><li>Новый адаптер не обучали. Загрузки, платные API и облачный GPU не использовали.</li><li>Один полный прогон: temperature 0, максимум 256 выходных токенов.</li></ul></article><article class="method"><h3>Что это означает</h3><p>Это доступ к источнику во время ответа. После завершения запроса информация не записывается в веса.</p><p>Поиск по базе знаний здесь не реализован: весь источник помещается в контекст. RAG добавил бы выбор подходящих фрагментов, но качество такого поиска мы этим опытом не измеряли.</p></article></div><details><summary>Какой текст модель получила</summary><pre>__SOURCE__</pre></details><details><summary>Протокол и ограничения сравнения</summary><pre id="protocol"></pre><p class="small">Название «Люмен» уже присутствует в системном запросе всех вариантов: этот вопрос не доказывает новое знание. Semantic допускает равнозначные формулировки, но требует согласованных status/data и правдивого объяснения. Автотест строже к строкам и не проверяет правдивость объяснения. Главные правила оценки перенесены из предыдущего опыта.</p></details></section>
<section id="answers"><p class="eyebrow">Без исправления ответов задним числом</p><h2>Посмотреть конкретные ответы</h2><div class="filters"><label for="category">Категория</label><select id="category"><option value="all">Все 60</option><option value="atomic">Факты · 30</option><option value="composition">Сочетания · 24</option><option value="unknown">Нет сведений · 6</option></select><label for="query">Поиск</label><input type="search" id="query" placeholder="Вопрос или ID"></div><div class="question-picker"><button id="prev" type="button">←</button><select id="question" aria-label="Выбрать вопрос"></select><button id="next" type="button">→</button></div><h3 class="question-title" id="questionText"></h3><div class="expected" id="gold"></div><div class="raw-grid" id="raw"></div></section>
<section id="resources"><p class="eyebrow">Фактический запуск на Mac</p><h2>Ресурсы и время</h2><div id="resourceStats" class="process"></div><p class="small" style="margin-top:20px">Пик — наблюдаемый раз в секунду физический footprint дерева процесса; это не вся занятая память системы. Рост swap 0 не означает, что системный swap был пуст до начала.</p><details><summary>Статическая проверка и измеренный прогон</summary><pre id="resourcesText"></pre></details></section>
<section id="cleanup"><p class="eyebrow">Завершение эксперимента</p><h2>Cleanup</h2>__CLEANUP__</section>
<section><h2>Что можно сказать для видео</h2><p>Маленькая модель с LoRA не стала надёжным экспертом в нашем опыте. Добавление источника проверяется отдельно: оно может помочь найти факт, но не гарантирует правильного применения правил или соблюдения формата.</p><p>Из этого опыта нельзя делать общий вывод, что LoRA бесполезна или что RAG автоматически решает задачу. Для новых настроек и другой области нужен новый отложенный тест.</p><div class="links"><a href="report-data.json">Данные отчёта</a><a href="context.jsonl">Все новые raw-ответы</a><a href="semantic-review.json">Разбор ответов</a><a href="../../v2/runs/report.html">Предыдущий опыт</a><a href="../source-handbook.txt">Справочник</a></div></section></main><footer>26 октября 2026 · локальный опыт · публикация не выполнялась · HTML работает без сервера</footer>
<script>const D=__DATA__;
const $=s=>document.querySelector(s),keys=['base','lora','context'];
function el(tag,txt,cls){const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;}
function scores(){const m=$('#metric').value;$('#scores').replaceChildren();keys.forEach(k=>{const a=D.arms[k],n=el('article',undefined,'score');n.dataset.arm=k;n.append(el('h3',a.label),el('strong',a[m]+'/60'),el('p',m==='semantic'?'полностью верных ответов':'совпадение полей','small'));const b=el('div',undefined,'bar'),i=el('i');i.style.width=(a[m]/60*100)+'%';b.append(i);n.append(b);$('#scores').append(n);});const v=D.arms.context[m],b=D.arms.base[m],l=D.arms.lora[m];$('#outcome').textContent='С источником: '+v+'/60. Без источника: '+b+'/60. Прежняя LoRA: '+l+'/60.';$('#categories').replaceChildren();for(const [k,label] of [['atomic','Факты · 30'],['composition','Сочетания · 24'],['unknown','Нет сведений · 6']]){const tr=el('tr');tr.append(el('td',label));keys.forEach(a=>tr.append(el('td',D.arms[a].categories[k][m]+'/'+D.arms[a].categories[k].count)));$('#categories').append(tr);}$('#paired').replaceChildren();for(const k of ['base','lora']){let gain=0,loss=0;D.tests.forEach(t=>{const a=D.arms[k].rows[t.id][m],b=D.arms.context.rows[t.id][m];gain+=Number(!a&&b);loss+=Number(a&&!b);});$('#paired').append(el('p','Контекст против «'+D.arms[k].label+'»: новых верных '+gain+', потерянных '+loss+', чистый сдвиг '+(gain-loss)+'.'));}}
function show(){const t=D.tests.find(t=>t.id===$('#question').value);$('#raw').replaceChildren();if(!t){$('#questionText').textContent='Совпадений нет';$('#gold').textContent='';$('#prev').disabled=true;$('#next').disabled=true;return;}$('#questionText').textContent=t.id+' · '+t.question;$('#gold').textContent='Эталон: '+JSON.stringify(t.gold);keys.forEach(k=>{const r=D.arms[k].rows[t.id],n=el('article',undefined,'raw-card');n.dataset.arm=k;n.append(el('h3',D.arms[k].label),el('span',r.semantic?'Полный ответ верен':'Полный ответ не засчитан','badge '+(r.semantic?'pass':'')),el('p','Поля: '+(r.strict?'совпали':'не совпали'),'small'),el('pre',r.raw),el('p',r.review.note_ru||r.review.note||'', 'review-note'));$('#raw').append(n);});const q=$('#question');$('#prev').disabled=q.selectedIndex===0;$('#next').disabled=q.selectedIndex===q.options.length-1;}
function filter(){const cat=$('#category').value,q=$('#query').value.toLowerCase(),selected=$('#question').value,items=D.tests.filter(t=>(cat==='all'||cat===t.category)&&(t.id+' '+t.question).toLowerCase().includes(q));$('#question').replaceChildren(...items.map(t=>{const o=el('option',t.id+' · '+t.question);o.value=t.id;return o;}));if(items.some(t=>t.id===selected))$('#question').value=selected;show();}
$('#metric').addEventListener('change',scores);$('#category').addEventListener('change',filter);$('#query').addEventListener('input',filter);$('#question').addEventListener('change',show);for(const [id,d] of [['prev',-1],['next',1]])$('#'+id).addEventListener('click',()=>{$('#question').selectedIndex+=d;show();});$('#protocol').textContent=JSON.stringify(D.protocol,null,2);const R=D.resources;for(const [v,label] of [[R.wall_seconds.toFixed(1)+' с','все 60 ответов'],[(R.peak_footprint_bytes/2**30).toFixed(2)+' ГиБ','наблюдаемый пик памяти'],[(R.max_swap_growth_bytes/2**20).toFixed(0)+' МиБ','рост swap'],[D.preflight.max_prompt_tokens+' токенов','самый длинный запрос']]){const n=el('div');n.append(el('strong',v),el('span',label));$('#resourceStats').append(n);}$('#resourcesText').textContent=JSON.stringify({preflight:{...D.preflight,prompts:'60 prompt hashes in preflight.json'},measured:R},null,2);scores();filter();
</script></html>'''
    replacements={'__CSS__':css,'__LOGO__':logo,'__HEADING__':heading,'__SOURCE__':html.escape(source),
                  '__CLEANUP__':cleanup_html,'__DATA__':json.dumps(data,ensure_ascii=False).replace('</','<\\/')}
    for key,value in replacements.items(): document=document.replace(key,value)
    (ROOT/'runs/report.html').write_text(document)
    print(json.dumps({'scores':{k:{m:a[m] for m in ['strict','semantic']} for k,a in arms.items()},
                      'cleanup_included':bool(receipt),'report':str(ROOT/'runs/report.html')},ensure_ascii=False))

if __name__=='__main__': main()
