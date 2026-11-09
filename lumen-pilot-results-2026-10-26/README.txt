ЛЮМЕН — ЛОКАЛЬНЫЙ МИНИ-ПИЛОТ / РАБОЧАЯ КОПИЯ

ПРИМЕЧАНИЕ К РЕАЛЬНОМУ ПРОГОНУ
Основной A/B использует mlx-community/Qwen3-1.7B-4bit, ревизия 3b1b1768f8f8cf8351c712464f906e86c2b8269e.
Qwen3-4B была только предварительной попыткой оценки ресурсов до baseline: её проба остановлена защитой после трёх последовательных отсчётов повышенного давления памяти. Это не OOM и не результат проверки качества.
Свидетельства: runs/resources/calibration.json; изменения протокола: protocol-amendments.json. Основные 60/12/8 и 200 итераций не изменены.
Перед baseline и основным обучением требуется успешная отдельная 20-итерационная проверка 1.7B с тренировочными данными и дополнением до 512 токенов: остановка при наблюдаемом footprint дерева дочерних процессов свыше 6 ГиБ; также остановка при трёх последовательных отсчётах давления >=2 либо роста swap свыше 0,75 ГиБ. Это дискретное наблюдение с защитной остановкой, не жёсткий лимит выделения памяти.
Итоговые баллы здесь не заявлены; ответы и измерения фиксируются отдельными файлами runs/.

Стек: Hugging Face Hub (загрузка mlx-community/Qwen3-1.7B-4bit), MLX-LM (локальное обучение и inference), наши Python-скрипты (сравнение).

Данные: 60 учебных записей, 12 validation, 8 закрытых тестовых вопросов. Это маленькая проверка pipeline, не полный эксперимент 600/60/80. Все названия и правила вымышлены.

В рабочей копии установлены зависимости MLX и сохранён requirements.lock.txt. Исходный архив описывал ещё не выполненный проект; фактический статус этого запуска определяется логами и файлами runs/. До итогового отчёта это не утверждение о проверенном качестве обучения.

1. Получить папку эксперимента
Это необязательный ручной маршрут. В основном режиме агент делает действия сам. Рабочая копия lumen-local-... отдельна от репозитория; входной архив переносим внутрь неё, чтобы cleanup убрал и его.

mkdir -p ~/development/vlogging/lumen-local-pilot/.input
mv -n ~/Downloads/lumen-local-pilot.zip ~/development/vlogging/lumen-local-pilot/.input/bundle.zip
cd ~/development/vlogging/lumen-local-pilot
unzip -n .input/bundle.zip
/opt/homebrew/bin/python3.12 manage.py init

Проверка: Создан маркер .lumen-experiment.json с уникальным ID. Все исполняющие команды идут через manage.py exec; переменные окружения задаются только дочернему процессу.

2. Подготовить Python и MLX
Агент использует нативный ARM64 Python 3.12 и отдельный .venv. manage.py задаёт пути кэшей и временных файлов только дочернему процессу; профиль shell и глобальная установка Python не меняются.

/opt/homebrew/bin/python3.12 manage.py exec --stage venv -- /opt/homebrew/bin/python3.12 -m venv .venv
/opt/homebrew/bin/python3.12 manage.py exec --stage packages --online -- .venv/bin/python -m pip install -r requirements.in
/opt/homebrew/bin/python3.12 manage.py exec --stage doctor -- .venv/bin/python doctor.py
/opt/homebrew/bin/python3.12 manage.py exec --stage freeze -- .venv/bin/python -m pip freeze > requirements.lock.txt

Проверка: doctor.py должен вывести ARM64, GPU-устройство и результат маленькой операции [2.0, 4.0]. requirements.lock.txt сохранит фактически установленные версии. Это ещё не проверка памяти обучения Qwen.

3. Скачать подходящие веса с Hugging Face
Берём mlx-community/Qwen3-1.7B-4bit — MLX-конверсию Qwen3-1.7B. Скрипт закрепляет конкретную ревизию репозитория и хэши локальных файлов. Регистрация и платный endpoint для этого публичного checkpoint не нужны.

/opt/homebrew/bin/python3.12 manage.py exec --stage download --online -- .venv/bin/python download_model.py

Проверка: Появятся models/qwen3-1.7b-4bit/ и model-lock.json. Скрипт фиксирует одинаковый non-thinking шаблон для train, baseline и after; веса базы не изменяет. Повторный вызов проверяет уже скачанные файлы.

4. Проверить источник и подготовить данные
Сначала прочитай source-handbook.txt и записи seeds/. В архиве есть маленький учебный набор: 60 train, 12 validation, 8 test. Это стартовый мини-пилот; план большого опыта на 600/60/80 остаётся отдельным этапом.

/opt/homebrew/bin/python3.12 manage.py exec --stage check-data -- .venv/bin/python prepare_data.py --check-only
/opt/homebrew/bin/python3.12 manage.py exec --stage prepare-data -- .venv/bin/python prepare_data.py

Проверка: Первый вызов проверяет структуру и отсутствие дословно одинаковых вопросов между split. Второй создаёт data/train.jsonl, data/valid.jsonl и data-lock.json; проверяет реальный tokenizer, границу маски loss и длину не более 512 токенов. При ошибке дальше не идти.

