# Offline DeFi report

Из defi-v5: `python3 tools/build_report.py`, затем `python3 tools/validate_report.py`. Записываются только defi-v5/report.html, report-data.json, static-validation.json и сохранённый JS синтаксической проверки tools/report-static-check.js. Старые HTML и корневой manifest не меняются.

Страница использует встроенные Manrope/логотип из сохранённого audit-v4 HTML. Документы целиком в HTML не копируются: остаются метаданные и небольшие excerpts выбранных контекстов. Все точные raw сохраняются в файлах и доступны из интерфейса. Модель, браузер, сервер и сеть builder не использует.

Ожидаются exam/test.jsonl, inputs/contexts.jsonl (по одному объекту id/arm), runs/{closed,oracle,retrieved}.jsonl (meta +60), runs/grades.json. Разметка — плоский items: id,arm,parse_ok,status_ok,data_ok,content_correct,quote_valid,citation_supported,fully_grounded,notes. На верхнем уровне рекомендован raw_sha256:{closed:SHA,oracle:SHA,retrieved:SHA}. Для неполных веток баллы остаются null/pending; реальные нули допускаются только после полного прогона и разметки. `--require-complete` запрещает выдачу неполного результата трёх режимов.

Метрики: content_correct/60; fully_grounded среди52known; структурно корректные unknown (parse/status/data/content) из8. Recall@3 считается отдельно по top-3 retrieval.hits до trim и context после trim. «Все источники» требует все gold doc_id, «все spans» — полное покрытие каждого gold интервала объединением найденных интервалов того же документа. Unknown не входят в recall. Обязательно сохранять оригинальные символьные offsets после любых сокращений.

protocol.json, preflight.json, resources/*.json и cleanup.json показываются как реальные сохранённые свидетельства; нет квитанции — нет утверждения об очистке. Историческое давление памяти не заменяет новый ресурсный допуск. Недоступные страницы и complete=false корпуса отражаются явно.

Статический QA проверяет JS/ID/локальные ссылки, отсутствие внешних render-assets,52/8разбиение, отсутствие числовых scores у неполных веток и SHA всех1673source-документов. Это не браузерный QA и не семантическая оценка модели.
