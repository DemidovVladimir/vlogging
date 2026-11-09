# TENGU — текущий Cloudflare Pages baseline

Полный снимок: public/, 144 файла (142 static + _headers/_redirects).
Релиз: 164c89c5-ad6a-483f-bc55-d65e570dcceb.
Предыдущий: 213faf4e-df95-4274-8e3d-5941b6173362.
Основной адрес https://tengucluster.com; Pages project tengu-presentations; production main.

## Маршруты

/ — RU-каталог; /en/ — EN-каталог; /ru и /ru/ перенаправляют на /.
EP.01: /episodes/agent-context/ и /en/episodes/agent-context/.
EP.02: /episodes/tengu-cluster/ и /en/episodes/tengu-cluster/.
EP.03: /episodes/emudhra-ca-compromise/ и /en/episodes/emudhra-ca-compromise/.
Старые корневые #slide-N и #intro ведут в EP.01 с сохранением query/hash.

Этот релиз меняет только восемь viewer-файлов EP.03: RU/EN index.html, app.js, journey.js, episode.css. Сценарии отдельно и приватно. EP.01, EP.02, каталоги, меню, медиа и hosting controls побайтно сохранены. H / ?record=1 скрывает меню для записи.

## Следующий релиз

Использовать актуальный artifact-template-tengu-youtube в Codex или Claude. Новые языковые пары добавлять в ОБА каталога и ВСЕ меню. Выполнять check-navigation.mjs и audit-public.mjs из скилла.

Pages deploy заменяет весь сайт: начинать с этого полного baseline, проверять хеши и непосредственно перед deploy сверять удалённый production ID. Не загружать рабочие dist, сценарии, планы, skill, QA, manifests и исходники.

Здесь build.mjs и upload-assets.mjs исторические (EP.01/33 assets), не использовать без адаптации. Сборщик ../tengu-site-navigation/build.mjs тоже привязан к старому снимку.

Последний релиз, QA и receipt: ../tengu-emudhra-cloudflare-revision/.
Его previous/public — полный предыдущий сайт; previous/source — прежняя приватная редакция EP.03.
Его build.mjs воспроизводит конкретный релиз, а не автоматически выбирает последний baseline.

Приватные сценарии EP.03: ../tengu-emudhra-episode/{ru,en}/.
Три HTTPS-origin проверяются по 142 хешам и 144 приватным путям на каждом; финальные результаты в qa/ и deployment-record.json папки релиза. DNS не изменялся.
