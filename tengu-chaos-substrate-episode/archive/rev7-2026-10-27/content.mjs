// Private editorial source for TENGU EP.05 (Chaos Substrate). Never published.
// Every number below was measured on 27.10.2026; see ru/SOURCES.md and en/SOURCES.md.
// Measured code: public branch v2 of DemidovVladimir/chaos-substrate at
// 24c82ad8e23c1446e5d840df13c59834bd91d7e2, tool chaos 1.1.0 (published as
// 3c69fa12b485ee72250f9516d3c4bcb097c20f92), Apple M4, Ollama embeddinggemma.
// chaos-kb 2.0.0 on a throwaway demo vault of three invented notes.
// Author facts come from the owner's chaos-kb vault (Profile.md, Skills.md);
// by the owner's choice there is no name, employer or location on the page.

export const facts = {
 measuredCommit: '24c82ad8e23c1446e5d840df13c59834bd91d7e2',
 toolCommit: '3c69fa12b485ee72250f9516d3c4bcb097c20f92',
 rootBefore: '4caab1c3169871f100d6e6f27a5263978a555413009644be398e192c192b9027',
 rootAfter: 'fcb9adaf4dce19bc5284aaa8cb0fe79066a3f7ff8f2057a9d419265b7ed260bc',
 repoUrl: 'https://github.com/DemidovVladimir/chaos-substrate/tree/3c69fa12b485ee72250f9516d3c4bcb097c20f92',
 kbUrl: 'https://github.com/DemidovVladimir/chaos-substrate/blob/3c69fa12b485ee72250f9516d3c4bcb097c20f92/v2/README.md',
};

