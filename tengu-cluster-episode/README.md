# TENGU EP.02 — внутри нашего harness

Техническая редакция от 23 октября 2026. 8 содержательных экранов + MP4. Основа — прочитанный код Tengu Cluster 9805470, а не универсальная схема агента. Пример постановочный; платных/live-запусков не было. Сам репозиторий harness не изменялся.

## Смотреть

- RU: https://tengucluster.com/episodes/tengu-cluster/
- EN: https://tengucluster.com/en/episodes/tengu-cluster/
- Каталог: https://tengucluster.com/ и /en/.
- EP.01 сохранён: /episodes/agent-context/ и /en/episodes/agent-context/.

## Исходники и приватные материалы

Канонический вход: technical-content.mjs (переопределяет сохранённый content.mjs), author.mjs, episode.css, render.js. Сборка: node author.mjs. Она ставит draft; после неё обязательны QA и ready.

Сценарии: ru/SCRIPT-RU.md и en/SCRIPT-EN.md. Режиссёрские планы: ru/STORY-PLAN-RU.md и en/STORY-PLAN-EN.md. Источники: ru/SOURCES.md, en/SOURCES.md. Всё перечисленное непублично.

Оценка чтения с паузами: RU около 5:01; EN около 5:56. Это расчёт, не замер голоса ведущего.

Локально: node serve.mjs, только 127.0.0.1:4174. Презентации /ru/dist/ и /en/dist/. Приватный reader: script.html; план: script.html?view=plan. Не публиковать рабочий dist целиком.

## Содержание

Rust + config.toml → RagPlanner / Direct или DAG → DagExecutor / depends_on → SubprocessRunner / run-agent / JSON IPC → права tools и scopes → bounded retry/replan и условное переиспользование → Studio trace → опциональные compress_and_store / Postgres + pgvector / recall.

Дочерний процесс не равен OS-песочнице. Статус выполнения не доказывает качество. Replay не выполняет действия заново. Память не меняет веса модели.

## Публикация и восстановление

Полный текущий baseline сайта — ../tengu-cloudflare-pages/. Текущая техническая редакция, QA и receipt — ../tengu-technical-revision/. Там previous/ хранит полный прежний публичный снимок и исходники обеих редакций. Старый release/ — история, не текущий сайт. Не запускать его snapshot-specific сборщик для следующего выпуска.

P пауза; R сброс на паузе; ←/→ фазы; −/+ скорость; 0 нормальная; ↑/↓ экраны. MP4 запускается кликом со звуком. В публичной версии H скрывает меню для записи; другой язык сохраняет слайд.
