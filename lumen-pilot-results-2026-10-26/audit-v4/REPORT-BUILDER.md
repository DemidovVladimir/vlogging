# Локальный аудит v4

`python3 build_audit_report.py` пересобирает только `audit-v4/report.html` и `report-data.json`. Исторические v1/v2/v3 не записываются. Стиль, встроенные шрифты и SVG-логотип читаются из сохранённой v3; лицензия Manrope встроена в итоговую страницу. Внешних загрузок для отображения нет.

`python3 validate_report.py` проверяет синтаксис JavaScript через установленный Node, уникальность ID, существование локальных ссылок, отсутствие внешних render-ресурсов, все 60 SHA raw и неизменность прочитанных файлов v3. Результат — `static-validation.json`. Это статическая проверка, не browser QA.

Новый A/B читается только из экспортированного `audit-v4/prompt-test`. Пока нет полного 60+60 и привязанного по SHA разбора всех 120 ответов, общий score не объявляется. Ресурсный `protective_stop` показывает самостоятельный итог попытки без точности и без обещания автоматического повторения. `baseline5/60` и `revised0/60` — счётчик полученных raw, не количество правильных ответов.

Ожидаемые артефакты: `preflight.json`, `protocol.json`, `revised-system.txt`, `seeds/test.jsonl`, `source-handbook.txt`, `freeze.json`, `runs/{baseline,revised}.jsonl`, `runs/semantic-review.json`, `runs/resources/*.json`, `runs/{pipeline-state,final-status}.json`, `cleanup.json`. Отсутствие файлов revised/review при остановленном baseline допустимо и честно отображается. Для потенциально полного A/B дополнительный флаг `--require-prompt-complete` запрещает неполный результат; для остановленного опыта этот флаг намеренно не используется.

Cleanup новой попытки подтверждается только её собственной квитанцией. Старый cleanup не используется как доказательство удаления нового runtime. Штатная финализация: root экспортирует сохранённые данные и cleanup, пересобирает builder, запускает static validation и обновляет общий manifest. Сам builder manifest не меняет.

Криптоблок использует проверенный corpus manifest, index summary и снимки. SQLite FTS5 и фиксированный числовой срез DeFiLlama не выдаются за ответы LLM или benchmark. URL отдельных протоколов из исходного API, включая referral-параметры, в страницу не встраиваются.