export const editions = {
 ru: {
  title: 'Chaos Substrate — память кода и дерево Меркла',
  description: 'Как Chaos Substrate отвечает на вопросы о коде по индексу, а не перечитывая файлы: хеши, дерево Меркла, обновление только изменённого и проверка «это уже известно?».',
  start: 'Начать презентацию', sound: 'интро со звуком · 2,4 секунды', skip: 'К содержанию',
  chapters: ['TENGU / ВЫПУСК 05','ПАМЯТЬ ДЛЯ АГЕНТА','ЧТО ЛЕЖИТ В ИНДЕКСЕ','ДЕРЕВО МЕРКЛА','ПОСЛЕ ПРАВКИ','ВОПРОС О ФИЧЕ','НЕСКОЛЬКО РЕПОЗИТОРИЕВ','ЭТО УЖЕ ИЗВЕСТНО?','TENGU / ВЫВОД'],
  titles: ['Интро','Агент снова\nчитает тот же код','Один раз:\nединицы, связи, фичи','Отпечаток\nиз отпечатков','Пересчитывается\nтолько изменённое','Ответ берётся\nиз индекса','Один вопрос.\nЧетыре репозитория.','Точные слова —\nэто поиск, а не модель','Читать меньше.\nДоверять проверяемому.'],
  leads: ['','Chaos Substrate: проиндексировать репозиторий один раз и отвечать на вопросы о фичах по индексу.','Tree-sitter разбирает код, Chaos строит связи и группы, векторы хранятся в Postgres + pgvector.','Хеш каждого уровня считается из хешей уровня ниже.','chaos add сравнивает хеши файлов и делает заново только разницу.','chaos feature "how are embeddings reused on reindex"','chaos feature --all-repos: ответ в каждом репозитории, связи — по дословно найденным именам.','chaos-kb check — личная база знаний из выпуска 04.',''],
  coverStates: [['БЕЗ ПАМЯТИ','поиск → открыть файлы → ответ → забыто'],['С ИНДЕКСОМ','вопрос → точные строки → ещё актуально?']],
  stages: [['Файлы','96','Rust, TypeScript, Python, Markdown…'],['Единицы','1 690','функции, типы, разделы'],['Связи','3 944','вызовы и импорты'],['Фичи','33','группы связанных единиц'],['Векторы','768 чисел','на каждую единицу, в Postgres']],
  stageNotes: ['Файлы читаются один раз: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.','Tree-sitter режет каждый файл на единицы, которые человек назвал бы по имени.','Вызовы и импорты связываются по всему проекту, а не внутри одного файла.','Тесно связанные единицы образуют фичи — по связям, а не по папкам.','Каждая единица становится вектором: числами, которые передают её смысл.'],
  indexFoot: 'Замер 27.10.2026: chaos 1.1.0 на публичной ветке v2 @ 24c82ad8e23c1446e5d840df13c59834bd91d7e2, Apple M4, Ollama embeddinggemma. Первая индексация — 241,51 с.',
  tree: {root:'корень', features:['фича A','фича B'], files:['index.rs','search.rs','budget.rs','feature.rs'], unit:'fn', edited:'pack()', levels:['КОРЕНЬ','ФИЧИ','ФАЙЛЫ','ЕДИНИЦЫ'], same:'то же', redo:'заново'},
  treeNotes: ['У каждой единицы — хеш её текста. Тот же текст — тот же хеш.','Хеш файла — из хешей единиц; хеш фичи — из её файлов; корень — из всех файлов.','Меняем одну функцию: меняются только хеши на её пути — файл, фича, корень.','Равные хеши — равное содержимое. Сохранённый результат можно взять, не перечитывая.'],
  treeFoot: 'Chaos считает SHA-256, chaos-kb — BLAKE3. Дерево Меркла: Ральф Меркл, 1979 (патент США 4 309 569). Git хранит историю по тому же принципу.',
  edit: 'src/domain/budget.rs, внутри pack(): + одна строка-комментарий',
  addRows: [['Файлы, прочитанные заново','1'],['Единицы с новым вектором','5 из 1 690'],['Сводки фич, собранные заново','3 из 33'],['Время chaos add','1,73 с']],
  addNotes: ['Одна строка изменилась внутри одной функции.','chaos add сравнивает хеш каждого файла с сохранённым: заново читается один файл.','Новые векторы — только для единиц, чей текст изменился: 5 из 1 690.','Новая сводка — только у фич, чей хеш сдвинулся: 3 из 33. Готово за 1,73 с.'],
  addFoot: 'Полная переиндексация (reindex --force): 0 новых векторов из 1 690, 20,64 с. Без --force reindex пропускается по Git: тот же коммит и чистая рабочая копия, 0,02 с.',
  route: ['Вопрос → вектор','5 ближайших фич · 39 файлов','смысл + ключевые слова + точные имена','+1 шаг по графу: 16 связей','бюджет 6 000 токенов'],
  excerptsTitle: 'Фрагменты: путь и строки',
  excerpts: [['src/adapters/postgres/index.rs','419–452','Postgres::save_embeddings'],['src/adapters/postgres/index.rs','188–227','Postgres::replace_repo'],['src/adapters/postgres/index.rs','235–339','Postgres::merge_files'],['src/ports/index_store.rs','18–68','IndexStore'],['src/adapters/postgres/index.rs','396–417','Postgres::chunks_missing_embeddings']],
  featureNotes: ['Вопрос один раз становится вектором и сравнивается со сводками фич.','Внутри ближайших фич — поиск по смыслу, словам и точным именам, с общим рейтингом.','Один шаг по вызовам и реализациям добавляет соседей.','11 фрагментов с точными строками, 6 000 токенов, 0,20 с. Повторный вопрос — страница из кеша.'],
  featureFoot: 'Реальный вывод, 27.10.2026: 5 из 11 фрагментов. Повторный запуск: page_cached = true, 0,16 с.',
  featureChip: '11 фрагментов · 6 000 токенов · 0,20 с · страница сохранена',
  lanes: ['КОНТРАКТ','ИНДЕКСАТОР','ВЕБ-ПРИЛОЖЕНИЕ','ДОКУМЕНТАЦИЯ'],
  laneSymbols: ['Vault.depositFor','handleDeposit','useDepositFor','Депозиты › depositFor'],
  rejected: [['amount','обычное слово'],['owner','короче 6 символов']],
  budgetChip: '4 × 1 500 = 6 000 токенов · одна страница',
  crossNotes: ['Тот же вопрос задаётся каждому репозиторию — каждый отвечает по своему индексу.','Имя функции из одного репозитория дословно найдено в коде другого — это связь.','Обычные слова и имена короче шести символов связей не дают.','Одна страница, четыре дорожки. Бюджет делится, ответ — размером с один.'],
  crossFoot: 'Иллюстрация: имена выдуманы, правило связи настоящее. Замер на закрытом проекте из 4 репозиториев при бюджете по умолчанию: 5 803 токена, 13 фрагментов, 7 связей.',
  checks: [['«The stand mixer bowl holds 4.8 litres.»','те же слова → хеш → найден среди листьев','EXACT','Kitchen.md:10 · без эмбеддинга · 0,04 с'],['«When did the car last get an oil change?»','другие слова → вектор → ближайший абзац','SIMILAR 0,56 ≥ 0,38','Car.md:5–6 · 0,18 с'],['«The dog is due for its rabies vaccination in June.»','ничего достаточно близкого','ABSENT 0,20 < 0,38','факт новый → remember · 0,15 с']],
  rootLabels: ['корень','remember','forget'],
  checkNotes: ['Точные слова абзаца: только хеш и поиск среди листьев дерева. Модель не нужна.','Другие слова: сравнивается смысл ближайших абзацев с порогом 0,38.','Ниже порога — знания нет. Такой факт агенту стоит запомнить.','Добавили факт — корень другой. Забыли — корень ровно прежний.'],
  checkFoot: 'Демо-хранилище из трёх выдуманных заметок, chaos-kb 2.0.0, 27.10.2026. «Точно» — целый сохранённый абзац без учёта регистра, пробелов и пунктуации. Порог 0,38 откалиброван на тестовых вопросах.',
  closeLines: ['Индексировать один раз. add — после каждой правки.','Спрашивать через feature; --all-repos — если фича в нескольких репозиториях.','Хеш доказывает «то же самое», но не «верно».'],
  closeNote: 'Поиск по смыслу может промахнуться, а связям между репозиториями нужны точные имена.',
  author: 'Автор — senior AI/ML-инженер: агентные системы и LLMOps, больше 10 лет в продакшене; Rust, TypeScript, Python.',
  links: ['Chaos Substrate 1.1 — код','chaos-kb — README','Выпуск 04: chaos-kb'],
  kbEpisode: 'https://tengucluster.com/episodes/chaos-kb/',
  footer: 'ВЫПУСК 05 / ЗАМЕРЫ 27.10.2026 / chaos 1.1.0 · 3c69fa12b485ee72250f9516d3c4bcb097c20f92',
  script: [
`[Запустить интро со звуком. Через 2,4 секунды перейти к 01.]`,
`Спросите агента, как работает какая-то функция, и он сделает разумную вещь: поищет, откроет файлы, пройдёт по вызовам и ответит. В следующей сессии он сделает всё это заново.

[→ вторая фаза на словах «память о коде».]

Chaos Substrate даёт агенту память о коде. Репозиторий индексируется один раз, а дальше агент спрашивает индекс и получает нужные строки с точными номерами. **Но память полезна, только если понятно, когда она устарела.**`,
`Индексация начинается с tree-sitter — парсера, который режет каждый файл на понятные человеку единицы: функцию, тип, раздел документа. Потом Chaos связывает их по всему проекту: кто кого вызывает, кто что импортирует.

Тесно связанные единицы складываются в группы. Это и есть фичи — их находят по связям, а не по названиям папок. А каждая единица превращается в вектор — набор чисел, который передаёт её смысл.

На собственном коде Chaos это заняло четыре минуты. **Это цена одного раза. Весь фокус в том, чтобы не платить её снова.**`,
`У каждой единицы есть отпечаток — хеш, вычисленный из её текста. Тот же текст — тот же хеш. Изменился один символ — хеш совсем другой.

[→ на «собираются вверх».]

Дальше хеши собираются вверх. Хеш файла считается из хешей его единиц, хеш фичи — из её файлов, корень — из всех файлов. Это дерево Меркла: Ральф Меркл описал его в 1979 году. Git хранит историю так же.

Меняем одну функцию — меняются только хеши на её пути. Всё остальное прежнее. **Значит, одинаковые хеши говорят «ничего не изменилось», не читая ни одной строки.**`,
`После правки запускаем chaos add. Он сравнивает хеш каждого файла на диске с сохранённым и перечитывает только те, что отличаются. В нашем тесте одна изменённая строка обошлась так: один файл, пять новых векторов из почти тысячи семисот единиц и три обновлённые сводки фич. Меньше двух секунд.

Полная пересборка работает по той же идее: если для хеша единицы уже есть вектор, он остаётся. С сохранёнными ответами так же: те же хеши — та же страница. **Индекс свежий. Зададим ему вопрос.**`,
`Как переиспользуются эмбеддинги при переиндексации? Вопрос один раз превращается в вектор и сравнивается со сводками всех фич. Ближайшие фичи становятся областью поиска.

Внутри неё одновременно идут три поиска: по смыслу, по ключевым словам и по точным именам. Один шаг по вызовам добавляет соседей, и всё упаковывается в бюджет токенов.

Одиннадцать фрагментов с путями и точными строками — за пятую долю секунды. Агент читает их, а не весь репозиторий. **Но настоящие фичи редко живут в одном репозитории.**`,
`Смарт-контракт, сервис, который индексирует его события, веб-приложение и документация: четыре репозитория, одна фича. Chaos 1.1 задаёт тот же вопрос каждому, и каждый отвечает по своему индексу.

Потом ответы связываются доказательствами, а не догадками. Если функция, найденная в одном репозитории, дословно упомянута в коде из другого, это связь. Обычные слова и короткие имена не считаются.

Одна страница показывает все четыре дорожки и связи между ними. Бюджет токенов делится между репозиториями, так что ответ остаётся размером с один. **А те же хеши отвечают ещё на один вопрос.**`,
`chaos-kb — личная база знаний из четвёртого выпуска — хранит заметки в обычном Markdown, и каждый абзац там — лист такого же дерева.

Спросите точными словами абзаца, известно ли это уже, — и chaos-kb только посчитает хеш и найдёт его. Без модели: четыре сотых секунды. Если слова другие, сравнивается смысл, с порогом. Ниже порога — факт новый, его стоит запомнить.

[→ последняя фаза: строка корня.]

Добавили факт — корень изменился. Забыли его — корень вернулся ровно к прежнему значению. **Одно сравнение говорит агенту, изменилось ли хоть что-то.**`,
`Итак, порядок короткий. Индексировать один раз. После каждой правки — add. Спрашивать через feature, а если фича живёт в нескольких репозиториях, то сразу во всех.

И помнить о границах. Хеш доказывает, что содержимое то же, но не то, что ответ верный. Поиск по смыслу может промахнуться, а связям между репозиториями нужны точные имена.

Я строю агентные системы, в основном на Rust, TypeScript и Python. Это память, которую я сделал для них.`]
 },
 en: {
  title: 'Chaos Substrate — code memory and the Merkle tree',
  description: 'How Chaos Substrate answers questions about code from an index instead of rereading files: hashes, a Merkle tree, redoing only what changed, and the "already known?" check.',
  start: 'Start presentation', sound: 'intro with sound · 2.4 seconds', skip: 'Skip to content',
  chapters: ['TENGU / EPISODE 05','A MEMORY FOR AGENTS','WHAT THE INDEX HOLDS','THE MERKLE TREE','AFTER AN EDIT','A FEATURE QUESTION','SEVERAL REPOSITORIES','ALREADY KNOWN?','TENGU / TAKEAWAY'],
  titles: ['Intro','Your agent reads\nthe same code again','Index once:\nunits, links, features','A fingerprint\nmade of fingerprints','Only what changed\nis redone','Answers come\nfrom the index','One question.\nFour repositories.','Exact words:\na lookup, not a model','Read less.\nTrust what you can check.'],
  leads: ['','Chaos Substrate: index a repository once, then answer feature questions from the index.','Tree-sitter parses the code, Chaos builds links and groups, vectors live in Postgres + pgvector.','Each level’s hash is computed from the hashes below it.','chaos add compares file hashes and redoes only the difference.','chaos feature "how are embeddings reused on reindex"','chaos feature --all-repos: answered in each repository, linked by names found word for word.','chaos-kb check — the personal knowledge base from episode 04.',''],
  coverStates: [['WITHOUT MEMORY','search → open files → answer → forgotten'],['WITH AN INDEX','ask → exact lines → still current?']],
  stages: [['Files','96','Rust, TypeScript, Python, Markdown…'],['Units','1,690','functions, types, sections'],['Links','3,944','calls and imports'],['Features','33','groups of linked units'],['Vectors','768 numbers','per unit, in Postgres']],
  stageNotes: ['Files are read once: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.','Tree-sitter cuts each file into units a person would name.','Calls and imports are linked across the whole project, not just within a file.','Closely linked units form features — found from the links, not the folders.','Each unit becomes a vector: numbers that capture its meaning.'],
  indexFoot: 'Measured 27.10.2026: chaos 1.1.0 on public branch v2 @ 24c82ad8e23c1446e5d840df13c59834bd91d7e2, Apple M4, Ollama embeddinggemma. First index: 241.51 s.',
  tree: {root:'root', features:['feature A','feature B'], files:['index.rs','search.rs','budget.rs','feature.rs'], unit:'fn', edited:'pack()', levels:['ROOT','FEATURES','FILES','UNITS'], same:'same', redo:'redo'},
  treeNotes: ['Each unit gets a hash of its text. Same text, same hash.','A file’s hash comes from its units; a feature’s from its files; the root from every file.','Change one function: only the hashes on its path change — file, feature, root.','Equal hashes, equal content. A stored result can be reused without reading it again.'],
  treeFoot: 'Chaos uses SHA-256, chaos-kb uses BLAKE3. Merkle tree: Ralph Merkle, 1979 (US patent 4,309,569). Git stores its history on the same principle.',
  edit: 'src/domain/budget.rs, inside pack(): + one comment line',
  addRows: [['Files read again','1'],['Units given a new vector','5 of 1,690'],['Feature summaries rebuilt','3 of 33'],['Time for chaos add','1.73 s']],
  addNotes: ['One line changed inside one function.','chaos add compares each file’s hash with the stored one: one file is read again.','New vectors only for units whose text changed: 5 of 1,690.','A new summary only for features whose hash moved: 3 of 33. Done in 1.73 s.'],
  addFoot: 'Full rebuild (reindex --force): 0 of 1,690 units embedded again, 20.64 s. Without --force, reindex is skipped on Git: same commit and a clean worktree, 0.02 s.',
  route: ['Question → vector','5 closest features · 39 files','meaning + keywords + exact names','+1 step along the graph: 16 edges','budget: 6,000 tokens'],
  excerptsTitle: 'Excerpts: path and lines',
  excerpts: [['src/adapters/postgres/index.rs','419–452','Postgres::save_embeddings'],['src/adapters/postgres/index.rs','188–227','Postgres::replace_repo'],['src/adapters/postgres/index.rs','235–339','Postgres::merge_files'],['src/ports/index_store.rs','18–68','IndexStore'],['src/adapters/postgres/index.rs','396–417','Postgres::chunks_missing_embeddings']],
  featureNotes: ['The question becomes a vector once and is compared with the feature summaries.','Inside the closest features: meaning, keywords and exact names, fused into one ranking.','One step along calls and implementations adds the neighbours.','11 excerpts with exact lines, 6,000 tokens, 0.20 s. Ask again and the page comes from the cache.'],
  featureFoot: 'Real output, 27.10.2026: 5 of the 11 excerpts. Second run: page_cached = true, 0.16 s.',
  featureChip: '11 excerpts · 6,000 tokens · 0.20 s · page saved',
  lanes: ['CONTRACT','INDEXER','WEB APP','DOCS'],
  laneSymbols: ['Vault.depositFor','handleDeposit','useDepositFor','Deposits › depositFor'],
  rejected: [['amount','a plain word'],['owner','under 6 characters']],
  budgetChip: '4 × 1,500 = 6,000 tokens · one page',
  crossNotes: ['The same question goes to each repository — each answers from its own index.','A function name from one repository, found word for word in another’s code, is a link.','Plain words and names shorter than six characters never link.','One page, four lanes. The budget is split, so the answer is the size of one.'],
  crossFoot: 'Illustration: the names are invented, the linking rule is real. Measured on a private four-repository project at the default budget: 5,803 tokens, 13 excerpts, 7 links.',
  checks: [['“The stand mixer bowl holds 4.8 litres.”','same words → hash → found among the leaves','EXACT','Kitchen.md:10 · no embedding · 0.04 s'],['“When did the car last get an oil change?”','other words → vector → nearest paragraph','SIMILAR 0.56 ≥ 0.38','Car.md:5–6 · 0.18 s'],['“The dog is due for its rabies vaccination in June.”','nothing close enough','ABSENT 0.20 < 0.38','new fact → remember · 0.15 s']],
  rootLabels: ['root','remember','forget'],
  checkNotes: ['A paragraph’s exact words: a hash and a lookup among the leaves. No model needed.','Other words: the meaning of the nearest paragraphs is compared against 0.38.','Below the threshold, the knowledge is missing. That fact is worth remembering.','Add a fact and the root changes. Forget it and the root is exactly what it was.'],
  checkFoot: 'Demo vault of three invented notes, chaos-kb 2.0.0, 27.10.2026. “Exact” means a whole stored paragraph, ignoring case, spacing and punctuation. The 0.38 threshold was calibrated on test questions.',
  closeLines: ['Index once. Run add after every edit.','Ask with feature; use --all-repos when a feature spans repositories.','A hash proves “the same”, not “correct”.'],
  closeNote: 'Routing by meaning can miss, and links between repositories need exact names.',
  author: 'Built by a senior AI/ML engineer: agentic systems and LLMOps, 10+ years in production software; Rust, TypeScript, Python.',
  links: ['Chaos Substrate 1.1 — source','chaos-kb — README','Episode 04: chaos-kb'],
  kbEpisode: 'https://tengucluster.com/en/episodes/chaos-kb/',
  footer: 'EPISODE 05 / MEASURED 27.10.2026 / chaos 1.1.0 · 3c69fa12b485ee72250f9516d3c4bcb097c20f92',
  script: [
`[Start the intro with sound. After 2.4 seconds, move to 01.]`,
`Ask a coding agent how a feature works, and it searches, opens files, follows the calls, and answers. Next session, it does all of that again.

[→ second phase on “a memory of the code”.]

Chaos Substrate gives the agent a memory of the code. You index a repository once; after that, the agent asks the index and gets back the exact lines that matter. **But a memory only helps if you can tell when it is out of date.**`,
`Indexing starts with tree-sitter, a parser that cuts every file into units a person would name: a function, a type, a section of a document. Chaos then links the units — who calls whom, who imports what — across the whole project.

Closely linked units form groups — the features, found from the links, not from folder names. Each unit also becomes a vector: a list of numbers that captures its meaning.

On Chaos’s own code that took four minutes. **You pay that once. The trick is never paying it again.**`,
`Every unit gets a fingerprint: a hash computed from its text. Same text, same hash. Change one character, and the hash is completely different.

[→ on “combined upward”.]

The hashes are then combined upward. A file’s hash is made from its units, a feature’s from its files, and the root from every file. This is a Merkle tree, named after Ralph Merkle, who described it in 1979. Git stores its history the same way.

Edit one function, and only the hashes on its path change. Everything else stays the same. **So equal hashes mean nothing changed — without reading a single line.**`,
`After an edit, you run chaos add. It compares each file’s hash with the stored one and rereads only the files that differ. In our test, one changed line meant one file, five units embedded again out of almost seventeen hundred, and three feature summaries rebuilt. Under two seconds.

A full rebuild uses the same idea: a unit whose hash already has a vector keeps it. Saved answers too — same hashes, same page. **The index is current. Let’s ask it something.**`,
`How are embeddings reused on reindex? The question becomes a vector and is compared with every feature’s summary; the closest features become the search area.

Inside them, three searches run together: by meaning, by keywords and by exact names. One step along the calls adds the neighbours, and everything is packed under a token budget.

Eleven excerpts, with files and exact line ranges, in a fifth of a second. The agent reads those, not the repository. **But real features rarely live in one repository.**`,
`A smart contract, the service that indexes its events, the web app and the docs: four repositories, one feature. Chaos 1.1 asks the same question in each, and each answers from its own index.

Then it joins them with evidence, not guesses. When a function found in one repository is named, word for word, in code found in another, that is a link. Plain words and short names don’t count.

One page shows all four with their links, and the token budget is split, so the answer stays the size of one. **The same hashes answer one more question.**`,
`chaos-kb, the personal knowledge base from episode four, keeps notes as plain Markdown, and every paragraph is a leaf of the same kind of tree.

Ask whether a paragraph’s exact words are already known, and it only computes a hash and looks it up. No model: four hundredths of a second. With other words, it compares meaning instead, against a threshold. Below it, the fact is new, and worth remembering.

[→ last phase: the root line.]

Add a fact, and the root changes. Forget it, and the root returns to exactly the old value. **One comparison tells an agent whether anything changed at all.**`,
`The routine is short: index once. Run add after every edit. Ask with feature, across repositories when the feature spans them.

Know the limits. A hash proves content is the same, not that an answer is right. Routing by meaning can miss, and cross-repository links need exact names.

I build agentic systems, mostly in Rust, TypeScript and Python. This is the memory I built for them.`]
 }
};
