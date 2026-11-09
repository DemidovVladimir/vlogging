// Private EP.02 revision. Implementation details checked against 9805470.
import {editions as base} from './content.mjs';
export const editions=structuredClone(base);
Object.assign(editions.ru,{
 title:'Tengu Cluster — внутри нашего harness',
 description:'Как устроен наш Rust-harness: DAG-план, отдельные процессы агентов, права инструментов, повторные попытки, trace и память.',
 chapters:['TENGU / ВЫПУСК 02','НАШ HARNESS НА RUST','ПЛАН — ЭТО ЗАВИСИМОСТИ','КАК ЗАПУСКАЕТСЯ АГЕНТ','ГРАНИЦЫ ИНСТРУМЕНТОВ','ПОВТОР ИЛИ НОВЫЙ ПЛАН','СВЯЗАННЫЙ TRACE','ПАМЯТЬ И РЕЗУЛЬТАТ','TENGU / ВЫВОД'],
 titles:['Интро','Как устроен\nнаш Tengu Cluster','Кто решает,\nчто запускать дальше?','Один шаг плана —\nотдельный процесс','Промпт просит.\nКод проверяет доступ.','Повторить шаг ≠\nперестроить план','От ошибки —\nк конкретному вызову','Результат сейчас.\nПамять на потом.','Не «толпа агентов».\nУправляемое выполнение.'],
 leads:['','Rust-harness: конфигурация → план → процессы агентов → проверяемый результат.','RagPlanner выбирает шаги; DagExecutor запускает готовые по depends_on.','SubprocessRunner запускает tengu run-agent и обменивается с ним JSON.','Tool allowlist + scopes. Эти ограничения работают на проверяемом пути вызова.','Сначала retry с задержкой. Затем replan — если остался бюджет.','Studio связывает план, шаг и события инструментов в одной записи.','В текущем плане результат идёт по IPC. Долгая память подключается отдельно.','Конкретные связи, ограничения и события — вокруг выбранных моделей.'],
 coverStates:[['НЕ ТОЛЬКО ПРОМПТ','config.toml → planner → executor'],['ИСПОЛНЕНИЕ','run-agent → tool call → результат шага']],
 plan:['RagPlanner','Источники A','Критерии B','Сравнение C','Проверка D'],
 planNotes:['Planner видит настроенный roster: описания агентов, skills и tools.','A и B не зависят друг от друга — executor запускает их параллельно.','C: depends_on = [A, B]. Пока оба не готовы, сравнение не начнётся.','D получает результат C. Простой запрос может обойти план: Direct.'],
 process:['PARENT / EXECUTOR','goal · session_id · step_id','CHILD / run-agent','config.toml → model · skills · tools','MODEL ⇄ TOOLS','output · summary → следующий шаг'],
 rolesNotes:['Родитель передаёт цель, результаты зависимостей и план этой сессии.','Дочерний процесс загружает конфигурацию выбранного агента.','Внутри идёт цикл модели и инструментов. Итог возвращается как JSON.'],
 modelLine:'Engine задаётся для агента; дочерний процесс — не отдельная модель',
 boundaryLabels:['Агент','tools + scopes','Разрешённый URL','URL вне разрешений'],
 boundaryNotes:['Инструмент должен быть выдан агенту: одной просьбы в промпте мало.','Scope дополнительно проверяет аргументы: например, адрес или путь.','Shell, браузер и native tools CLI требуют собственных ограничений.'],
 boundaryCaveat:'Sandbox-конфигурация и дочерний процесс сами по себе не дают OS-изоляцию.',
 retryRows:['A: источники','C: сравнение','D: проверка'],
 retryStates:[['ГОТОВО','ОШИБКА','ЖДЁТ'],['СОХРАНЕНО','RETRY','ЖДЁТ'],['ПЕРЕИСПОЛЬЗУЕМ*','REPLAN','НОВЫЙ ПЛАН']],
 retryNotes:['Сравнение завершилось ошибкой. Проверка ждёт; источники уже собраны.','Retry повторяет тот же шаг с задержкой, пока остаются попытки.','Replan меняет план. *Готовый результат сохраняется лишь при совпадении шага и зависимостей.'],
 retryCaveat:'Есть лимиты попыток, перепланирований и времени шага. Успешный выход процесса не доказывает качество ответа.',
 traceLabels:['plan.created','step.started','tool.started → tool.completed','step.failed / completed'],
 traceDetail:[['ПЛАН','Запись показывает DAG и выбранных агентов.'],['ШАГ','session_id и step_id связывают работу дочернего процесса.'],['ИНСТРУМЕНТ','События вызовов возвращаются в trace родителя под своим шагом.'],['REPLAY','Studio воспроизводит запись событий. Инструменты заново не запускаются.']],
 traceNote:'Схема формата trace, не запись реального запуска и не скрытые рассуждения модели.',
 memory:['Итог run-agent','compress_and_store','recall: подходящая сводка','Следующая задача'],
 memoryNotes:['output / summary передаются следующему шагу по IPC даже без базы.','При включённой памяти сводка сохраняется в Postgres + pgvector.','Recall добавляет релевантные записи в новый контекст, не меняя веса модели.'],
 memoryCaveat:'Память опциональна. Если агент не вызвал compress_and_store, возможен fallback на финальный текст.',
 closeLines:['config.toml: кто и с какими правами','DAG + IPC: как идёт работа','Trace + проверка: почему доверяем итогу'],
 closeNote:'Параллельность сокращает ожидание независимых шагов, но не делает плохой план правильным.',
 footer:'ВЫПУСК 02 / КОД ПРОВЕРЕН 23.10.2026 / 9805470',
 script:[base.ru.script[0],
`Что именно мы написали в Tengu Cluster? Не ещё одну модель и не просто набор ролей в системном промпте. Это harness на Rust: программа, которая превращает задачу в управляемое выполнение. Она выбирает агентов, запускает их, передаёт результаты и фиксирует ошибки.
Возьмём сравнение трёх сервисов рассылок: найти условия, привести их к одной основе, проверить вывод. Это постановочный пример, не запись запуска. Но компоненты на экране настоящие, из нашего кода. **Начнём с того, кто решает, что делать.**`,
`В config.toml описаны доступные агенты: их модели, навыки и инструменты. Из этих описаний собирается roster — список исполнителей для планировщика RagPlanner. Сам планировщик не ходит по сайтам: его задача — вернуть прямой ответ или план.

План — не список пожеланий. У каждого шага есть зависимости, depends_on. Сбор источников и подготовка критериев независимы, поэтому DagExecutor может запустить их одновременно. Сравнение ждёт оба результата. Проверка ждёт сравнение.

Порядок обеспечивает код исполнителя, а не надежда, что модель запомнит инструкцию. **Но как именно выполняется один шаг?**`,
`SubprocessRunner запускает отдельный процесс той же программы командой tengu run-agent. Через стандартный ввод передаёт JSON: цель, идентификаторы сессии и шага, результаты зависимостей и актуальный план этой сессии.

Дочерний процесс загружает конфигурацию выбранного агента. Там определены engine, модель, skills и tools. Дальше идёт его собственный цикл: модель запрашивает инструмент, получает результат, продолжает работу. Число таких раундов ограничено.

В конце родителю возвращается JSON с результатом и сводкой. Отдельный процесс здесь не означает отдельную копию модели или защищённую виртуальную машину. **Границы действий нужно настраивать отдельно.**`,
`В Tengu есть два разных вопроса. Первый: выдан ли агенту этот инструмент? Второй: разрешены ли конкретные аргументы вызова? Например, инструмент чтения доступен, но запрошенный адрес не входит в разрешённую область.

На проверяемом пути такой вызов блокируется кодом. Это сильнее просьбы «не открывай другие сайты» в промпте. Но это не абсолютная изоляция. Если оставить широкие права shell, браузеру или встроенным инструментам внешнего CLI, появится другой путь.

Поэтому sandbox в нашей конфигурации — набор настроек и ограничений, а не обещание системной песочницы. **Теперь допустим, разрешённый вызов всё-таки завершился ошибкой.**`,
`Retry повторяет тот же шаг после задержки. Это полезно при временной технической ошибке. Replan делает другое: после исчерпания попыток планировщик получает информацию о сбое и предлагает новый план, если бюджет ещё позволяет.

Уже выполненную работу не обязательно запускать снова. Исполнитель переиспользует результат, когда совпадает сам шаг и его зависимости. Просто одинакового названия недостаточно.

Есть лимит попыток, перепланирований и времени выполнения. И важная граница: процесс может завершиться успешно и написать неверный вывод. Для качества нужен отдельный критерий проверки. **Чтобы разбираться в сбоях, нужна не только финальная фраза.**`,
`В Studio можно открыть граф и связанную запись выполнения. Событие плана ведёт к шагу, шаг — к вызовам инструментов. Идентификаторы сессии и шага позволяют сопоставить работу дочернего процесса с исходной задачей.

Например, сравнение не завершилось. Мы смотрим, стартовал ли шаг, какой инструмент вызвали и чем закончился вызов. Это гораздо предметнее, чем переписывать весь промпт наугад.

Replay означает просмотр записанных событий. Он не запускает инструмент повторно и не показывает скрытые мысли модели. **Осталось разделить передачу результата и долговременную память.**`,
`Результат шага передаётся дальше по IPC — обмену данными между процессами. Для этого база не нужна. А вот память между задачами подключается отдельно: Postgres с pgvector.

Агенту доступен compress_and_store: сформировать сводку и, при включённом хранении, сохранить её. Если вызова не было, реализация может использовать финальный текст как запасной вариант. При следующей задаче recall выбирает подходящие записи и добавляет их в контекст.

Это не обучение модели. Старое решение может устареть, поэтому память тоже требует проверки. **Теперь всю конструкцию можно собрать в три вопроса.**`,
`Кто настроен и какие действия ему доступны? Как зависимости и обмен результатами управляют выполнением? Какие события и проверки подтверждают итог?

Вот что добавляет наш harness поверх моделей. Не магическую самостоятельность, а конкретный механизм работы. Независимые шаги могут идти параллельно, ошибки имеют ограниченный путь восстановления, результат можно проследить.

Если задача решается одним вызовом модели, весь этот механизм может быть лишним. Он нужен там, где уже важны зависимости, реальные действия и возможность понять, что произошло.`]
});
Object.assign(editions.en,{
 title:'Tengu Cluster — inside our harness', description:'Inside our Rust harness: a dependency plan, agent subprocesses, tool permissions, retries, trace and optional memory.',
 chapters:['TENGU / EPISODE 02','OUR RUST HARNESS','DEPENDENCY PLAN','STARTING AN AGENT','TOOL BOUNDARIES','RETRY OR REPLAN','CONNECTED TRACE','RESULTS AND MEMORY','TENGU / TAKEAWAY'],
 titles:['Intro','Inside our\nTengu Cluster','Who decides\nwhat runs next?','One plan step.\nA separate process.','Prompts ask.\nCode checks access.','Retry a step ≠\nrebuild the plan','From a failure\nto a specific call','Results now.\nMemory for later.','Not an agent crowd.\nControlled execution.'],
 leads:['','A Rust harness: configuration → plan → agent processes → a checkable result.','RagPlanner selects steps; DagExecutor runs those ready under depends_on.','SubprocessRunner starts tengu run-agent and exchanges JSON with it.','Tool allowlists + scopes. These checks apply on the guarded call path.','First, retry with a delay. Then replan — if the budget allows.','Studio links the plan, its steps and tool events in one recording.','Current results travel over IPC. Long-term memory is an optional connection.','Concrete dependencies, boundaries and events around your chosen models.'],
 coverStates:[['BEYOND A PROMPT','config.toml → planner → executor'],['EXECUTION','run-agent → tool call → step result']],
 plan:['RagPlanner','Sources A','Criteria B','Comparison C','Review D'],
 planNotes:['The planner sees the configured roster: descriptions, skills and tools.','A and B are independent, so the executor can run them in parallel.','C: depends_on = [A, B]. Comparison waits until both results are ready.','D receives C’s result. A simple question can skip the plan: Direct.'],
 process:['PARENT / EXECUTOR','goal · session_id · step_id','CHILD / run-agent','config.toml → model · skills · tools','MODEL ⇄ TOOLS','output · summary → next step'],
 rolesNotes:['The parent sends the goal, dependency results and this session’s plan.','The child loads the configuration of the selected agent.','Its model/tool loop returns the final result as JSON.'],
 modelLine:'Engine is configured per agent; a child process is not a separate model',
 boundaryLabels:['Agent','tools + scopes','Allowed URL','URL outside scope'],
 boundaryNotes:['The agent must be granted the tool. Asking in a prompt is not enough.','A scope also checks arguments, such as a URL or filesystem path.','Shell, browser and native CLI tools need their own boundaries.'],
 boundaryCaveat:'A sandbox configuration and a child process do not, by themselves, provide OS isolation.',
 retryRows:['A: sources','C: comparison','D: review'],retryStates:[['DONE','ERROR','WAITING'],['RETAINED','RETRY','WAITING'],['REUSE*','REPLAN','NEW PLAN']],
 retryNotes:['Comparison failed. Review waits; source collection is already complete.','Retry repeats this step after a delay, while attempts remain.','Replan changes the plan. *Reuse requires the completed step and its dependencies to match.'],
 retryCaveat:'Attempts, replans and step duration are bounded. A successful process exit does not prove answer quality.',
 traceLabels:['plan.created','step.started','tool.started → tool.completed','step.failed / completed'],
 traceDetail:[['PLAN','The recording shows the DAG and selected agents.'],['STEP','session_id and step_id connect the child’s work to this task.'],['TOOL','Tool events return to the parent’s trace under their step.'],['REPLAY','Studio plays the event recording. It does not run tools again.']],
 traceNote:'Illustrative trace structure, not a recorded run or the model’s hidden reasoning.',
 memory:['run-agent result','compress_and_store','recall: relevant summary','Next task'],
 memoryNotes:['output / summary reach the next step over IPC, even without a database.','With memory enabled, a summary is stored in Postgres + pgvector.','Recall adds relevant records to a new context; model weights do not change.'],
 memoryCaveat:'Memory is optional. If compress_and_store was not called, the final text can serve as a fallback.',
 closeLines:['config.toml: agents and permissions','DAG + IPC: how work moves','Trace + checks: why trust the result'],closeNote:'Parallelism reduces waiting between independent steps. It does not make a bad plan correct.',footer:'EPISODE 02 / CODE CHECKED 23 OCT 2026 / 9805470',
 script:[base.en.script[0],
`What did we actually build in Tengu Cluster? Not another model, and not just a set of roles in a system prompt. It is a Rust harness: software that turns a task into controlled execution. It selects agents, starts them, passes results and records failures.

Take a comparison of three newsletter services: find their terms, compare them consistently, then check the conclusion. This is an authored example, not a recorded run. But the components on screen come from our actual code. **First, who decides what happens?**`,
`The config.toml file defines available agents, including their models, skills and tools. Their descriptions form the roster presented to RagPlanner. The planner does not browse websites itself. It returns either a direct response or a plan.

A plan contains dependencies, not just suggestions. Sources and evaluation criteria can run independently. DagExecutor can start both in parallel. Comparison waits for both results; review waits for comparison.

The executor’s code enforces that order. We are not relying on the model remembering a scheduling instruction. **So how does one step actually run?**`,
`SubprocessRunner launches a child process of the same program: tengu run-agent. It sends JSON through standard input: the goal, session and step identifiers, dependency results and the current plan for that session.

The child loads its selected agent’s configuration: engine, model, skills and tools. Inside it, a model/tool loop runs. The model requests a tool, receives its result and continues, within a configured round limit.

Finally, JSON carrying the output and summary returns to the parent. A separate process does not mean a separate model instance or a secure virtual machine. **Action boundaries are a separate responsibility.**`,
`Tengu asks two different permission questions. Is this tool available to the agent? And are the arguments of this particular call allowed? A reading tool may be available while the requested URL falls outside its permitted scope.

On the guarded call path, code rejects that request. That is stronger than asking “please avoid other sites” in a prompt. But it is not complete isolation. Broad shell access, a browser or an external CLI’s native tools can offer another route.

Here, a sandbox configuration is a package of settings and restrictions, not an operating-system sandbox. **Now suppose an allowed operation still fails.**`,
`Retry repeats the same step after a delay. It helps with temporary technical errors. Replan does something different: after attempts are exhausted, the planner receives the failure and can propose another plan, provided its budget allows.

Completed work does not always need to run again. The executor can reuse a result when the step and its dependencies match. Sharing the same name is not enough.

Attempts, replans and step duration are bounded. And a process can exit successfully while producing a wrong conclusion. Answer quality still needs an explicit check. **Diagnosing that requires more than the final response.**`,
`Studio exposes the graph and its connected execution recording. A plan event leads to a step; a step leads to tool calls. Session and step identifiers connect the child process’s work to the original task.

If comparison fails, we can inspect whether it started, which tool it called and how that call ended. That is more actionable than rewriting the entire prompt at random.

Replay means replaying recorded events. It does not execute tools again or reveal hidden model reasoning. **There is one more distinction: passing a result versus keeping memory.**`,
`A step’s result reaches downstream steps through IPC: communication between processes. That does not require a database. Memory across tasks is a separate, optional connection to Postgres with pgvector.

The agent can call compress_and_store to produce a summary and, when storage is enabled, retain it. If it does not call the tool, the implementation can fall back to its final text. For a later task, recall selects relevant records and adds them to context.

This is not model training. Old decisions can become outdated, so recalled information still needs checking. **We can now reduce the architecture to three questions.**`,
`Who is configured, and what can each agent do? How do dependencies and result passing control execution? Which events and checks support the final result?

That is what our harness adds around the models. Not magical autonomy, but a concrete execution mechanism. Independent steps can run in parallel, failures have bounded recovery paths, and results can be traced.

If one model call solves the task, this machinery may be unnecessary. It earns its place when dependencies, real actions and understanding what happened become important.`]
});
