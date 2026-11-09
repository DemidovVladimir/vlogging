// Private editorial source for TENGU EP.05 (Chaos Substrate). Never published.
// Revision 9 (27.10.2026): chaos 1.2 and chaos-kb dropped their Merkle trees. Scene 03 now explains the
// design that is left — every saved result is keyed by the hash of exactly its own input — and why the
// tree was unnecessary here (a tree pays when someone checks without holding the data, like an Ethereum
// light client against stateRoot; the index holds its data). Scene 04 measures 1.1 against 1.2 on the
// same snapshot and the same edit. Pitched from the author's chaos-kb vault (Web3: Solana/SVM and EVM;
// AI: RAG pipelines, embeddings and cosine similarity). Scene 07 shows real queries against that vault.
// Every number below was measured on 27.10.2026; see ru/SOURCES.md and en/SOURCES.md.
// Measured code: public branch v2 of DemidovVladimir/chaos-substrate at
// ed73a5e0c80651cf6f8c19b8e8c3942186a5f109 (chaos 1.2.0 from 5a8ecca6c5f973d023abd05cef4f71d174180208,
// chaos-kb 2.0.0 without the vault root), compared with chaos 1.1.0 from
// 3c69fa12b485ee72250f9516d3c4bcb097c20f92. Apple M4, Ollama embeddinggemma.
// By the owner's choice there is no name, employer or location on the page: the knowledge-base
// queries were chosen so that their whole output (--limit 2) comes from Skills.md only.

export const facts = {
 measuredCommit: 'ed73a5e0c80651cf6f8c19b8e8c3942186a5f109',
 toolCommit: '5a8ecca6c5f973d023abd05cef4f71d174180208',
 oldToolCommit: '3c69fa12b485ee72250f9516d3c4bcb097c20f92',
 repoUrl: 'https://github.com/DemidovVladimir/chaos-substrate/tree/ed73a5e0c80651cf6f8c19b8e8c3942186a5f109',
 kbUrl: 'https://github.com/DemidovVladimir/chaos-substrate/blob/ed73a5e0c80651cf6f8c19b8e8c3942186a5f109/v2/README.md',
};

// Verbatim passages returned by chaos-kb (Skills.md), with the words highlighted in phase 2.
const web3 = ['Skills.md:15', 'Web3', 'Web3 is my secondary area: Solana / SVM (Rust), Sui Move, EVM (Solidity, Foundry), the x402 payment protocol and agent-controlled wallets.', ['Solana / SVM (Rust)', 'EVM (Solidity, Foundry)']];
const ai = ['Skills.md:3', 'AI and ML', 'My AI and ML skills: generative and agentic AI, LLMOps, RAG pipelines, self-evaluation loops, prompt engineering, LangChain, HuggingFace (Inference, Transformers, ML training), Amazon Rekognition, embeddings and cosine similarity, model post-training, GPU acceleration with PyCUDA.', ['RAG pipelines', 'embeddings and cosine similarity']];
const hit = ([id, section, text, marks], score) => ({id, section, score, text, marks});

