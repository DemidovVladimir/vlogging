# TENGU — техническая передача дизайнеру и motion-команде

## Короткий бриф, который можно переслать

Нужно работать с готовой айдентикой TENGU для YouTube. Утверждённое направление называется Field Manual: тёплая бумага washi, чёрная тушь sumi, киноварный красный, индиго и состаренное золото; техническая сетка, регистрационные метки, японская печатная материальность и система орбит вокруг красного человеческого ядра.

Логотип уже разработан. Его нельзя перерисовывать, менять количество узлов или генерировать заново. Используйте приложенные SVG. Слово TENGU является оригинальной векторной геометрией, а не наборным шрифтом. Для русского текста используйте Manrope, для технических подписей — IBM Plex Mono.

Главная формула бренда: «Человек задаёт цель. Агенты работают. Результат проверяется».

## Исходные материалы

- Утверждённый референс: `references/approved-field-manual-reference.png`.
- Основной знак: `source/svg/tengu-mark-primary.svg`.
- Малый знак: `source/svg/tengu-mark-simplified.svg`.
- Инверсный знак: `source/svg/tengu-mark-inverse.svg`.
- Чистый вордмарк: `source/svg/tengu-wordmark-custom.svg`.
- Hero-вордмарк: `source/svg/tengu-wordmark-hero.svg`.
- Полные lockup: `tengu-wordmark-horizontal.svg` и `tengu-wordmark-stacked.svg`.
- Иконки категорий: `source/svg/icons/`.
- Макеты: `source/templates/`.
- Видеоисходник: `motion/remotion/`.

## Технические параметры

### Цвета

```text
SUMI        #11110F
WASHI       #E9DFC9
VERMILION   #C92F20
INDIGO      #1D3342
AGED GOLD   #A9853E
```

### Шрифты

Установить TTF из `fonts/`: Manrope Variable; IBM Plex Mono Regular, SemiBold и Bold; Literata Variable и Italic; Shippori Mincho Regular и Bold.

Лицензия каждого семейства лежит рядом с файлами. WOFF2 для веба находятся в `fonts/web/`.

### Размеры

```text
YouTube banner          2560 × 1440
Banner safe area        1546 × 423, centered
Thumbnail               1280 × 720
Video                   1920 × 1080, 30 fps
Avatar                  1024 × 1024
Watermark               150 × 150
Brand system board      1920 × 1280
```

## Работа в Figma, Illustrator или Affinity

1. Импортировать SVG без растрирования.
2. Не объединять знак и текст в один bitmap.
3. Сохранять пропорции и исходные HEX-цвета.
4. Для печати преобразовать только наборный дескриптор в кривые; TENGU уже состоит из кривых.
5. Перед экспортом проверить, что маска фактурного вордмарка сохранилась.
6. Экспортировать PNG в sRGB.

## Работа в After Effects, Premiere, Resolve или Final Cut

- Полная заставка: `tengu-logo-sting.mp4`.
- Полная прозрачная заставка: `tengu-logo-sting-alpha.mov`.
- Только движущийся символ: `tengu-symbol-motion.mp4`.
- Только символ с alpha: `tengu-symbol-motion-alpha.mov`.
- Перебивки: `tengu-chapter-bumper-light.mp4` и `tengu-chapter-bumper-dark.mp4`.
- Исходный WAV: `tengu-sting.wav`.

ProRes 4444 импортировать с интерпретацией straight alpha. Если монтажная система определила premultiplied alpha, переключить вручную и проверить края красной дуги.

## Remotion-проект

Путь: `motion/remotion/`.

```text
TenguLogoSting                 72 кадра / 2,4 с / фон + полный lockup
TenguLogoStingTransparent      72 кадра / alpha + полный lockup
TenguSymbolMotion              72 кадра / фон + только символ
TenguSymbolMotionTransparent   72 кадра / alpha + только символ
TenguChapterBumperLight        90 кадров / 3 с
TenguChapterBumperDark         90 кадров / 3 с
```

Запуск и рендер:

```bash
cd motion/remotion
npm install
npm run studio
npm run render:sting
npm run render:alpha
npm run render:symbol
npm run render:symbol-alpha
npm run render:chapter-light
npm run render:chapter-dark
```

## Motion-тайминг

```text
0–8       красный квадрат
8–26      выход шести узлов
14–40     прорисовка орбит и маршрутов
28–49     появление чёрной и красной дуг
43–62     появление вордмарка в полной версии
62–72     чистая выдержка
```

Не менять геометрию между кадрами. Нельзя поручать эту часть text-to-video модели.

## Аудио

- 48 kHz, 16-bit, stereo WAV master.
- Шесть сухих щелчков соответствуют узлам.
- Короткий воздушный sweep соответствует дугам.
- Низкий удар фиксирует итоговую систему.
- В финальном монтаже проверить относительную громкость с голосом ведущего.

## Контроль качества

- SVG проходит XML-валидацию.
- Вордмарк не заменён шрифтом.
- Нет обрезанных элементов.
- MP4: H.264, 1920×1080, 30 fps, stereo.
- Alpha master: ProRes 4444, alpha-capable pixel format.
- Обложка читается при ширине около 320 px.
- Баннер проверен во всех YouTube crop-режимах.

## Что можно менять без нового согласования

- Заголовок выпуска.
- Номер и название категории.
- Подзаголовок главы.
- Светлая или тёмная тема.
- Фотография или атмосферная фактура в разрешённой зоне.

## Что требует согласования

- Геометрия знака и слова TENGU.
- Палитра и количество узлов.
- Смена базовых шрифтов.
- Новый тип анимации логотипа.