5. Сохранить ответы исходной модели — ДО
До обучения запускаем 8 отложенных вопросов. В модель идут только system prompt, вопрос и названия полей ответа. Справочник, эталоны и история других вопросов в prompt не включаются.

/opt/homebrew/bin/python3.12 manage.py exec --stage before -- .venv/bin/python run_eval.py --out runs/before.jsonl

Проверка: Получится runs/before.jsonl: исходные ответы, время генерации каждого ответа, пиковая память процесса и метаданные модели/экзамена. Загрузка модели в это время не входит. Скрипт не перезаписывает существующий результат. Это наш сохранённый baseline.

6. Сделать техническую пробу LoRA
На 20 итерациях проверяем forward/backward, расход памяти, сохранение и загрузку адаптера. Выход пробы сохраняем отдельно. Используем LoRA поверх 4-bit базы — в терминологии MLX-LM это quantized LoRA / QLoRA.

/opt/homebrew/bin/python3.12 manage.py exec --stage smoke -- .venv/bin/mlx_lm.lora --config train-config.yaml --iters 20 --save-every 20 --adapter-path adapters/smoke
/opt/homebrew/bin/python3.12 manage.py exec --stage smoke-load -- .venv/bin/python run_eval.py --adapter adapters/smoke --question "Как называется учебный кинотеатр?"

Проверка: В логе должны завершиться 20 итераций; в adapters/smoke появятся adapter_config.json и adapters.safetensors. Последняя команда проверяет загрузку адаптера на отдельном тренировочном вопросе. Это не экзамен и не доказательство качества.

7. Запустить фиксированный обучающий мини-пилот
Если техническая проба прошла, запускаем новый адаптер с нуля. В конфигурации: batch 1, 512 токенов, 4 обучаемых слоя, rank 8, learning rate 1e-5, seed 42, 200 итераций. Числа — исходная настройка для опыта, а не обещание результата.

/opt/homebrew/bin/python3.12 manage.py exec --stage train -- .venv/bin/mlx_lm.lora --config train-config.yaml

Проверка: Появится adapters/lumen-v1/. Логи стадии сохраняются в .control/logs/, PID и код завершения — в .control/jobs/. Проверяем validation loss и peak memory; test не используется для подбора настроек.

8. Провести тот же экзамен — ПОСЛЕ
Загружаем ту же локальную базу с новым адаптером. Те же вопросы, system prompt, greedy-декодирование и лимит 256 токенов; новый чат на каждый вопрос.

/opt/homebrew/bin/python3.12 manage.py exec --stage after -- .venv/bin/python run_eval.py --adapter adapters/lumen-v1 --out runs/after.jsonl

Проверка: Получится runs/after.jsonl с реальными ответами. Если набор не завершился, нельзя молча убрать неудачные вопросы: сравнение потребует полный комплект.

9. Сравнить ответы и открыть отчёт
Скрипт проверяет, что ревизия модели, версия экзамена, prompt и настройки совпадают. Считает совпадение полей JSON, сохраняет все ответы рядом с эталонами. Объяснения и логику рекомендаций проверяем вручную.

/opt/homebrew/bin/python3.12 manage.py exec --stage compare -- .venv/bin/python compare.py --before runs/before.jsonl --after runs/after.jsonl --out runs/comparison.html
open runs/comparison.html

Проверка: Локальный HTML покажет фактические результаты ДО/ПОСЛЕ для всех 8 вопросов. Это проверка механизма на мини-наборе. Для заявлений по критерию 64/80 нужен полный независимый экзамен и контроль регрессий.

10. Задать свой вопрос и сохранить эксперимент
После финального экзамена можно отдельно поговорить с адаптером. Это исследовательские вопросы, они не добавляются задним числом в тестовый результат. Для нового обучения — новая папка эксперимента и новый заранее отложенный экзамен.

/opt/homebrew/bin/python3.12 manage.py exec --stage extra-question -- .venv/bin/python run_eval.py --adapter adapters/lumen-v1 --question "Можно ли передать другу посещение по абонементу Искра?"

Проверка: До cleanup можно просмотреть результаты. Экспорт за пределы папки делается только по явному запросу; в полном режиме cleanup удалит и отчёты, и адаптеры, и рабочую копию.

11. Выполнить cleanup и проверить остатки
Основной путь — промпт cleanup в агентном режиме. Ниже только предварительный просмотр: он ничего не удаляет. Для удаления агент использует точный ID из маркера, останавливает проверенные PID, проверяет открытые файлы и удаляет всю рабочую копию. Команду cleanup запускают из родительской папки, системным Python.

cd ..
/opt/homebrew/bin/python3.12 lumen-local-pilot/manage.py cleanup

Проверка: В dry-run видны точный корень, ID, работающие задания и размер файлов. После авторизованного cleanup --apply --expect-id ID агент проверяет отсутствие папки и отслеживаемых процессов. Глобальные кэши не очищаются.

Финальный отчёт по 8 вопросам проверяет поля JSON, а объяснения требуют ручного чтения. Все вопросы должны остаться в отчёте. Не подбирать гиперпараметры по test; при следующей попытке сделать новый test.