export const editions = {
 ru: {
  title: 'Chaos Substrate — память кода без дерева Меркла',
  description: 'Как индекс кода узнаёт, что после правки ещё годится: каждый сохранённый результат лежит под хешем ровно своего входа. Почему дерево Меркла здесь оказалось лишним — с замером. И настоящий поиск по базе знаний chaos-kb.',
  start: 'Начать презентацию', sound: 'интро со звуком · 2,4 секунды', skip: 'К содержанию',
  chapters: ['TENGU / ВЫПУСК 05','ПАМЯТЬ ДЛЯ АГЕНТА','ЧТО ЛЕЖИТ В ИНДЕКСЕ','КЛЮЧ — ХЕШ ВХОДА','ПОСЛЕ ПРАВКИ','ВОПРОС О ФИЧЕ','НЕСКОЛЬКО РЕПОЗИТОРИЕВ','ПОИСК В БАЗЕ ЗНАНИЙ','TENGU / ВЫВОД'],
  titles: ['Интро','Агент снова\nчитает тот же код','Один раз:\nединицы, связи, фичи','Каждый результат —\nпод хешем своего входа','Пересчитывается\nтолько изменённое','Ответ берётся\nиз индекса','Один вопрос.\nЧетыре репозитория.','Ищут векторы.\nОтпечаток узнаёт.','Читать меньше.\nДоверять проверяемому.'],
  leads: ['','Chaos Substrate: проиндексировать репозиторий один раз и отвечать на вопросы о фичах по индексу.','Tree-sitter разбирает код, Chaos строит связи и группы, векторы хранятся в Postgres + pgvector.','Ключ — хеш ровно того, из чего сделан результат. Дерево Меркла оказалось лишним.','chaos add сравнивает хеши файлов и делает заново только разницу.','chaos feature "how are embeddings reused on reindex"','chaos feature --all-repos: ответ в каждом репозитории, связи — по дословно найденным именам.','chaos-kb — база знаний автора из выпуска 04. Настоящие запросы, 27.10.2026.',''],
  coverStates: [['БЕЗ ПАМЯТИ','поиск → открыть файлы → ответ → забыто'],['С ИНДЕКСОМ','вопрос → точные строки → ещё актуально?']],
  stages: [['Файлы','96','Rust, TypeScript, Python, Markdown…'],['Единицы','1 707','функции, типы, разделы'],['Связи','3 954','вызовы и импорты'],['Фичи','34','группы связанных единиц'],['Векторы','768 чисел','на каждую единицу, в Postgres']],
  stageNotes: ['Файлы читаются один раз: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.','Tree-sitter режет каждый файл на единицы, которые человек назвал бы по имени.','Вызовы и импорты связываются по всему проекту, а не внутри одного файла.','Тесно связанные единицы образуют фичи — по связям, а не по папкам.','Векторы — самая дорогая часть: с готовыми векторами та же сборка идёт 22,24 с вместо 264,08.'],
  indexFoot: 'Замер 27.10.2026: chaos 1.2.0 на публичной ветке v2 @ ed73a5e0c80651cf6f8c19b8e8c3942186a5f109, Apple M4, Ollama embeddinggemma. Первая индексация — 264,08 с; reindex --force с готовыми векторами — 22,24 с.',
  ledger: {
   head: ['Вход','Ключ','Что сохранено','После правки pack()'],
   rows: [
    ['единица pack(): код + заголовок с путём и строками','SHA-256(заголовок + код)','вектор, 768 чисел','≠ новый вектор',true],
    ['файл budget.rs: его байты','SHA-256(байты файла)','разбор: единицы, связи','≠ разобран заново',true],
    ['сводка фичи: её текст','SHA-256(модель + текст)','вектор сводки','= из базы',false],
   ],
   then: [['chaos 1.1 · дерево Меркла','ключ сводки — хеш всех файлов фичи','4 сводки заново'],['chaos 1.2 · свой вход','ключ сводки — хеш её текста','0 сводок заново']],
  },
  ledgerNotes: ['Вектор лежит под хешем своей единицы: её кода и заголовка с путём и строками. Тот же хеш — вектор годится.','Так же — всё остальное: разбор файла под хешем его байтов, вектор сводки под хешем её текста и модели.','Правим pack(): меняются хеши единицы и файла — их делают заново. Текст сводки тот же — вектор из базы.','В 1.1 ключом сводки был хеш дерева над всеми файлами фичи: любая правка в них делала сводку заново.'],
  ledgerFoot: 'Ключи — из кода chaos 1.2. Числа 1.1 и 1.2 — один снимок кода, одна правка, замер 27.10.2026 (сцена 04). Дерево Меркла: Ральф Меркл, 1979. stateRoot и лёгкие клиенты: ethereum.org.',
  edit: 'src/domain/budget.rs, внутри pack(): + одна строка-комментарий',
  addRows: [['Файлы, разобранные заново','1 из 96'],['Единицы с новым вектором','5 из 1 707'],['Сводки фич, эмбеддинг заново','0 из 34'],['Время chaos add','1,34 с']],
  addNotes: ['Одна строка-комментарий внутри pack().','chaos add сравнивает хеш каждого файла с тем, что видел индекс: заново разобран 1 файл из 96.','Новый вектор — только у 5 единиц: pack() и тех, у кого сдвинулись строки. 1 702 вектора взяты из базы.','Текст сводок не изменился — ни одна сводка не эмбеддилась заново. Всё — за 1,34 с.'],
  addFoot: 'Та же правка в chaos 1.1 на том же коде: 4 сводки заново, 6 фич изменились, связей 3 954 → 3 952 (ошибка add, найдена при удалении дерева и исправлена в 1.2). Почему не время файла и не git diff: смена ветки туда и обратно обновляет время, а код тот же; git не знает, что индекс видел в прошлый раз.',
  route: ['Вопрос → вектор','5 ближайших фич · 49 файлов','смысл + ключевые слова + точные имена','+1 шаг по графу: 16 связей','бюджет 6 000 токенов'],
  excerptsTitle: 'Фрагменты: путь и строки',
  excerpts: [['src/adapters/postgres/index.rs','412–445','Postgres::save_embeddings'],['src/adapters/postgres/index.rs','183–222','Postgres::replace_repo'],['src/ports/index_store.rs','18–58','IndexStore'],['src/adapters/postgres/index.rs','329–367','Postgres::merge_files'],['src/application/feature.rs','1390–1440','tests::page_written_once_then_cached']],
  featureNotes: ['Вопрос один раз становится вектором и сравнивается со сводками фич.','Внутри ближайших фич — поиск по смыслу, словам и точным именам, с общим рейтингом.','Один шаг по вызовам и реализациям добавляет соседей.','16 фрагментов с точными строками, 5 980 из 6 000 токенов, 0,14 с. Повторный вопрос — страница из кеша.'],
  featureFoot: 'Реальный вывод, 27.10.2026: первые 5 из 16 фрагментов. Повторный запуск: page_cached = true, 0,12 с.',
  featureChip: '16 фрагментов · 5 980 токенов · 0,14 с · страница сохранена',
  lanes: ['КОНТРАКТ','ИНДЕКСАТОР','ВЕБ-ПРИЛОЖЕНИЕ','ДОКУМЕНТАЦИЯ'],
  laneSymbols: ['Vault.depositFor','handleDeposit','useDepositFor','Депозиты › depositFor'],
  rejected: [['amount','обычное слово'],['owner','короче 6 символов']],
  budgetChip: '4 × 1 500 = 6 000 токенов · одна страница',
  crossNotes: ['Тот же вопрос задаётся каждому репозиторию — каждый отвечает по своему индексу.','Имя функции из одного репозитория дословно найдено в коде другого — это связь.','Обычные слова и имена короче шести символов связей не дают.','Одна страница, четыре дорожки. Бюджет делится, ответ — размером с один.'],
  crossFoot: 'Иллюстрация: имена выдуманы, правило связи настоящее. Замер chaos 1.1.0 на закрытом проекте из 4 репозиториев при бюджете по умолчанию: 5 803 токена, 13 фрагментов, 7 связей; в 1.2 этот код не менялся.',
  kb: {
   cmd: 'chaos-kb search "Что автор умеет в блокчейне и в эмбеддингах?" --limit 2',
   hits: [hit(web3,'0,42'),hit(ai,'0,39')],
   chip: '2 абзаца · по смыслу · 0,11 с',
   checksTitle: 'chaos-kb check — «это уже известно?»',
   checks: [['Тот же абзац Skills.md:15, слово в слово','EXACT','отпечаток абзаца · без модели · 0,04 с'],['«Какие блокчейны знает автор?»','SIMILAR 0,45 ≥ 0,38','Skills.md:15 · 0,16 с'],['«У автора есть лицензия пилота.»','ABSENT 0,25 < 0,38','факта нет · 0,15 с']],
   sync: ['chaos-kb sync --dry-run','5 заметок · 22 абзаца · эмбеддить: 0','абзац получает вектор, только когда его хеш новый · 0,04 с'],
  },
  checkNotes: ['Вопрос по-русски, заметки по-английски, и слова blockchain в них нет. Нашли векторы, по смыслу: 0,11 с.','Так агент готовил этот выпуск: база ответила «Web3 и RAG» — отсюда stateRoot и векторы выше.','Дословный абзац база узнаёт по отпечатку — хешу его слов, без модели: 0,04 с.','Ключи те же, что в 03: вектор абзаца — под хешем его текста. Корня над всей базой больше нет.'],
  checkFoot: 'Настоящие запросы к базе автора, chaos-kb 2.0.0 из того же коммита, 27.10.2026; время — медиана трёх запусков. «Слово в слово» — целый абзац без учёта регистра, пробелов и пунктуации. Порог 0,38 откалиброван на тестовых вопросах.',
  closeLines: ['Индексировать один раз. add — после каждой правки. Вопросы — через feature.','Ключ — хеш ровно своего входа. Дерево — когда проверяют без данных.','Хеш доказывает «то же самое», но не «верно».'],
  closeNote: 'Поиск по смыслу может промахнуться, а связям между репозиториями нужны точные имена.',
  author: 'Автор — senior AI/ML-инженер: агентные системы и LLMOps, больше 10 лет в продакшене; Rust, TypeScript, Python.',
  links: ['Chaos Substrate 1.2 — код','chaos-kb — README','Выпуск 04: chaos-kb'],
  kbEpisode: 'https://tengucluster.com/episodes/chaos-kb/',
  footer: 'ВЫПУСК 05 / ЗАМЕРЫ 27.10.2026 / chaos 1.2.0 · ed73a5e0c80651cf6f8c19b8e8c3942186a5f109',
  script: [
`[Запустить интро со звуком. Через 2,4 секунды перейти к 01.]`,
`Спросите агента, как работает функция, и он поищет, откроет файлы, пройдёт по вызовам и ответит. В следующей сессии — всё заново.

[→ вторая фаза на словах «память о коде».]

Chaos Substrate даёт агенту память о коде. Репозиторий индексируется один раз, а дальше агент спрашивает индекс и получает нужные строки с точными номерами. **Но индекс — это кеш. И главный вопрос к любому кешу: что в нём ещё правда после правки?**`,
`Индексация начинается с tree-sitter: парсер режет каждый файл на единицы — функцию, тип, раздел документа. Chaos связывает их по всему проекту, кто кого вызывает и импортирует, и складывает тесно связанные единицы в фичи.

[→ последняя фаза: векторы.]

Каждая единица становится вектором, и это самая дорогая часть: первая сборка — больше четырёх минут, с готовыми векторами — двадцать две секунды.

Кто строил RAG, знает следующий вопрос. **Поменял одну функцию — какие из тысячи семисот векторов теперь устарели?**`,
`Каждый сохранённый результат лежит под ключом — хешем того, из чего он сделан. Вектор единицы — под хешем её кода вместе с путём и номерами строк. Тот же хеш — вектор годится.

[→ на «так же».]

Так же и остальное: разбор файла — под хешем его байтов, вектор сводки — под хешем её текста и модели.

[→ правка.]

Правим pack(): меняются хеши единицы и файла, их делают заново. Текст сводки тот же — её вектор берут из базы.

[→ последняя фаза.]

В версии 1.1 было ещё дерево Меркла: хеш фичи собирался из хешей её файлов, как stateRoot в блоке Ethereum. Такое дерево нужно лёгкому клиенту: он сверяет аккаунт с заголовком блока, не храня состояние. Наш индекс данные хранит и так ничего не сверял, а хеш фичи менялся от любой правки — и сводки с тем же текстом эмбеддились заново. Дерево убрали. **Ключ — хеш ровно своего входа.**`,
`После правки запускаем chaos add. Он сравнивает хеш каждого файла на диске с тем, что видел индекс, — не дату изменения и не только git diff.

Одна строка-комментарий обошлась так: один файл из девяноста шести, пять новых векторов и ни одной сводки — за секунду с небольшим. Версия 1.1 на том же коде эмбеддила четыре сводки и теряла две связи; эту ошибку нашли, когда убирали дерево. **Индекс снова свежий. Зададим ему вопрос.**`,
`Как переиспользуются эмбеддинги при переиндексации? Вопрос становится вектором и сравнивается со сводками фич; ближайшие фичи становятся областью поиска. Внутри идут три поиска сразу: по смыслу, по словам и по точным именам, плюс один шаг по вызовам.

Шестнадцать фрагментов с путями и строками — меньше чем за пятую долю секунды. **Но настоящие фичи редко живут в одном репозитории.**`,
`Контракт, индексатор его событий, веб-приложение и документация: четыре репозитория, одна фича. Chaos задаёт вопрос каждому, и каждый отвечает по своему индексу.

Связь появляется, только если имя функции из одного репозитория дословно найдено в коде другого. Обычные слова и короткие имена не считаются. Всё — на одной странице, а бюджет токенов делится, так что ответ размером с один. **Тот же приём работает в личной базе знаний. Покажу на настоящем запросе.**`,
`chaos-kb — база знаний из четвёртого выпуска. Вот запрос к моей базе: что автор умеет в блокчейне и в эмбеддингах? Вопрос по-русски, заметки по-английски, а слова blockchain в них нет вообще. Абзацы нашли векторы, по смыслу, за десятую долю секунды.

[→ вторая фаза.]

Так агент и готовил этот выпуск: спросил базу, от чего отталкиваться, и получил Web3 и RAG.

[→ третья фаза.]

Дословный абзац база узнаёт по отпечатку — хешу его слов, без модели.

[→ последняя фаза: строка sync.]

И ключи здесь те же: абзац получает вектор, только когда его хеш новый. Корня над всей базой здесь тоже нет. **Ищут векторы, а хеш входа говорит, что из сохранённого ещё годится.**`,
`Итак. Индексировать один раз, после каждой правки — add, спрашивать через feature, а по нескольким репозиториям — сразу во всех.

Каждый результат — под хешем своего входа, и пересчитывается только то, что правда изменилось. Дерево нужно, когда проверяют без данных. А хеш доказывает, что содержимое то же, но не то, что ответ верный.

Я строю агентные системы, в основном на Rust, TypeScript и Python. Это память, которую я сделал для них.`]
 },
 en: {
  title: 'Chaos Substrate — code memory without a Merkle tree',
  description: 'How a code index knows what still holds after an edit: every saved result is keyed by the hash of exactly its own input. Why a Merkle tree turned out to be unnecessary here, measured. Plus a real search of the chaos-kb knowledge base.',
  start: 'Start presentation', sound: 'intro with sound · 2.4 seconds', skip: 'Skip to content',
  chapters: ['TENGU / EPISODE 05','A MEMORY FOR AGENTS','WHAT THE INDEX HOLDS','KEYED BY ITS INPUT','AFTER AN EDIT','A FEATURE QUESTION','SEVERAL REPOSITORIES','SEARCHING THE KNOWLEDGE BASE','TENGU / TAKEAWAY'],
  titles: ['Intro','Your agent reads\nthe same code again','Index once:\nunits, links, features','Every result is keyed\nby its own input','Only what changed\nis redone','Answers come\nfrom the index','One question.\nFour repositories.','Vectors search.\nFingerprints recognise.','Read less.\nTrust what you can check.'],
  leads: ['','Chaos Substrate: index a repository once, then answer feature questions from the index.','Tree-sitter parses the code, Chaos builds links and groups, vectors live in Postgres + pgvector.','The key is the hash of exactly what a result is made from. The Merkle tree turned out to be unnecessary.','chaos add compares file hashes and redoes only the difference.','chaos feature "how are embeddings reused on reindex"','chaos feature --all-repos: answered in each repository, linked by names found word for word.','chaos-kb — the author’s knowledge base from episode 04. Real queries, 27.10.2026.',''],
  coverStates: [['WITHOUT MEMORY','search → open files → answer → forgotten'],['WITH AN INDEX','ask → exact lines → still current?']],
  stages: [['Files','96','Rust, TypeScript, Python, Markdown…'],['Units','1,707','functions, types, sections'],['Links','3,954','calls and imports'],['Features','34','groups of linked units'],['Vectors','768 numbers','per unit, in Postgres']],
  stageNotes: ['Files are read once: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.','Tree-sitter cuts each file into units a person would name.','Calls and imports are linked across the whole project, not just within a file.','Closely linked units form features — found from the links, not the folders.','Vectors are the expensive part: with the vectors already there, the same build takes 22.24 s instead of 264.08.'],
  indexFoot: 'Measured 27.10.2026: chaos 1.2.0 on public branch v2 @ ed73a5e0c80651cf6f8c19b8e8c3942186a5f109, Apple M4, Ollama embeddinggemma. First index: 264.08 s; reindex --force with the vectors already there: 22.24 s.',
  ledger: {
   head: ['Input','Key','What is saved','After editing pack()'],
   rows: [
    ['unit pack(): code + a header with path and lines','SHA-256(header + code)','vector, 768 numbers','≠ new vector',true],
    ['file budget.rs: its bytes','SHA-256(file bytes)','parse: units, links','≠ parsed again',true],
    ['feature summary: its text','SHA-256(model + text)','summary vector','= from storage',false],
   ],
   then: [['chaos 1.1 · Merkle tree','a summary keyed by the hash of all its feature’s files','4 summaries redone'],['chaos 1.2 · its own input','a summary keyed by the hash of its text','0 summaries redone']],
  },
  ledgerNotes: ['A vector is stored under the hash of its unit: its code plus a header with path and lines. Same hash: the vector still fits.','Everything else works the same way: a file’s parse under the hash of its bytes, a summary’s vector under the hash of its text and model.','Edit pack(): the unit’s and the file’s hashes change, so those are redone. The summary text is the same: its vector is reused.','In 1.1 a summary was keyed by a tree hash over all its feature’s files, so any edit to them redid the summary.'],
  ledgerFoot: 'Keys as in the chaos 1.2 code. The 1.1 and 1.2 numbers: one code snapshot, one edit, measured 27.10.2026 (scene 04). Merkle tree: Ralph Merkle, 1979. stateRoot and light clients: ethereum.org.',
  edit: 'src/domain/budget.rs, inside pack(): + one comment line',
  addRows: [['Files parsed again','1 of 96'],['Units given a new vector','5 of 1,707'],['Feature summaries embedded again','0 of 34'],['Time for chaos add','1.34 s']],
  addNotes: ['One comment line inside pack().','chaos add compares each file’s hash with what the index saw: 1 file of 96 is parsed again.','A new vector for only 5 units: pack() and those whose line numbers moved. 1,702 vectors are reused.','No summary text changed, so no summary was embedded again. All in 1.34 s.'],
  addFoot: 'The same edit with chaos 1.1 on the same code: 4 summaries redone, 6 features changed, links 3,954 → 3,952 (an add bug, found while removing the tree and fixed in 1.2). Why not file times or git diff: switching branches and back gives a file a new time with the same code, and git does not know what the index saw last time.',
  route: ['Question → vector','5 closest features · 49 files','meaning + keywords + exact names','+1 step along the graph: 16 edges','budget: 6,000 tokens'],
  excerptsTitle: 'Excerpts: path and lines',
  excerpts: [['src/adapters/postgres/index.rs','412–445','Postgres::save_embeddings'],['src/adapters/postgres/index.rs','183–222','Postgres::replace_repo'],['src/ports/index_store.rs','18–58','IndexStore'],['src/adapters/postgres/index.rs','329–367','Postgres::merge_files'],['src/application/feature.rs','1390–1440','tests::page_written_once_then_cached']],
  featureNotes: ['The question becomes a vector once and is compared with the feature summaries.','Inside the closest features: meaning, keywords and exact names, fused into one ranking.','One step along calls and implementations adds the neighbours.','16 excerpts with exact lines, 5,980 of 6,000 tokens, 0.14 s. Ask again and the page comes from the cache.'],
  featureFoot: 'Real output, 27.10.2026: the first 5 of 16 excerpts. Second run: page_cached = true, 0.12 s.',
  featureChip: '16 excerpts · 5,980 tokens · 0.14 s · page saved',
  lanes: ['CONTRACT','INDEXER','WEB APP','DOCS'],
  laneSymbols: ['Vault.depositFor','handleDeposit','useDepositFor','Deposits › depositFor'],
  rejected: [['amount','a plain word'],['owner','under 6 characters']],
  budgetChip: '4 × 1,500 = 6,000 tokens · one page',
  crossNotes: ['The same question goes to each repository — each answers from its own index.','A function name from one repository, found word for word in another’s code, is a link.','Plain words and names shorter than six characters never link.','One page, four lanes. The budget is split, so the answer is the size of one.'],
  crossFoot: 'Illustration: the names are invented, the linking rule is real. Measured with chaos 1.1.0 on a private four-repository project at the default budget: 5,803 tokens, 13 excerpts, 7 links; 1.2 did not change this code.',
  kb: {
   cmd: 'chaos-kb search "What does the author know about blockchains and embeddings?" --limit 2',
   hits: [hit(web3,'0.40'),hit(ai,'0.36')],
   chip: '2 passages · by meaning · 0.11 s',
   checksTitle: 'chaos-kb check — “already known?”',
   checks: [['The same paragraph, Skills.md:15, word for word','EXACT','the paragraph’s fingerprint · no model · 0.04 s'],['“Which blockchains does the author know?”','SIMILAR 0.50 ≥ 0.38','Skills.md:15 · 0.15 s'],['“The author holds a private pilot licence.”','ABSENT 0.30 < 0.38','not stored · 0.15 s']],
   sync: ['chaos-kb sync --dry-run','5 notes · 22 passages · to embed: 0','a passage gets a vector only when its hash is new · 0.04 s'],
  },
  checkNotes: ['The notes never say “blockchain”. Vectors found these passages by meaning, in 0.11 s.','This episode was prepared the same way: the base answered “Web3 and RAG”, hence stateRoot and vectors above.','A stored paragraph’s exact words are recognised by fingerprint — the hash of its words — with no model: 0.04 s.','Same keys as in 03: a passage’s vector sits under the hash of its text. There is no root over the whole base any more.'],
  checkFoot: 'Real queries against the author’s vault, chaos-kb 2.0.0 from the same commit, 27.10.2026; times are the median of three runs. “Word for word” means a whole paragraph, ignoring case, spacing and punctuation. The 0.38 threshold was calibrated on test questions.',
  closeLines: ['Index once. Run add after every edit. Ask with feature.','Key each result by its own input. A tree is for checking without the data.','A hash proves “the same”, not “correct”.'],
  closeNote: 'Routing by meaning can miss, and links between repositories need exact names.',
  author: 'Built by a senior AI/ML engineer: agentic systems and LLMOps, 10+ years in production software; Rust, TypeScript, Python.',
  links: ['Chaos Substrate 1.2 — source','chaos-kb — README','Episode 04: chaos-kb'],
  kbEpisode: 'https://tengucluster.com/en/episodes/chaos-kb/',
  footer: 'EPISODE 05 / MEASURED 27.10.2026 / chaos 1.2.0 · ed73a5e0c80651cf6f8c19b8e8c3942186a5f109',
  script: [
`[Start the intro with sound. After 2.4 seconds, move to 01.]`,
`Ask a coding agent how a feature works: it searches, opens files, follows the calls, and answers. Next session, it does it all again.

[→ second phase on “a memory of the code”.]

Chaos Substrate gives the agent a memory of the code. Index a repository once; after that, the agent asks the index and gets back the exact lines. **But an index is a cache. And the first question about a cache is: what in it is still true after an edit?**`,
`Indexing starts with tree-sitter, a parser that cuts every file into units: a function, a type, a section of a document. Chaos links them across the project and groups closely linked units into features.

[→ last phase: vectors.]

Each unit also becomes a vector — the expensive part: over four minutes for the first build, twenty-two seconds when the vectors are already there.

If you have built RAG, you know the next question. **You changed one function. Which of seventeen hundred vectors are now stale?**`,
`Every saved result is stored under a key: the hash of what it was made from. A unit’s vector sits under the hash of its code, path and line numbers. Same hash, and the vector still fits.

[→ on “the same way”.]

The same goes for the rest: a file’s parse under the hash of its bytes, a summary’s vector under the hash of its text and the model.

[→ the edit.]

Edit pack(): the unit’s and the file’s hashes change, so those are redone. The summary text is the same, so its vector is reused.

[→ last phase.]

Version 1.1 also had a Merkle tree: a feature’s hash built from its files’ hashes, like stateRoot in an Ethereum block. That kind of tree serves a light client, which checks an account against a block header without holding the state. Our index holds its data, so it never checked anything that way, and the feature hash changed on every edit, re-embedding summaries whose text was the same. We removed the tree. **The key is the hash of exactly its own input.**`,
`After an edit, you run chaos add. It compares each file’s hash on disk with what the index saw — not file times, and not just git diff.

One comment line cost one file of ninety-six, five new vectors and no summaries, in just over a second. Version 1.1 on the same code re-embedded four summaries and lost two links — a bug we found while removing the tree. **The index is current. Let’s ask it something.**`,
`How are embeddings reused on reindex? The question becomes a vector and is compared with the feature summaries; the closest features become the search area. Inside, it searches by meaning, keywords and exact names, plus one step along the calls.

Sixteen excerpts with exact line ranges, in under a fifth of a second. **But real features rarely live in one repository.**`,
`A contract, the indexer of its events, the web app and the docs: four repositories, one feature. Chaos asks each, and each answers from its own index.

A link appears only when a function name from one repository is found word for word in another’s code. It is one page, and the budget is split, so the answer stays the size of one. **The same idea runs a personal knowledge base. Here is a real query.**`,
`chaos-kb is the knowledge base from episode four. A query to mine: what does the author know about blockchains and embeddings? The word “blockchain” is nowhere in my notes; vectors found these passages by meaning, in a tenth of a second.

[→ second phase.]

That is how this episode was prepared: the agent asked my knowledge base what to build on and got Web3 and RAG.

[→ third phase.]

Exact words are recognised by fingerprint — the hash of a paragraph’s words — with no model.

[→ last phase: the sync line.]

And the keys are the same: a passage gets a vector only when its hash is new. No root over the whole base here either. **Vectors search; the input’s hash tells you what still holds.**`,
`So: index once, run add after every edit, ask with feature — across repositories when a feature spans them.

Key every result by its own input, and only what really changed is redone. A tree is for checking without the data. And a hash proves content is the same, not that an answer is right.

I build agentic systems, mostly in Rust, TypeScript and Python. This is the memory I built for them.`]
 }
};
