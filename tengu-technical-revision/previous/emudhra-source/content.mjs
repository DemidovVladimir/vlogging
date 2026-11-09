// Private authoring source. Only visual fields enter public viewer files.
export const slug='emudhra-ca-compromise';
export const checked='2026-10-22';
export const sources={
 bug:['Mozilla / incident','https://bugzilla.mozilla.org/show_bug.cgi?id=2083449'],
 fenko:['Ali Mosajjal / analysis','https://fenko.nz/blog/emudhra-ca-compromise/'],
 hub:['Dennis Jackson / checks','https://emudhra.we-have-a-problem.com/'],
 google:['Google / response','https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/'],
 cf:['Cloudflare / response','https://blog.cloudflare.com/emudhra-certificate-compromise'],
 curl:['curl / verification','https://curl.se/docs/sslcerts.html'],
 pkix:['RFC 5280 / certificates','https://www.rfc-editor.org/rfc/rfc5280.html'],
 tls:['RFC 8446 / TLS','https://www.rfc-editor.org/rfc/rfc8446.html']
};
const pair=(ru,en)=>({ru,en});
export const scenes=[
{kind:'cover',seconds:36,src:['hub'],
 title:pair('Браузер блокирует.\nА приложение?','The browser blocks it.\nDoes your app?'),
 lead:pair('eMudhra: почему отозванный сертификат ещё может работать.','eMudhra: why a revoked certificate can still be accepted.'),
 labels:pair(['Один сертификат. Разный результат.'],['Same certificate. Different result.']),
 frames:pair(['В браузере — отказ.','В другой программе — соединение может пройти.'],['The browser rejects it.','Another application may still connect.']),
 foot:pair('Срез на 22.10.2026 · Схема, не тест вашего устройства.','As of 22 Oct 2026 · Illustration, not a test of your device.'),
 script:pair(`Представь: браузер отказывается открывать соединение с опасным сертификатом. А программа на том же компьютере его принимает. Не потому, что она отключила HTTPS. Шифрование есть. Но правила проверки оказались другими.

Именно такой разрыв важен в истории eMudhra. У удостоверяющего центра обнаружили слабые закрытые ключи. Сертификаты отозвали, браузеры получили защиту — но это не исправило автоматически каждую программу.

**Давай разберём одну цепочку: что сломалось, как возникает подмена и где проверять защиту.**`,
`Imagine your browser rejects a connection with a dangerous certificate, but an application on the same computer accepts it. The application has not necessarily switched off HTTPS. Encryption is still there. The difference is how it checks whom it is connecting to.

That gap matters in the eMudhra incident. A certificate authority had weak private keys. Certificates were revoked and browsers received protection, but that did not automatically fix every application.

**Let’s follow one thread: what broke, how impersonation becomes possible, and where to check the protection.**`)},
{kind:'trust',seconds:61,src:['bug','fenko','pkix'],
 title:pair('Сломался ключ, которым заверяют сайты','The key that vouches for websites failed'),
 lead:pair('Сертификат связывает имя сайта с его открытым ключом. Издатель заверяет эту связь.','A certificate links a website name to its public key. The issuer signs that link.'),
 labels:pair(['Доверенный издатель','Удостоверяющий центр · CA','Настоящий сайт','Сертификат для его имени','Закрытый ключ','Один из ключей: 4','Поддельный сайт','Сертификат для чужого имени'],['Trusted issuer','Certificate authority · CA','Real website','Certificate for its name','Private key','One of the keys: 4','Impersonating site','Certificate for someone else’s name']),
 frames:pair(['В норме только издатель может поставить свою цифровую подпись.','Ключи оказались настолько слабыми, что их можно было восстановить.','С этим ключом поддельный сертификат тоже получает проверяемую подпись.'],['Normally, only the issuer can produce its digital signature.','The keys were so weak that other people could recover them.','With that key, a forged certificate can carry a verifiable signature too.']),
 foot:pair('Упрощено: доверие к издателю идёт по цепочке до корня в хранилище клиента. Алгоритм шифрования не взломан.','Simplified: trust in the issuer follows a chain to a root in the client’s trust store. The encryption algorithm was not broken.'),
 script:pair(`Когда ты подключаешься к сайту, мало зашифровать данные. Нужно убедиться, что на другом конце именно тот сайт. Для этого сервер показывает сертификат: имя сайта, его открытый ключ и подпись издателя.

Издателя называют удостоверяющим центром, или CA. Программа проверяет его полномочия по цепочке сертификатов до корня, которому уже доверяет. Для подписи нужен закрытый ключ. Он должен быть известен только владельцу.

У восьми промежуточных центров eMudhra ключи оказались легко восстанавливаемыми. Один буквально равнялся четырём. Это не сломанная математика шифрования, а неправильные ключи. Шесть относились к HTTPS, два — к подписи программ.

Имея такой ключ, посторонний может заверить поддельный сертификат для чужого сайта. **Но сертификат сам по себе ещё не перенаправляет к нему твой трафик.**`,
`Encrypting a connection is not enough. You also need to know that the other end is the website you intended to reach. The server presents a certificate: its name, its public key, and the issuer’s signature.

That issuer is a certificate authority, or CA. Your application checks its authority through a certificate chain leading back to a root it already trusts. Producing the signature requires a private key that only the owner should know.

Eight eMudhra intermediate authorities had easily recoverable keys. One was literally four. The encryption mathematics did not fail; the keys were generated incorrectly. Six affected authorities were for HTTPS and two for signing software.

Someone who recovers a key can sign a forged certificate for another website. **But a certificate alone does not redirect your traffic to the attacker.**`)},
{kind:'attack',seconds:43,src:['tls','cf'],
 title:pair('Шифрование есть. Собеседник — не тот.','Encrypted. But to the wrong endpoint.'),
 lead:pair('Для подмены нужны две вещи: соединение приходит к атакующему, а клиент принимает его сертификат.','Impersonation needs both: the connection reaches the attacker, and the client accepts the certificate.'),
 labels:pair(['Твоё приложение','Настоящий сервис','Посредник','Поддельный сертификат','Клиент принимает подделку','Посредник видит и меняет данные','Старый трафик','Два зашифрованных соединения'],['Your application','Real service','Intermediary','Forged certificate','Client accepts the forgery','Intermediary can read and change data','Old traffic','Two encrypted connections']),
 frames:pair(['Обычно приложение соединяется с настоящим сервисом.','Атакующий оказался на пути и предъявил поддельный сертификат.','Если приложение его приняло, шифрование заканчивается у посредника.'],['Normally, your application connects to the real service.','An attacker intercepts the connection and presents a forged certificate.','If the application accepts it, encryption ends at the intermediary.']),
 foot:pair('Схема риска, не воспроизведённая атака. Ключ CA сам по себе не раскрывает старые сессии с прямой секретностью.','Threat illustration, not a reproduced attack. The CA key alone does not reveal old sessions protected by forward secrecy.'),
 script:pair(`Допустим, атакующий уже может перехватить соединение. Он показывает сертификат с нужным именем и подписью скомпрометированного центра. Если приложение принимает его, оно устанавливает защищённое соединение не с тем участником.

Посредник может отдельно соединиться с настоящим сервисом. Получаются два зашифрованных канала, а между ними — тот, кто читает и меняет данные. Поэтому «у нас же HTTPS» здесь недостаточно.

Это не означает, что ключ центра открывает все старые записи трафика. При прямой секретности прошлые сеансовые ключи из него не восстанавливаются. **Решающий вопрос сейчас другой: почему приложение вообще приняло подделку?**`,
`Suppose an attacker can already intercept the connection. They present a certificate with the expected name, signed using the compromised authority’s key. If the application accepts it, it establishes an encrypted connection with the wrong party.

The intermediary can separately connect to the real service. There are two encrypted channels, with someone in the middle who can read and change the relayed data. Saying “we use HTTPS” does not settle the question.

This does not unlock every old traffic capture. With forward secrecy, the authority’s key cannot recover those past session keys. **The immediate question is simpler: why did the application accept the forgery?**`)},
{kind:'compare',seconds:54,src:['google','hub','curl'],
 title:pair('Один сертификат. Две проверки.','One certificate. Two sets of checks.'),
 lead:pair('Проверяемый сертификат одинаковый. Правила программы — разные.','Keep the certificate the same. Change the application’s verification rules.'),
 labels:pair(['Сертификат от опасного CA','Подпись математически верна','Браузер с защитой','Учитывает блокировку CA','ОТКАЗ','Программа без этой защиты','Старая цепочка ещё допустима','МОЖЕТ ПРИНЯТЬ'],['Certificate from the compromised CA','The signature is mathematically valid','Protected browser','Applies the CA block','REJECTED','Application without that protection','Old chain is still acceptable','MAY ACCEPT']),
 frames:pair(['Правильная подпись ещё не означает, что издателю по-прежнему можно доверять.','Браузер применяет дополнительные проверки и блокировки.','Другая программа может пользоваться своим набором доверенных сертификатов и правил.'],['A valid signature does not prove the issuer should still be trusted.','The browser applies additional checks and blocks.','Another application may use a separate set of trusted certificates and rules.']),
 foot:pair('Иллюстрация различий, не результат проверки любого curl или всей ОС. Конкретная сборка и настройки имеют значение.','Illustrative comparison, not a verdict on every curl build or an entire OS. The actual build and settings matter.'),
 script:pair(`Подпись отвечает на вопрос: сертификат действительно подписан соответствующим ключом? Она не отвечает на вопрос: можно ли этому ключу ещё доверять?

Браузеры применяют дополнительные правила. Например, Certificate Transparency — требование подтверждений от публичных журналов сертификатов. В этом инциденте оно уже мешало подделкам. Затем появились прямые блокировки опасных ключей.

А отдельная программа может проверять только допустимую цепочку и имя, не применяя нужную блокировку или проверку журналов. Даже на том же компьютере она может читать собственный файл доверенных сертификатов.

Поэтому результат браузера нельзя переносить на терминальную утилиту, сервер или HTTP-инструмент агента. **Защиту нужно доставить именно туда, где устанавливается соединение.**`,
`A signature answers one question: was this certificate signed with the corresponding key? It does not answer another: should we still trust that key?

Browsers apply additional rules. Certificate Transparency, for example, requires evidence from public certificate logs. In this incident, that requirement already prevented the forgeries from working against clients enforcing it. Direct blocks on the dangerous keys followed.

A separate application might accept the chain and website name without applying the relevant block or transparency check. Even on the same computer, it may read its own file of trusted certificates.

So a browser result cannot clear a command-line tool, a server, or an AI agent’s HTTP tool. **The protection must reach the software that actually opens the connection.**`)},
{kind:'update',seconds:42,src:['cf','curl'],
 title:pair('Обновили систему. А саму программу?','System updated. What about the app?'),
 lead:pair('Тот же тестовый сертификат. Меняем только защиту работающей программы.','The same test certificate. Only the running application’s protection changes.'),
 labels:pair(['Система','Обновлена','Работающее приложение','Своя TLS-библиотека / сертификаты','СТАРАЯ ЗАЩИТА','НОВАЯ ЗАЩИТА','Сертификат принят','Сертификат отклонён','Обновление → перезапуск / новая сборка'],['System','Updated','Running application','Its own TLS library / certificates','OLD PROTECTION','NEW PROTECTION','Certificate accepted','Certificate rejected','Update → restart / rebuild as needed']),
 frames:pair(['Обновление системы не обязательно меняет встроенные зависимости приложения.','Обновляем нужный компонент и запускаем исправленную версию.','Теперь та же программа отклоняет тот же опасный сертификат.'],['Updating the system may leave the application’s bundled dependencies unchanged.','Update the relevant component and run the corrected version.','Now the same application rejects the same dangerous certificate.']),
 foot:pair('Иллюстрация исправления. Нужные действия зависят от приложения; следуйте инструкции его поставщика.','Illustration of a fix. Required steps depend on the application; follow its vendor’s guidance.'),
 script:pair(`Вот типичная ловушка: система обновлена, а программа всё ещё работает со старой встроенной библиотекой или своим набором сертификатов. На экране меняем не сайт и не запрос — только защиту этой программы.

Сначала выясняем, какой компонент проверяет сертификат. Затем ставим рекомендованное исправление. Иногда достаточно обновления приложения, иногда нужен перезапуск, а для собственного сервиса — новая сборка и развёртывание. Обновлённый пакет на компьютере не гарантирует, что он уже работает внутри контейнера.

**Но и установленное исправление — ещё не финал. Проверим, что изменилось поведение.**`,
`Here is a common trap: the system is updated, but the application still runs an old bundled library or uses its own certificate bundle. In this illustration, we change neither the website nor the request—only the application’s protection.

First, identify the component that verifies certificates. Then apply the recommended fix. An application update may be enough. Other cases require a restart, or a rebuild and deployment of your own service. An updated package on the host does not prove the copy inside a container has changed.

**Installing a fix is not the finish line. Check that the behavior actually changed.**`)},
{kind:'verify',seconds:47,src:['hub'],
 title:pair('Проверяем отказ, а не просто ошибку','Check rejection, not just an error'),
 lead:pair('Запускаем проверку из нужного приложения, а не из соседнего браузера.','Test through the actual application, not a convenient browser next to it.'),
 labels:pair(['Контролируемый тестовый адрес','Из руководства по инциденту','Сертификат принят','Защита этого пути не сработала','Отказ проверки сертификата','Проверить причину и цепочку','Таймаут / ошибка DNS','О защите ничего не говорит'],['Controlled test endpoint','From the incident guide','Certificate accepted','This verification path is not protected','Certificate validation failed','Confirm the reason and chain','Timeout / DNS error','Tells us nothing about protection']),
 frames:pair(['Тестовые адреса предъявляют сертификаты с затронутыми цепочками.','Нужен отказ именно в доверии к сертификату.','Сетевой сбой не доказывает, что программа защищена.'],['The test endpoints present certificates using affected chains.','Look for a rejection of the certificate’s trust.','A network failure does not prove the application is protected.']),
 foot:pair('Полный набор проверок — по ссылке. Страница их не запускает. Не отключайте проверку сертификата ради успешного запроса.','Follow the link for the full test set. This page runs no tests. Do not disable certificate validation to make a request succeed.'),
 script:pair(`В руководстве Dennis Jackson есть контролируемые тестовые адреса. Они позволяют проверить, доверяет ли клиент затронутым цепочкам. Используй именно то приложение и тот сетевой путь, которые хочешь проверить. Владелец тестового сервиса увидит запрос.

Если сертификат принят — этому пути нужна защита. Если получена ошибка сертификата, проверь причину и цепочку: корпоративный прокси мог подставить свою. А таймаут или ошибка DNS вообще не отвечают на вопрос о доверии.

У затронутых сертификатов есть несколько цепочек, поэтому одного адреса недостаточно. Полный набор есть по ссылке. И не добавляй флаг, отключающий проверку сертификата: так можно спрятать проблему, но не исправить её.

**Теперь вернёмся к вопросу с первого экрана.**`,
`Dennis Jackson’s incident guide provides controlled test endpoints. They help check whether a client still trusts the affected chains. Use the actual application and network path you want to assess. The test service operator will receive the request.

If the certificate is accepted, that path needs protection. If certificate validation fails, check the reason and the chain: a corporate proxy may have substituted its own. A timeout or DNS error says nothing about certificate trust.

The affected certificates have multiple trust chains, so one address is not a complete test. The guide provides the full set. And do not add an option that disables certificate verification. That hides the problem instead of fixing it.

**Now return to the question on the first screen.**`)},
{kind:'closing',seconds:27,src:['bug','fenko','hub','google','cf','curl'],
 title:pair('Браузер защищён — не значит, что всё.','A protected browser is not the whole system.'),
 lead:pair('Проверяй программу, которой действительно доверяешь данные.','Check the software you actually trust with your data.'),
 labels:pair(['Кто проверяет сертификат?','Дошло ли исправление до программы?','Изменился ли результат проверки?'],['Who verifies the certificate?','Did the fix reach the application?','Did the verification result change?']),
 frames:pair(['Найти реальную точку проверки.','Доставить туда исправление.','Подтвердить результат на реальном пути соединения.'],['Find the actual verifier.','Deliver the fix to it.','Confirm the result on the real connection path.']),
 foot:pair('Источники и инструкции — по ссылкам. Срез инцидента на 22.10.2026.','Sources and operational guidance are linked. Incident snapshot: 22 Oct 2026.'),
 script:pair(`Главный вывод — не «HTTPS сломался». Слабый ключ позволил подделать подпись, а разные программы по-разному перестали ей доверять.

Поэтому задавай три вопроса: кто проверяет сертификат, дошло ли до него исправление и изменился ли результат? Это касается и обычного приложения, и инструмента твоего AI-агента. Модель может хорошо рассуждать, но сетевую проверку за неё выполняет конкретная программа.

**Проверяй не значок безопасности где-то рядом, а путь, по которому действительно идут твои данные.**`,
`The takeaway is not “HTTPS is broken.” A weak key allowed forged signatures, and different applications stopped trusting them in different ways.

Ask three questions: who verifies the certificate, did the fix reach that component, and did the result change? That applies to ordinary applications and to your AI agent’s tools. A capable model does not replace the software that checks its network connections.

**Check the path your data actually takes—not a reassuring security indicator somewhere else.**`)}
];
