# Источники, доказательства и границы

Проверено 26 октября 2026 года. Локальный русский выпуск; не опубликован. Этот журнал не озвучивается. Слова «проверено» ниже означают чтение первичного документа или локального артефакта, а не человеческую валидацию качества.

| Утверждение | Первичный источник | Граница |
|---|---|---|
| Выбрана community MLX-конверсия Qwen3-1.7B, 4bit | https://huggingface.co/mlx-community/Qwen3-1.7B-4bit | Карточка просмотрена 2026-10-26; actual revision закреплена локально. |
| LoRA замораживает базовые веса и обучает низкоранговые добавки | https://arxiv.org/abs/2106.09685 | Hu et al., 2021; объясняем механизм, не переносим их benchmark-цифры. |
| Локальное обучение LoRA и quantized-base adaptation через MLX-LM | https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/LORA.md | Официальный документ просмотрен 2026-10-26. Исполнение нашей версии подтверждается локальными логами. |
| 30 правил, все цены и эталоны вымышлены | ../../source-handbook.txt | Это учебный бизнес, не реальная касса или бронирование. |
| 60 train / 12 valid / 8 test; 200 iterations; rank 8; last 4 blocks; batch 1; seq ≤512 | ../../seeds/; ../../train-config.yaml; ../../data-lock.json | Участвуют подготовленные QA, а не автоматическое «чтение книги». Максимальная реальная prepared sequence — 276; capacity probe отдельно padded до 512. |
| Поправка unknown-label leak до первого baseline | ../../protocol-amendments.json | Исправлено пустое requested fields, выдававшее unknown label. Questions и gold не менялись. |
| Реальные неизменённые ответы A/B/C | ../before.jsonl; ../after.jsonl; ../openbook.jsonl | A/B closed book, одинаковые base/system/exam/decoding; C отдельно с source context, без адаптера. |
| Strict 0/8 → 0/8; C 3/8 | ../comparison.html; ../results-data.json | Автоматический контракт включает значения; не равен одному JSON-парсингу. |
| Семантические полные решения 0/8, 0/8, 3/8; все 24 outer JSON valid | ../semantic-review.json; ../method-review.txt | Независимый агентный source-grounded review, не человеческая оценка. Частичные решения и honest abstentions отмечены отдельно. |
| Primary walltime 117,6897467 с, peak footprint 2 319 517 544 bytes, swap growth 0 | ../resources/train.json | Наблюдаемый пик при дискретной выборке дерева процессов, не математический максимум любой аллокации и не вся RAM системы. |
| Итоговый адаптер реально обучен и использован | ../method-review.txt; ../../adapters/lumen-v1/; ../after.jsonl | 56 finite F32 tensors; 28 LoRA-B ненулевые; 1 245 184 params; final равен checkpoint 200, отличается от 50; after adapter hash совпадает. |
| Validation loss 2,344 → 0,128 | ../method-review.txt; ../../.control/logs/afd66292e7364a30b40f57df71c51f03.log | Token-level показатель на validation, не измерение точности экзамена. |

## Зафиксированная среда

Модель `mlx-community/Qwen3-1.7B-4bit`; revision `3b1b1768f8f8cf8351c712464f906e86c2b8269e`. MLX 0.32.4, MLX-LM 0.32.2, Transformers 5.20.2. Greedy temperature 0, max_tokens 256, enable_thinking false в A/B/C. File fingerprints сохранены в metadata и evidence-lock.json. Hash адаптера: `5b34249755d11a1a917a530370381959f172314e6d5bb4ba0d55bf64abc422e1`.

## Выбор по ресурсам до baseline

Первоначальная 4B база revision `4dcb3d101c2a062e5c1d4bb173588c54ea6c4d25`. По ../resources/calibration.json planned 20-iteration padded-512 probe остановлен защитой ещё на initial validation после трёх macOS pressure warning samples: 6,184799 с; footprint 3 494 775 592 байт; swap growth 0; OOM не было. Baseline/test к тому моменту не запускались. Поэтому выбрана 1.7B по доступным ресурсам текущей сессии. Нельзя говорить, что 4B невозможна на любом 16 GB Mac.

1.7B успешно прошла 20/20 отдельных калибровочных итераций: ../resources/calibration-17b.json, 25,197885 с, peak footprint 2 746 697 696 байт ≈2,558 GiB, pressure normal, swap growth 0. Пробный адаптер не переносился в основной fresh training. Эти метрики не заменяют main train walltime и peak.

## Единицы и интерпретация

MLX process_peak_memory_GB — десятичные GB. Guard physical footprint — байты, в deck переведены в двоичные GiB (ГиБ). Это разные метрики. Рост swap 0 означает отсутствие наблюдаемого роста за запуск, не нулевой swap всей системы.

На экране 05 — дословный фрагмент поля answer baseline demo-02 и объект data after demo-02, без исправления фактов. Правильная цена 24 EUR, after дал 12 EUR. Фрагменты подписаны; весь набор доступен в ../report.html и raw JSONL.

После модель повторяет целевой стиль: сериализованный JSON внутри answer. Причинная роль такого training target в провале не установлена: абляция не проводилась. Не найдено очевидной ошибки подключения адаптера или разделения train/test, но аудит не доказывает отсутствие всех возможных дефектов.

## Предел вывода

Рецепт 1.7B + 60 QA + 200 fixed iterations не дал полного верного решения на 8 отложенных задачах. Это не приговор LoRA, всем малым моделям, Mac или любым книгам. 80-задачный экзамен и general regression не проводились. C — полный источник в контексте, не retrieval/RAG-система. C дал только 3/8: парковка с unknown + data.false противоречива, её нельзя засчитывать четвёртым успехом. Тест больше не использовать для подбора гиперпараметров.

Все материалы local-only. Публикация, RU/EN release и cloud upload не выполнялись.
