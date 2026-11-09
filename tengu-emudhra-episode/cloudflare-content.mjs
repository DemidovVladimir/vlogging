// Article-led, independently worded explanation. Narration never enters public JS.
export const slug='emudhra-ca-compromise';
export const checked='2026-10-23';
export const sources={
 cloudflare:['Cloudflare · incident report','https://blog.cloudflare.com/emudhra-certificate-compromise'],
 google:['Google · affected keys','https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/'],
 tunnel:['cloudflared · 2026.10.2','https://github.com/cloudflare/cloudflared/releases/tag/2026.10.2'],
 strict:['Cloudflare · Full (strict)','https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/'],
 mtls:['Cloudflare · custom mTLS CA','https://developers.cloudflare.com/ssl/client-certificates/byo-ca/'],
 containers:['Cloudflare · HTTPS egress','https://developers.cloudflare.com/containers/configuration/outbound-traffic/'],
 curl:['curl · certificate verification','https://curl.se/docs/sslcerts.html'],
 requests:['Requests · TLS verification','https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification'],
 docker:['Docker · rebuild images','https://docs.docker.com/build/building/best-practices/#rebuild-your-images-often'],
 node:['Node.js · CA configuration','https://nodejs.org/api/cli.html#node_extra_ca_certsfile'],
 test:['Dennis Jackson · checks','https://emudhra.we-have-a-problem.com/'],
 mozilla:['Mozilla · OneCRL response','https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/'],
 upki:['Canonical · upki','https://discourse.ubuntu.com/t/an-update-on-upki/77063']
};
const p=(ru,en)=>({ru,en});
export const scenes=[
{kind:'cover',seconds:36,src:['cloudflare','google'],
 title:p('HTTPS есть.\nДоверия больше нет.','HTTPS still works.\nTrust does not.'),
 lead:p('eMudhra: как ошибка удостоверяющего центра превращается в задачу для всей инфраструктуры.','eMudhra: how a certificate-authority failure becomes an infrastructure-wide problem.'),
 labels:p(['8 промежуточных сертификатов','Шифрование','Соединение защищено','Подлинность','Сервер может быть чужим'],['8 intermediate certificates','Encryption','Connection encrypted','Identity','Server may be an impostor']),
 frames:p(['Ключи CA оказались слабыми. Подпись больше не доказывает, кто перед нами.','Поддельный сертификат + перехват соединения → риск чтения и подмены трафика.'],['Weak CA keys undermine what a trusted signature proves.','Forged certificate + intercepted connection → traffic can be read or altered.']),
 foot:p('Cloudflare не обнаружила эксплуатации на своих сервисах. Отчёт от 20.10.2026.','Cloudflare found no exploitation on its services. Report: 20 Oct 2026.'),
 script:p(`Представь: соединение зашифровано, адрес выглядит правильно, а разговариваешь ты не с тем сервером. В случае eMudhra проблема именно в этом. У восьми промежуточных сертификатов оказались слабыми закрытые ключи. Они позволяют создавать поддельные сертификаты, которым ещё доверяет часть программ.

Это не означает, что кто-то научился расшифровывать любой HTTPS. Для атаки нужно ещё оказаться на пути соединения, а клиент должен принять подделку. Ломается подтверждение личности сервера.

**Теперь вопрос: как убрать это доверие не из одного браузера, а из целой инфраструктуры?**`,
`Imagine an encrypted connection to the right-looking address, but the server is an impostor. Weak private keys associated with eight eMudhra intermediate certificates made fraudulent certificates possible. Some software could still trust them.

An attacker still needs to intercept the connection, and the client must accept the certificate. The failure is in proving the server's identity, not breaking HTTPS encryption.

**How do you remove that trust across an entire infrastructure, rather than one browser?**`)},
{kind:'response',seconds:35,src:['cloudflare','strict'],
 title:p('Cloudflare тоже проверяет чужие серверы','Cloudflare verifies other servers, too'),
 lead:p('Проверка нужна не только между браузером и сайтом.','Verification is not limited to the browser-to-website connection.'),
 labels:p(['Браузер','Cloudflare','Origin-сервер','Приложение','Внешний API','Здесь Cloudflare — TLS-клиент'],['Browser','Cloudflare','Origin server','Application','External API','Here Cloudflare is the TLS client']),
 frames:p(['Пользователь проверяет Cloudflare. Но за этим соединением есть следующее.','Cloudflare → origin и приложение → API: приоритет исправлений.','Общие хранилища и образы обновлены; встроенные хранилища проверены отдельно.'],['The visitor verifies Cloudflare. There is another connection behind it.','Cloudflare → origin and application → API: mitigation priorities.','Shared stores and images updated; bundled stores assessed separately.']),
 foot:p('20.10 UTC: 02:00 клиенты · 09:15 cloudflared · 19:20 CDN / серверный Zero Trust. По отчёту Cloudflare.','20 Oct UTC: 02:00 clients · 09:15 cloudflared · 19:20 CDN / server-side Zero Trust. Cloudflare timeline.'),
 script:p(`Cloudflare начала с исходящих соединений, обновила общие хранилища доверия и образы, отдельно проверила встроенные хранилища. Исправления активировали перезапусками и развёртываниями.

На схеме две проверки. Сначала браузер убеждается, что перед ним Cloudflare. Затем Cloudflare обращается к исходному серверу сайта — origin — и сама проверяет его сертификат. Так работает Full strict. Это разные участки, а не один длинный защищённый туннель.

**Значит, важно не только получить исправление, но и понять, какая работающая программа его использует.**`,
`Cloudflare prioritized outbound connections, updated shared trust stores and images, assessed bundled stores separately, and activated fixes through restarts and deployments.

The browser verifies Cloudflare. Then Cloudflare connects to the website's origin and verifies its certificate. That is Full strict: separate connections, not one continuous protected tunnel.

**So downloading a fix is only part of the job. Which running program actually uses it?**`)},
{kind:'activation',seconds:40,src:['docker','node','curl'],
 title:p('Новый файл ≠ работающий патч','A new file is not a running fix'),
 lead:p('Пример доставки исправления: обновили основу, затем заменили работающий экземпляр.','Illustrative rollout: update the foundation, then replace the running instance.'),
 labels:p(['Основа обновлена','CA / библиотека / образ','Работающий сервис','Его собственная проверка TLS','Старый экземпляр','Новый экземпляр','Подделка проходит','Подделка отклонена','Пересборка → развёртывание'],['Foundation updated','CA / library / image','Running service','Its own TLS verification','Old instance','New instance','Forgery accepted','Forgery rejected','Rebuild → redeploy']),
 frames:p(['Исправление уже доступно. Запущенный экземпляр ещё не изменился.','Обновляем нужную зависимость и доставляем её в приложение.','Повторная проверка подтверждает изменение поведения.'],['The fix is available. The running instance has not changed yet.','Update the relevant dependency and deliver it into the application.','A new verification check confirms the changed behaviour.']),
 foot:p('Иллюстрация, не измеренный тест. Конкретный шаг — reload, restart или redeploy — зависит от программы.','Illustration, not a measured test. Reload, restart or redeploy depends on the application.'),
 script:p(`Вот пример. Новый базовый образ уже скачан, но сервис продолжает работать в старом контейнере. Файл появился на диске, а поведение приложения осталось прежним. Чтобы оно изменилось, надо собрать и развернуть новый экземпляр.

Бывает и другая граница: программа читает настройки доверия только при запуске. Например, дополнительный набор CA в Node.js задаётся при старте процесса. Изменить переменную внутри уже работающей программы недостаточно.

Здесь нет универсальной кнопки «обновить всё». Нужно найти свой компонент и способ применить его обновление.

**Начнём с программ, которые клиент устанавливает сам.**`,
`You downloaded a new base image, but the service still runs in an old container. The file on disk changed; the application did not. Build and deploy the new instance.

Some programs load trust configuration only at startup. Node.js reads its additional CA setting when the process starts. Changing that environment variable inside a running program does not reload it.

There is no universal update button. Identify the component and how its update takes effect.

**Start with the software customers install themselves.**`)},
{kind:'clients',seconds:35,src:['cloudflare','tunnel'],
 title:p('Клиентские программы — отдельный шаг','Client software needs its own update'),
 lead:p('Обновление облачного сервиса не заменяет программу на вашем устройстве.','A cloud-side fix does not replace the software on your device.'),
 labels:p(['One Client / WARP','Обновить под свою платформу','1.1.1.1','Обновить приложение','cloudflared','Исправление: 2026.10.2','Контейнер с cloudflared','Новый образ → redeploy'],['One Client / WARP','Update for your platform','1.1.1.1','Update the application','cloudflared','Security release: 2026.10.2','Containerized cloudflared','New image → redeploy']),
 frames:p(['Проверьте установленную версию, а не только наличие релиза.','cloudflared — отдельная программа; контейнер тоже нужно переразвернуть.','Gateway + актуальный клиент: условие защиты, указанное Cloudflare.'],['Check the installed version, not just whether a release exists.','cloudflared is a separate program; containers need redeployment too.','Gateway + an up-to-date client: Cloudflare’s stated protection condition.']),
 foot:p('Версии зафиксированы на дату отчёта. Актуальные исправления и платформенные сборки — в источниках.','Versions are a dated incident snapshot. Check the sources for current fixes and platform builds.'),
 script:p(`Здесь проверь не только название продукта, но и установленную сборку.

Для Tunnel есть конкретная точка отсчёта: исправление cloudflared вышло в версии 2026.10.2. Это название релиза, а не обещание, что он установлен у тебя. Если Tunnel работает в контейнере, проверь образ именно запущенного экземпляра.

Для остальных клиентов выбирай сборку своей платформы по ссылке на отчёт: номера у мобильных и настольных приложений разные. Сам факт использования Cloudflare ещё не описывает всю конфигурацию защиты.

**А у владельца сервера есть ещё свои сертификаты и правила доверия.**`,
`Check the installed build, not just the product name.

For Tunnel, cloudflared 2026.10.2 is the security release. Its existence does not prove it is installed. In a container deployment, check the image of the running instance.

For other clients, use the report's platform links: mobile and desktop versions differ. “We use Cloudflare” does not describe the full protection configuration.

**Server operators also own certificates and trust decisions of their own.**`)},
{kind:'ownership',seconds:41,src:['strict','mtls'],
 title:p('Кого проверяете: сервер или клиента?','Whose identity are you checking?'),
 lead:p('Две разные настройки. Замена одной не исправляет другую.','Two separate configurations. Fixing one does not fix the other.'),
 labels:p(['Full (strict)','Cloudflare','Origin','Проверить сертификат сервера','mTLS','Клиент','Ваш сервис','Проверить доверенные CA клиентов'],['Full (strict)','Cloudflare','Origin','Review the server certificate','mTLS','Client','Your service','Review trusted client CAs']),
 frames:p(['На origin нужен действительный сертификат для нужного имени и доверенной цепочки.','В mTLS сервис проверяет клиента — по настроенному набору CA.','Проверяйте обе стороны. Не отключайте проверку ради исчезновения ошибки.'],['The origin needs a valid certificate for its hostname and a trusted chain.','With mTLS, the service checks the client against configured CAs.','Review both directions. Do not disable verification to silence an error.']),
 foot:p('Схема показывает направление проверки личности, а не все сообщения TLS-handshake.','The arrows show identity verification, not every message in the TLS handshake.'),
 script:p(`В режиме Full strict Cloudflare проверяет сертификат твоего origin-сервера: срок, имя и доверенную цепочку. Если доверие к цепочке потеряно, одного работающего браузера недостаточно. На origin может понадобиться замена сертификата.

В mTLS направление другое: уже сервис проверяет сертификат клиента. Если ты загружал свои удостоверяющие центры, решение зависит и от этого набора. Нельзя считать, что замена серверного сертификата автоматически исправила проверку клиентов.

Ошибка после обновления требует разобраться с сертификатом и конфигурацией. Отключать проверку — значит убрать саму защиту.

**У контейнеров появляется ещё один выбор: где именно проверять внешний сервер.**`,
`In Full strict mode, Cloudflare checks your origin certificate: validity, hostname and trust chain. If that chain is no longer trusted, a working browser tells you little about the origin connection. The origin certificate may need replacing.

With mTLS, the direction changes: the service checks the client's certificate. If you uploaded your own certificate authorities, that configured set matters too. Replacing a server certificate does not automatically repair client authentication.

An error after an update calls for checking the certificate and configuration. Disabling verification removes the protection itself.

**Containers add another choice: where to verify the external server.**`)},
{kind:'egress',seconds:39,src:['containers'],
 title:p('Контейнер: кто принимает решение?','Containers: who makes the trust decision?'),
 lead:p('С HTTPS interception меняется место проверки внешнего сервера.','HTTPS interception changes where the external server is verified.'),
 labels:p(['Контейнер','Внешний API','Проверка внутри приложения','Cloudflare','Проверка внешнего сервера','HTTPS interception включён','Без перехвата','Перехваченное соединение'],['Container','External API','Application verifies','Cloudflare','Verifies external server','HTTPS interception enabled','Without interception','Intercepted connection']),
 frames:p(['Обычный исходящий HTTPS: приложение использует свой механизм доверия.','При настроенном перехвате внешний сервер проверяет Cloudflare.','Это не защита всего контейнера: граница — перехваченные соединения.'],['Ordinary outbound HTTPS uses the application’s trust mechanism.','With interception configured, Cloudflare verifies the external server.','This does not secure the whole container: the boundary is intercepted connections.']),
 foot:p('Перехват — opt-in. Приложению также нужно доверять CA перехвата; образ и зависимости не перестают требовать обновлений.','Interception is opt-in. The app must also trust the interception CA; images and dependencies still need maintenance.'),
 script:p(`По умолчанию приложение в контейнере само проверяет внешний HTTPS-сервер. Его библиотеки и настройки доверия остаются частью задачи.

У Cloudflare Containers можно настроить перехват исходящего HTTPS. Тогда соединение разделяется: приложение доверяет CA перехвата, а внешний сервер проверяет инфраструктура Cloudflare. На схеме перемещается именно эта проверка, а не всё приложение.

Перехват надо включить и настроить. Он не делает безопасным любой трафик контейнера и не отменяет обновления зависимостей. Поэтому вопрос звучит конкретно: проходит ли нужное соединение через эту проверку?

**Тот же вопрос стоит задать своему SDK.**`,
`By default, an application inside a container verifies an external HTTPS server itself. Its libraries and trust configuration remain part of the problem.

Cloudflare Containers can intercept outbound HTTPS. This splits the connection: the application trusts the interception CA, while Cloudflare infrastructure verifies the external server. The diagram moves that verification decision, not the entire application.

Interception must be enabled and configured. It does not secure every kind of container traffic or remove the need to maintain dependencies. Ask a specific question: does this connection actually pass through that verifier?

**Ask the same question about your SDK.**`)},
{kind:'dependency',seconds:44,src:['requests','curl','test'],
 title:p('Ищите проверку под SDK','Look underneath the SDK'),
 lead:p('Обновился верхний слой. Изменилось ли решение о доверии?','The top layer changed. Did the trust decision change with it?'),
 labels:p(['SDK','HTTP-библиотека','TLS + CA','Удалённый сервер','Браузер: отказ','Приложение: ?','Приложение: отказ','Проверка включена'],['SDK','HTTP library','TLS + CA','Remote server','Browser: rejected','Application: ?','Application: rejected','Verification enabled']),
 frames:p(['Вызов API проходит через зависимости. Решение принимается ниже SDK.','Результат браузера не проверяет другой TLS-стек.','Проверяем реальное приложение: плохая цепочка отклонена, нормальная работает.'],['An API call passes through dependencies. Verification happens below the SDK.','A browser result does not test a different TLS stack.','Check the real app: reject the bad chain, keep valid connections working.']),
 foot:p('Не отключать проверку сертификата. Демонстрация условная; слайд не выполняет сетевые тесты.','Do not disable certificate verification. Illustrative states; the slide runs no network tests.'),
 script:p(`SDK отправляет запрос через HTTP-библиотеку, а та опирается на TLS и выбранные сертификаты доверия. Например, Python Requests обычно использует пакет certifi; можно задать и другой набор CA. Поэтому новая версия SDK ещё ничего не говорит о том, что происходит ниже.

Даже curl бывает собран с разными TLS-библиотеками и источниками доверия. Успешная проверка одним инструментом — не проверка всех остальных.

Проверяй путь самого приложения. Ожидаем два результата: недоверенная цепочка отклоняется, нормальное соединение продолжает работать. Общая сетевая ошибка не доказывает, что исправление сработало.

**Именно здесь разовая установка патча превращается в постоянную работу с доверием.**`,
`An SDK sends its request through an HTTP library, which relies on TLS and a selected set of trusted certificates. Python Requests, for example, normally uses certifi; a different CA bundle can also be configured. A new SDK version tells you little about what changed underneath.

Even curl can use different TLS backends and trust sources. A successful check with one tool is not a check of every other program.

Test the application's own path. Expect two outcomes: an untrusted chain is rejected, and a valid connection still works. A generic network failure does not prove that the fix succeeded.

**This is where a one-off patch becomes an ongoing trust-management problem.**`)},
{kind:'closing',seconds:32,src:['cloudflare','mozilla','upki','test'],
 title:p('Доверие должно уметь обновляться','Trust needs an update path'),
 lead:p('Список CA — начало. Скорость доставки запрета тоже важна.','A CA list is only the beginning. Revocation must reach the verifier.'),
 labels:p(['Браузеры: быстрый отзыв','Инфраструктура: разные пути обновления','Проверка: внутри вашего приложения'],['Browsers: rapid revocation','Infrastructure: multiple update paths','Verification: inside your application']),
 frames:p(['Firefox доставил блокировку через OneCRL без обновления самого браузера.','upki развивает механизм доставки отзывов для Linux-программ.','Найдите проверяющий компонент → примените исправление → проверьте результат.'],['Firefox delivered a OneCRL block without a browser update.','upki brings revocation infrastructure to Linux software.','Find the verifier → apply the fix → confirm the result.']),
 foot:p('Разбор TENGU по отчёту Cloudflare и документации продуктов. Не перевод и не официальная публикация Cloudflare.','An independent TENGU explanation based on Cloudflare’s report and product documentation. Not an official Cloudflare publication.'),
 script:p(`Браузеры умеют быстро доставлять запрет доверия. Firefox, например, распространил блокировку через OneCRL без обязательного обновления самого браузера. Но другие программы не обязаны получать тот же механизм вместе со списком корневых сертификатов.

Проект upki пытается закрыть этот разрыв для Linux: доставлять сведения об отзывах системным утилитам и языковым средам. Это направление развития, а не уже включённая защита любого сервера.

Практический итог: найди компонент, который проверяет сертификат, доставь исправление до работающей программы и проверь её поведение. Не только версию пакета.

Спасибо за просмотр.`,
`Browsers can distribute urgent trust changes quickly. Firefox delivered this block through OneCRL without requiring a browser update. Other software does not automatically inherit that mechanism when it uses a related root-certificate list.

The upki project aims to close that gap for Linux utilities and language runtimes by distributing revocation information. It is a direction for infrastructure, not a claim that every server already has that protection enabled.

The practical takeaway: identify the verifier, deliver the fix into the running program, and check its behaviour. Do not stop at a package version.

Thanks for watching.`)}
];
