// Private editorial source. This file and the scripts are never published.
export const editions = {
  ru: {
    title: 'Tengu Cluster — от запроса к работе', description: 'Как наш AI-harness распределяет работу, ограничивает действия и показывает, что произошло. Короткий интерактивный обзор.',
    start: 'Начать презентацию', sound: 'интро со звуком · 2,4 секунды', skip: 'К содержанию',
    chapters: ['TENGU / ВЫПУСК 02','ОТ ОТВЕТА К РАБОТЕ','ПЛАН И ЗАВИСИМОСТИ','КОНТЕКСТ КАЖДОГО АГЕНТА','ГРАНИЦЫ ДЕЙСТВИЙ','ВОССТАНОВЛЕНИЕ ПОСЛЕ СБОЯ','ВИДЕТЬ, ЧТО ПРОИЗОШЛО','ПАМЯТЬ МЕЖДУ ЗАДАЧАМИ','TENGU / СЛЕДУЮЩИЙ ШАГ'],
    titles: ['Интро','Ответ — ещё\nне выполненная\nработа','Одна задача.\nНесколько связанных шагов.','Не всем агентам\nнужно одно и то же','«Можно прочитать»\nне значит «можно купить»','Сбой одного шага —\nне потеря всей работы','Проверять можно\nне только последний ответ','Следующая задача\nне обязана начинаться с нуля','Не больше агентов.\nЯснее работа.'],
    leads: ['', 'Tengu Cluster — наш открытый harness: программа, которая организует работу моделей и инструментов.', 'Планировщик выбирает исполнителей. Harness соблюдает порядок зависимостей.', 'Модель, инструкции и инструменты задаются для каждого исполнителя.', 'Инструкции описывают задачу. Права ограничивают доступные действия.', 'Повторные попытки и перепланирование ограничены настройками.', 'Tengu Studio показывает граф и записанные события выполнения.', 'Долговременная память подключается отдельно. Это не обучение модели.', 'Начните с одной задачи, понятного результата и минимальных прав.'],
    demo: 'Иллюстрация процесса, не запись запуска.',
    brief: 'Сравни три сервиса рассылок для студии. Нужны условия и вывод. Ничего не покупай.',
    coverStates: [ ['КРАСИВЫЙ ОТВЕТ','«Вот несколько популярных сервисов…»'], ['НУЖНА РАБОТА','Источники → сравнение → проверка'] ],
    plan: ['Запрос','Источники','Критерии','Сравнение','Проверка'],
    planNotes: ['План выбирает из настроенных агентов, а не придумывает им доступы.', 'Независимые шаги могут идти параллельно.', 'Сравнение получает результаты обоих шагов.', 'Проверка — отдельный шаг, который нужно включить в план.'],
    roleNames: ['Исследователь','Редактор','Проверяющий'],
    roleRows: [ ['Вход','Какие условия найти','Источники + критерии','Черновик + источники'], ['Инструкция','Отделять факты от догадок','Сравнить на одной основе','Искать неподтверждённое'], ['Действие','Читать разрешённые сайты','Сохранить черновик','Вернуть замечания'] ],
    modelLine: 'Модель выбирается отдельно для каждого агента', engines: 'Codex · Claude Code · OpenRouter · локальный сервер',
    rolesNotes: ['Исследователю нужны источники и доступ к ним.', 'Редактор получает нужные результаты предыдущих шагов.', 'Разные роли не обязаны использовать разные модели.'],
    boundaryLabels: ['Исследователь','Права и инструменты','Разрешённый сайт','Оформление подписки'],
    boundaryNotes: ['Запросить разрешённую страницу → получить данные.', 'Платёжный инструмент не выдан → оформить подписку нельзя этим путём.', 'Нужно ограничить и обходные пути: браузер, shell, ключи и сеть.'],
    boundaryCaveat: 'Не обещание абсолютной защиты. Реальная граница зависит от всей конфигурации.',
    retryRows: ['Источники собраны','Шаг сравнения','Итоговый ответ'],
    retryStates: [ ['ГОТОВО','СБОЙ','ОЖИДАЕТ'], ['СОХРАНЕНО','ПОВТОР','ОЖИДАЕТ'], ['ИСПОЛЬЗУЕМ СНОВА','НОВЫЙ ПЛАН','ПРОДОЛЖЕНИЕ'] ],
    retryNotes: ['Технический сбой виден отдельно от успешно выполненной работы.', 'Сначала — разрешённые повторные попытки шага.', 'При перепланировании неизменные успешные шаги можно переиспользовать.'],
    retryCaveat: 'Если лимит исчерпан, выполнение завершается с ошибкой. Успех не гарантирован.',
    traceLabels: ['План принят','Источники готовы','Сравнение не завершилось','Попытка / новый план'],
    traceDetail: [ ['ПЛАН','Какие шаги запущены и как связаны'], ['ШАГ','Кто работал и какие инструменты вызвал'], ['СБОЙ','На каком шаге выполнение остановилось'], ['ПРОСМОТР','События можно посмотреть снова, не повторяя действия'] ],
    traceNote: 'Схематичный вид, не скриншот Studio. Журнал действий — не скрытые мысли модели.',
    memory: ['Результат задачи','Сохранённая сводка','Релевантное прошлое','Новая задача'],
    memoryNotes: ['При подключённой памяти итог шага можно сохранить.', 'В следующую задачу возвращается подходящая информация, а не вся история.', 'Старые условия нужно перепроверять. Память тоже может устареть.'],
    memoryCaveat: 'Опционально: Postgres + pgvector. Без них результат шага всё равно передаётся дальше в текущем плане.',
    closeLines: ['Что считаем результатом?','Кому какие действия разрешены?','Как проверим выполнение?'],
    closeNote: 'Для простого вопроса одного вызова модели может быть достаточно.',
    links: ['Код Tengu Cluster','Как устроен harness','Studio и журнал событий'],
    footer: 'ВЫПУСК 02 / КОД ПРОВЕРЕН 22.10.2026 / 9805470',
    script: [
      '[Запусти интро со звуком. Через 2,4 секунды переходи к 01.]',
      `Допустим, студии нужен сервис рассылок. Ты просишь AI сравнить три варианта, проверить условия и дать рекомендацию. В ответ приходит уверенный список. Но цены актуальны? Ограничения проверены? Кто вообще сделал эту работу?

Вот этот разрыв между хорошим ответом и выполненной задачей мы и пытаемся закрыть в Tengu Cluster. Это наш открытый harness — программа вокруг моделей и инструментов. Он не заменяет модель, а организует её работу. Дальше будет условный пример, не запись реального запуска.

**Начнём с того, как задача превращается в план.**`,
      `Планировщик видит, какие агенты настроены и что они умеют. Он может ответить напрямую или составить план. Например, один агент собирает условия сервисов, другой разбирает требования студии. Эти два шага могут идти одновременно.

Сравнение начинается, когда готовы оба результата. Проверяющий получает черновик и источники. Его задача — найти слабые места: скажем, не сравнили ли мы годовую оплату одного сервиса с месячной оплатой другого.

Важно: критик не появляется автоматически. Мы сами задаём такую роль и включаем проверку в процесс. Планировщик предлагает план, а harness запускает шаги с учётом зависимостей.

**Но делить работу мало. Нужно определить, с чем каждый работает.**`,
      `У каждого агента своя конфигурация: модель, инструкции, скиллы и доступные инструменты. Исследователю нужны сайты с условиями. Редактору — собранные данные и критерии сравнения. Проверяющему — черновик и материалы, по которым можно его проверить.

Harness собирает контекст для этой работы и передаёт результаты между связанными шагами. Это не означает, что все агенты постоянно читают всю переписку друг друга.

В Tengu есть подключения через Codex, Claude Code, OpenRouter и локальный сервер модели. Можно сочетать их, но разные роли не требуют разных моделей. Выбор всё равно проверяем на своей задаче.

**А что удерживает агента от лишнего действия?**`,
      `В нашем запросе есть фраза «ничего не покупай». Но одной фразы для контроля недостаточно. Исследователю можно дать чтение нужных сайтов, а способ оформить подписку вообще не предоставлять.

В Tengu настраиваются инструменты и границы доступа: например, разрешённые папки и сетевые адреса. Модель предлагает действие; исполняет его программный код с заданными ограничениями.

При этом нельзя закрыть один инструмент и оставить безграничный браузер или командную строку с платёжными ключами. Проверять нужно всю конфигурацию. Это снижение риска, а не обещание, что система никогда не ошибётся.

**Теперь представим, что разрешённый шаг всё-таки упал.**`,
      `Источники уже собраны, но шаг сравнения не завершился — например, из-за сбоя вызова модели. Harness может повторить его, а после исчерпания попыток запросить новый план. Количество таких попыток ограничено.

При перепланировании уже выполненные шаги можно использовать снова, если сами шаги и их зависимости не изменились. Не нужно автоматически начинать всё исследование заново.

Но технически завершившийся шаг ещё не означает правильный вывод. Содержательную проверку мы поэтому и выделили отдельно.

**Чтобы разобраться в сбое, нужен след выполнения.**`,
      `Tengu записывает события: какой план принят, какой агент начал работу, какие инструменты вызвал и где произошла ошибка. В локальном интерфейсе Tengu Studio можно посмотреть граф и пройти по записанным событиям.

Это помогает увидеть конкретное место, где процесс разошёлся с ожиданиями. Не просто сказать «модель снова сделала ерунду», а найти шаг, который надо исправить.

Такой просмотр не запускает покупки или другие действия заново. И это не чтение скрытых мыслей модели — мы смотрим на события программы.

**А что останется к следующей задаче?**`,
      `Если подключена долговременная память, Tengu может сохранить сводку результата и позже найти подходящую информацию. Например, требования студии пригодятся при следующем сравнении.

Это не обучение модели и не бесконечная общая переписка. В новый контекст добавляется найденное прошлое. При этом старые тарифы могли измениться — сохранённое знание нужно перепроверять.

Память опциональна. Без неё результаты всё равно передаются между шагами текущего плана.

**Получается, главный вопрос не в количестве агентов.**`,
      `Главное — что считаем результатом, кому что разрешено и как проверяем выполнение. Для простого вопроса может хватить одного обращения к модели. Несколько агентов добавляют не только возможности, но и время, стоимость и точки отказа.

Tengu Cluster нужен там, где эту работу полезно явно организовать. Начать можно с одной задачи и минимального набора действий. А усложнять — когда понятно, какую проблему мы этим решаем.

[Пауза на трёх вопросах. Логотип и оба персонажа остаются целиком в кадре.]`
    ]
  },
  en: {
    title: 'Tengu Cluster — from a request to real work', description: 'How our AI harness coordinates agents, limits their actions and makes execution visible. An interactive five-minute overview.',
    start: 'Start presentation', sound: 'intro with sound · 2.4 seconds', skip: 'Skip to content',
    chapters: ['TENGU / EPISODE 02','FROM ANSWER TO WORK','PLAN AND DEPENDENCIES','EACH AGENT’S CONTEXT','ACTION BOUNDARIES','RECOVERING FROM FAILURE','SEE WHAT HAPPENED','MEMORY BETWEEN TASKS','TENGU / YOUR NEXT STEP'],
    titles: ['Intro','A good answer\nisn’t a\nfinished task','One task.\nConnected steps.','Not every agent\nneeds the same things','Permission to read\nisn’t permission to buy','One failed step.\nNot all work lost.','Inspect more than\nthe final answer','The next task needn’t\nstart from nothing','Not more agents.\nClearer work.'],
    leads: ['', 'Tengu Cluster is our open-source harness: software coordinating models and tools.', 'The planner chooses workers. The harness respects their dependencies.', 'Each worker has its own model, instructions and tools.', 'Instructions describe the task. Permissions limit available actions.', 'Retries and replanning have configured limits.', 'Tengu Studio shows the workflow graph and recorded execution events.', 'Long-term memory is optional. It does not retrain the model.', 'Start with one task, a clear outcome and minimal permissions.'],
    demo: 'Illustrative workflow, not a recorded run.',
    brief: 'Compare three newsletter services for a studio. Check terms and recommend one. Don’t buy anything.',
    coverStates: [['A POLISHED ANSWER','“Here are some popular services…”'], ['WORK TO BE DONE','Sources → comparison → review']],
    plan: ['Request','Sources','Criteria','Comparison','Review'],
    planNotes: ['The planner chooses configured agents; it does not invent permissions.', 'Independent steps can run in parallel.', 'The comparison receives both upstream results.', 'Review is a separate step that must be included in the plan.'],
    roleNames: ['Researcher','Editor','Reviewer'],
    roleRows: [['Input','Which terms to find','Sources + criteria','Draft + sources'],['Instruction','Separate facts from guesses','Compare on a consistent basis','Find unsupported claims'],['Action','Read permitted websites','Save a draft','Return findings']],
    modelLine: 'Choose the model separately for each agent', engines: 'Codex · Claude Code · OpenRouter · local model server',
    rolesNotes: ['The researcher needs sources and access to them.', 'The editor receives the relevant upstream results.', 'Different roles do not require different models.'],
    boundaryLabels: ['Researcher','Tools & permissions','Permitted website','Purchase subscription'],
    boundaryNotes: ['Request a permitted page → receive data.', 'No payment tool granted → no purchase through that route.', 'Also restrict alternative routes: browser, shell, keys and network.'],
    boundaryCaveat: 'Not a promise of perfect protection. The boundary depends on the entire configuration.',
    retryRows: ['Sources collected','Comparison step','Final response'],
    retryStates: [['DONE','FAILED','WAITING'],['KEPT','RETRY','WAITING'],['REUSED','NEW PLAN','CONTINUE']],
    retryNotes: ['A technical failure is distinct from the work already completed.', 'First, retry the step within its configured budget.', 'Replanning can reuse unchanged successful steps and dependencies.'],
    retryCaveat: 'Once the budget is exhausted, execution ends with an error. Success is not guaranteed.',
    traceLabels: ['Plan accepted','Sources ready','Comparison failed','Retry / replan'],
    traceDetail: [['PLAN','Which steps were dispatched and how they connect'],['STEP','Who worked and which tools were called'],['FAILURE','Where execution stopped'],['REPLAY','Inspect recorded events without repeating actions']],
    traceNote: 'Schematic, not a Studio screenshot. An execution log is not the model’s hidden reasoning.',
    memory: ['Task result','Saved summary','Relevant past work','New task'],
    memoryNotes: ['With memory enabled, a step summary can be saved.', 'Relevant information returns, not the entire conversation history.', 'Old terms may be out of date. Stored information needs checking.'],
    memoryCaveat: 'Optional: Postgres + pgvector. Without them, step results still pass through the current plan.',
    closeLines: ['What counts as done?','Who can do what?','How will we check the work?'],
    closeNote: 'A simple question may need only one model call.',
    links: ['Tengu Cluster source','Harness architecture','Studio & execution traces'],
    footer: 'EPISODE 02 / CODE CHECKED 22 OCT 2026 / 9805470',
    script: [
      '[Start the intro with sound. After 2.4 seconds, move to 01.]',
      `A studio needs a newsletter service. You ask AI to compare three options, check their terms, and recommend one. It returns a confident list. But are the prices current? Did anyone check the limits?

That gap between a polished answer and completed work is what we’re addressing with Tengu Cluster. It’s our open-source harness: software around models and tools that organizes their work. This walkthrough is an illustration, not a recorded run.

**Start with the plan.**`,
      `The planner sees the configured agents and their capabilities. It can answer directly or propose a plan. Here, one worker collects service terms while another extracts the studio’s requirements. Independent steps can run together.

Comparison waits for both results. A reviewer then checks the draft against the sources. Did we compare one service’s annual price with another’s monthly price?

The reviewer isn’t automatic: we configure that role and include it in the process. The planner proposes; the harness dispatches steps according to their dependencies.

**Each worker also needs the right inputs.**`,
      `Each agent has its own model, instructions, skills, and tools. The researcher needs access to sources. The editor needs collected facts and comparison criteria. The reviewer needs the draft and supporting material.

The harness assembles context and passes results between connected steps. This doesn’t mean every agent continually reads everybody else’s conversation.

Tengu has connections through Codex, Claude Code, OpenRouter, and a local model server. Different roles needn’t use different models. Choose and test the setup for your task.

**Now, what stops an unwanted action?**`,
      `Our request says “don’t buy anything.” That instruction matters, but it isn’t enough for access control. Give the researcher access to the necessary websites without providing a way to purchase a subscription.

Tengu configures tools and access boundaries, such as permitted folders and network hosts. The model proposes an action; code executes it under those restrictions.

But removing a payment tool while leaving an unrestricted browser or shell with payment credentials would miss the point. Check the entire configuration. This reduces risk; it doesn’t promise perfect safety.

**Allowed actions can still fail.**`,
      `The sources are collected, but the comparison step fails, perhaps because a model call breaks. The harness can retry, then request a new plan after those attempts are exhausted. Both have configured limits.

Replanning can reuse successful steps when those steps and their dependencies haven’t changed. It needn’t restart all the research.

A completed step still isn’t proof of a correct conclusion. That’s why we included a separate review.

**To diagnose failure, we need an execution trail.**`,
      `Tengu records events: the accepted plan, started steps, tool calls, and errors. In the local Tengu Studio interface, you can inspect the graph and walk through recorded events.

Instead of “the model got it wrong again,” you can identify the step to investigate. Replaying events doesn’t repeat purchases or other actions. And it isn’t a window into the model’s hidden reasoning: it shows what the software did.

**What carries over to the next task?**`,
      `With long-term memory enabled, Tengu can save a summary and retrieve relevant information later. The studio’s requirements might help with a future comparison.

That doesn’t retrain the model. Retrieved information enters the new context. Old prices may have changed, so memory still needs checking.

This memory is optional. Without it, results still pass between steps in the current plan.

**The goal isn’t to maximize agent count.**`,
      `Ask what counts as done, who can do what, and how you’ll check the work. A simple question may need one model call. Multiple agents add time, cost, and failure points as well as capability.

Tengu Cluster is useful when organizing that work explicitly helps. Start with one task and minimal permissions. Add complexity when you know which problem it solves.

[Hold the three questions. Keep the full bird, robot and logo in frame.]`
    ]
  }
};
