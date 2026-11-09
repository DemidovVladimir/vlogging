# Люмен V2 — построитель локального отчёта

`python3 runs/build_followup_report.py` собирает текущий снимок без запуска модели. Выходы: `runs/report.html`, `runs/report-data.json`, `runs/video-angle.txt`. HTML самодостаточный: данные, логотип и шрифт встроены; для отрисовки сетевые запросы не нужны. Ссылки на первичные JSON и историю остаются относительными.

Финальный режим: `python3 runs/build_followup_report.py --require-complete`. Он требует пять полных совместимых веток, пройденные hashes freeze и полный агентный semantic review. Черновик явно показывает pending/partial и не превращает отсутствующие ответы в нули.

Входы:

- `seeds/test.jsonl`:60 строк с `id`, `category` (`atomic`,`composition`,`unknown`), `question`, `fields`, `gold`.
- `runs/eval-{base,v1,clean200,expanded200,expanded800}.jsonl`: metadata первой строкой и60 raw-ответов.
- `runs/semantic-review.json`: `arms.{arm}.items:[{id,full_answer_correct:boolean,note_ru,classification?}]`; aliases `semantic_correct`/`fully_correct` также принимаются.
- `runs/resources/*.json`: guard-снимки с `stage,status,wall_seconds,peak_footprint_bytes,max_swap_growth_bytes,observed_pressure_levels`.
- `protocol.json`,`freeze.json`,`clean-data-draft/clean-format-audit.json`, `.control/jobs/*.json`, `model-lock.json`.

Оценка вызывает именно frozen `compare.grade(raw,gold)`. Проверяются ID, полнота, одинаковый exam/model/system/versions/decoding/closed_book, ожидаемое наличие адаптера. Источник review сверяется по exam_sha256, если он записан. Изменённый compare.py не исполняется; остальные нарушения freeze видны и блокируют финальный статус.

Отчёт включает5счётов на одних60задачах,30/24/6категории, парные gains/losses, все300raw-ответов через selector, объясненияreview, ресурсы, состояние подтверждённыхPID и cleanup. Новый X/60 не сравнивается с историческими0/8.

При первом draft-прогоне пройдены проверка синтаксиса JS, уникальность HTML ID и встраивание assets. Browser QA отложена до окончания всех GPU-этапов, чтобы не влиять на ресурсные замеры. Никаких пакетов, моделей или браузеров построитель не устанавливает и не запускает. Все его записи ограничены runs/.
