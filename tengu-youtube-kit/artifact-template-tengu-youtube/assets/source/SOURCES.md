# Источники и факт-чек — редакция 31

Проверено 21 октября 2026. Номера ниже соответствуют видимым номерам новой презентации. Схемы объясняют принципы, не воспроизводят закрытый сервис.

## 01–02 / Пример и состав контекста

Короткий/длинный ответ на обложке — постановка ситуации, не результаты эксперимента. На 02 показаны согласованные инструкции: короткий формат и процедура проверки фактов. Объём контекста сам по себе не определяет качество ответа.

[OpenAI: Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) описывает инструкции, входные данные и роли сообщений. Под harness в ролике понимается программа вокруг модели, которая собирает вход и организует действия. Реальная упаковка и подгрузка навыков зависят от приложения.

## 03–04 / Обработка текста и attention

[Hugging Face: Tokenizers](https://huggingface.co/learn/llm-course/en/chapter2/4) объясняет разбиение текста. Показанные фрагменты «Состав», «ь», « план» условны, не результат конкретного токенизатора. Токеном также может быть знак или сочетание пробела с текстом.

[Vaswani et al.: Attention Is All You Need](https://arxiv.org/html/1706.03762v7), разделы 3.1–3.5: attention смешивает информацию позиций с вычисляемыми весами связей. Это часть обработки внутри модели. Далее работают другие операции и выходной слой. Обычный инференс не обучает заново параметры.

Сравнение аудиторий — качественная иллюстрация. Линии не измерены, ответы написаны для схемы. Толщина линии не доказывает причину ответа и не задаёт приоритет инструкции. Изменение контекста может изменить состояния и распределения продолжения. Конкретный результат не гарантирован.

Термин «инференс» означает вычисление обученной модели. Провайдер организует сервис, а не является синонимом одной операции или одного прохода. На 03 показан путь одного запроса, без утверждений о загрузке или выгрузке серверных копий.

## 05 / Приоритет

Три пункта и двенадцать подробных шагов — авторский пример разных требований к одному формату. Он не доказывает, что модель обязательно ошибётся. Возможны корректное применение приоритета, уточнение или ошибка.

[OpenAI: Prompt engineering, Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering) подтверждает приоритет developer над user в соответствующем API. Показана упрощённая схема системы, приложения и пользователя. Она не описывает все виды полномочий и не является общим стандартом провайдеров.

Название skill не назначает роль сообщения. Требования внутри навыка могут иметь ограничения и область действия. Нужно проверить, как конкретное приложение передало текст и какие правила разрешения конфликтов действуют. Иерархия — требуемое поведение, не гарантия безошибочного исполнения.

## 06–07 / Возможности и цикл действий

[OpenAI: Function calling](https://developers.openai.com/api/docs/guides/function-calling) описывает запрос инструмента моделью, выполнение действия и возврат результата в следующий вызов. Это отдельный масштаб от генерации токенов одного ответа.

Инструмент выполняет действие, навык задаёт процедуру и может включать материалы/скрипты, требования определяют результат. Это рабочие определения для ролика, а не стандарт всех продуктов. Персона может направлять стиль, но не предоставляет технические права.

## 08 / Недоверенные данные

[OWASP: LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) описывает попытки изменить поведение через инструкции во входе, в том числе через внешние источники. Слайд показывает именно непрямое внедрение из документа. Текст атаки вымышленный и служит учебным примером.

Проверки не дают абсолютной защиты. Ограничение прав и подтверждение чувствительных действий уменьшают возможный ущерб. Этот пример отличается от обычного расхождения собственных настроек.

## 09 / Кэш

[OpenAI: Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) описывает переиспользование промежуточных KV-состояний для совпавшего префикса, а не готового ответа. Требуются подходящая запись кэша и условия сервиса. Совпадение начала необходимо, но само по себе не гарантирует cache hit: учитываются модель, настройки, допустимые границы и другие ограничения.

[Hugging Face: How caching works](https://huggingface.co/docs/transformers/main/en/cache_explanation) объясняет хранение K/V уже обработанных токенов. Эта техническая подоплёка оставлена в источниках, без арифметики в сценарии.

Правка входа исключает переиспользование старого состояния для изменённой части и последующего контекста. Ранее совпавшая часть может сохраниться при выполнении условий. Кэш сам не меняет смысл правил и не гарантирует повтор текста ответа. TTL и цены в выпуске не приводятся.

## 10 / Когда навык портит дизайн

[OpenAI: Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) описывает, как прежние подробные рецепты могут чрезмерно ограничивать более способную модель. Это основание перепроверять настройки, но не доказательство конкретных результатов дизайна на слайде.

Пять состояний страницы мастерской KATA созданы автором презентации. Реальных сравнительных вызовов LLM нет. «Старая» и «новая» — роли в учебном сценарии, не названия и не рейтинг моделей. Улучшение качества и ухудшение от инструкции возможны, но не гарантированы. Модель может иначе истолковать или не выполнить неудачный рецепт.

Задача, текст и предметное изображение сохраняются. В предыстории сравниваются старая модель без навыка и с навыком. Затем новая модель показана без навыка, с прежним и с обновлённым. Переход между старой с навыком и новой без него меняет два условия: называть его чистым измерением качества модели нельзя. Ухудшение выражено в конкуренции акцентов, избыточных границах и снижении визуальной иерархии, а не в заявленных процентах конверсии или финансовых потерях.

[OpenAI: Model optimization](https://developers.openai.com/api/docs/guides/model-optimization) и [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) поддерживают проверку поведения на своих задачах. Для реальной оценки нужны повторные прогоны, одинаковые условия и критерии, а не один красивый макет.

### Предметное изображение для примера

Файл: dist/assets/ceramics-study-v32.png, 1536×1024. Создан встроенным imagegen 21 октября 2026 года, режим новой генерации, непрозрачный фон, без референсов. Используется только как предметная фотография внутри редактируемого HTML-макета. Это не скриншот результата модели и не изображение реального магазина.

Промпт без вариантов и последующих правок:

> Use case: product-mockup. Asset type: editorial product photograph for a fictional ceramic studio website in an educational design comparison. Create one exquisite photographic still life: a tall charcoal-black hand-thrown ceramic vase, a small warm ivory bowl, and a terracotta shallow dish, on a warm limestone plinth against a pale taupe plaster wall. Japanese contemporary craft sensibility, tactile matte surfaces, subtle irregularities, striking natural side light and long soft shadows. Refined art direction suitable for a high-end architecture/design magazine. Objects arranged as a clear simple asymmetric group, well spaced, all fully visible. 3:2 landscape framing, quiet neutral surroundings, object group centered with adequate margins for different crops. Photorealistic. No text, letters, logos, people, UI, borders, graphics, watermarks, or additional decorative objects. Opaque background.

## 11 / Исправление силуэта птицы, v33

Файл: dist/assets/tengu-kaiju-complete-v33.png, 1086×1448, RGBA. Встроенный imagegen, режим редактирования с transparent_background=true. Единственный референс и объект правки — dist/assets/tengu-kaiju-v23.png. Исправлены обрезанные внешние края портрета; сохраняются клюв, красный глаз, перьевая броня и направление взгляда. Используется только в финале; исходник обложки сохранён.

Проверено: альфа-канал прозрачен по всем четырём границам файла, силуэт полностью внутри. Нижняя общая CSS-маска снята с птицы. Это дорисовка растрового изображения, не точное попиксельное продолжение исходника.

Промпт:

> Use case: precise-object-edit / identity-preserve.
> Asset type: repaired transparent character cutout for the closing slide of the existing TENGU presentation.
> Input image: the provided PNG is the edit target and exact visual identity to preserve.
> Repair its cropped silhouette by extending the canvas and completing the missing outer right shoulder and feather tips, left feather tips and crown tips. Preserve the original head, long beak, narrow vermilion eye, left-facing three-quarter pose, charcoal feather armor, aged ivory and gold armor, ribbed neck, serious adult Japanese biomechanical concept-art style, surface texture and lighting. Do not redesign the character.
> Composition: complete head-and-upper-torso bust on true alpha transparency, NOT a full standing body. Entire crown, beak, both outer shoulders, and feathered chest silhouette must be visible inside the canvas. Zoom out enough to leave at least 8% genuinely empty transparent margin at top and both sides, and clear transparent space below. Complete both shoulder contours with organic layered feather/armor edges, with NO straight vertical crop anywhere. Finish the lower bust in naturally tapered layered feather tips, no straight horizontal cutoff, no pedestal or severed-body effect. Preserve relative proportions and recognizable details. Do not add wings spread out, limbs, objects, text, logos, background, floor, backdrop, glow, or shadow outside the subject. Output one isolated high-quality repaired character cutout with actual transparent background.

## Ограничения выпуска

Нет измеренных attention-матриц, бенчмарка моделей или гарантии, что выбранная настройка устранит все ошибки. Отказы из-за ограничений безопасности не объясняются только конфликтом персон или навыков. Исправлять предлагается собственные требования задачи, не правила платформы.
