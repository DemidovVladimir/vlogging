// Private authoring source. Only selected visual fields enter the public JS.
export const slug='emudhra-ca-compromise';
export const checked='2026-10-22';
export const sources={
 bug:['Mozilla / incident','https://bugzilla.mozilla.org/show_bug.cgi?id=2083449'],
 fenko:['Ali Mosajjal / analysis','https://fenko.nz/blog/emudhra-ca-compromise/'],
 hub:['Dennis Jackson / checks','https://emudhra.we-have-a-problem.com/'],
 google:['Google / response','https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/'],
 cf:['Cloudflare / response','https://blog.cloudflare.com/emudhra-certificate-compromise'],
 curl:['curl / trust stores','https://curl.se/docs/sslcerts.html'],
 go:['Go / GO-2026-6809','https://pkg.go.dev/vuln/GO-2026-6809'],
 pkix:['RFC 5280 / PKIX','https://www.rfc-editor.org/rfc/rfc5280.html'],
 tls:['RFC 8446 / TLS 1.3','https://www.rfc-editor.org/rfc/rfc8446.html'],
 ct:['RFC 6962 / CT','https://www.rfc-editor.org/rfc/rfc6962.html'],
 crlset:['Chromium / CRLSets','https://www.chromium.org/Home/chromium-security/crlsets/'],
 openssl:['OpenSSL / verification','https://docs.openssl.org/3.5/man1/openssl-verification-options/'],
 nist:['NIST / ECDSA','https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf'],
 certin:['CERT-In / advisory','https://www.cert-in.org.in/s2cMainServlet?CACODE=CICA-2026-3649&pageid=PUBADV01'],
 mark:['Mark Jaquith / X','https://x.com/markjaquith/status/2112700200829759970'],
 hd:['hd_nvim / X','https://x.com/hd_nvim/status/2112943574320820401'],
 oto:['otomir23 / X','https://x.com/otomir23/status/2112697830687047918']
};
const pair=(ru,en)=>({ru,en});
export const scenes=[
{kind:'cover',seconds:38,src:['certin','fenko','mark','hd'],
 title:pair('Ключ доверия.\nЧетыре.','A key to trust.\nFour.'),
 lead:pair('eMudhra: не взлом шифра, а провал ключей и доставки защиты.','eMudhra: not broken encryption, but failed keys and uneven protection.'),
 labels:pair(['8 слабых ключей','6 TLS · 2 подписи кода','ECDSA / P-384, не RSA'],['8 weak keys','6 TLS · 2 code signing','ECDSA / P-384, not RSA']),
 frames:pair(['Один из закрытых ключей промежуточного CA — число 4.','Отзыв сертификатов не обновляет автоматически каждый клиент.'],['One intermediate CA private key was the number 4.','Revoking certificates does not automatically update every client.']),
 foot:pair('Срез на 22.10.2026. Пост с «RSA PRIVATE KEY» — мем, не формат реального ключа.','As of 22 Oct 2026. The “RSA PRIVATE KEY” post is a joke, not the actual key format.'),
 script:pair(`В постах из этой истории предлагают выбрать случайное число и шутят про закрытый ключ, равный четырём. Четвёрка здесь действительно не выдумка. Но подпись RSA в меме — не техническое описание: речь о ключах на эллиптической кривой P-384.

Компрометированы восемь ключей промежуточных удостоверяющих центров eMudhra. Шесть использовались для TLS, два — для подписи кода. Дальше разбираем прежде всего HTTPS.

Самая неприятная часть: сертификаты уже отозвали, а отдельное приложение всё ещё может принять подделку. **Разберём, откуда вообще берётся это доверие.**`,
`The posts joke about picking a random number and a private key equal to four. That number is real. The RSA label in the meme is not: the affected keys use the P-384 elliptic curve.

Eight eMudhra intermediate CA keys were compromised: six for TLS and two for code signing. We’ll focus on HTTPS.

The surprising part is that revoking a certificate doesn’t automatically stop every application from accepting it. This is a failure of key generation and of how protection reaches software, not a break in the encryption algorithm. **First, where does that trust come from?**`)},
{kind:'chain',seconds:48,src:['pkix','openssl','curl'],
 title:pair('Сертификат — делегированное доверие','A certificate delegates trust'),
 lead:pair('Сервер присылает цепочку. Клиент проверяет её до своего доверенного корня.','The server supplies a chain. The client checks it against a root it trusts.'),
 labels:pair(['Доверенный корень','В хранилище клиента','Промежуточный CA','Может выпускать сертификаты','api.example.com','Имя + открытый ключ сервера','Подписи · срок · ограничения · имя'],['Trusted root','In the client’s trust store','Intermediate CA','Authorized to issue certificates','api.example.com','Name + server public key','Signatures · dates · constraints · name']),
 frames:pair(['Корень — исходная точка доверия клиента, не подарок от сервера.','Подпись корня разрешает промежуточному CA выпускать сертификаты.','Клиент проверяет путь и имя сервера. Отзыв и CT — дополнительные проверки.'],['A trusted root is the client’s starting point, not a gift from the server.','The root signs an intermediate that can issue certificates.','The client validates the path and server name. Revocation and CT add checks.']),
 foot:pair('Упрощённый путь. CA = удостоверяющий центр. api.example.com — условный адрес.','Simplified path. CA = certificate authority. api.example.com is illustrative.'),
 script:pair(`Сертификат связывает имя сайта с его открытым ключом. Но сам сайт может написать что угодно. Поэтому клиент проверяет цифровую подпись издателя, затем его полномочия — вплоть до корня, которому уже доверяет.

Промежуточный CA получает право подписывать сертификаты в пределах своих ограничений. Именно его закрытый ключ здесь стал известен посторонним. Ключ корневого центра для этого красть не требуется.

Проверяются не только подписи: важны срок, назначение ключа, ограничения цепочки и совпадение имени. При рукопожатии сервер также доказывает владение соответствующим закрытым ключом. Но корректная подпись ещё не сообщает, отозван ли издатель. **А почему его секрет оказалось так легко найти?**`,
`A certificate binds a website’s name to a public key. A server could claim anything, so the client checks who signed it, and who authorized that issuer, back to a root it already trusts.

An intermediate can issue certificates within its constraints. Here, outsiders recovered the intermediate’s private key. They did not need the root’s private key.

Validation also checks dates, permitted uses, constraints and the requested hostname. During the handshake, the server proves it holds the matching private key. But a mathematically valid signature does not tell you whether its issuer has been revoked. **Why was this secret so easy to recover?**`)},
{kind:'scalar',seconds:48,src:['nist','certin','fenko'],
 title:pair('Большая кривая. Крошечный секрет.','A large curve. A tiny secret.'),
 lead:pair('Q = d × G: открытый ключ Q вычисляется из секретного числа d.','Q = d × G: the public key Q is computed from the secret number d.'),
 labels:pair(['d — закрытый ключ','G — заданная точка кривой','Q — открытый ключ','48 байт: 47 нулевых + один ненулевой','Всего 255 ненулевых кандидатов','Совпадение Q подтверждает кандидата'],['d — private key','G — fixed curve point','Q — public key','48 bytes: 47 zero bytes + one nonzero byte','Only 255 nonzero candidates','A matching Q identifies the candidate']),
 frames:pair(['При нормальной генерации d выбирается непредсказуемо из огромного диапазона.','Здесь все восемь секретов оказались меньше 256.','Сравнение публичных ключей раскрывает слабый секрет. P-384 при этом не «взломали».'],['Normally, d is chosen unpredictably from an enormous range.','All eight affected secrets were smaller than 256.','Comparing public keys identifies the weak secret. P-384 itself was not broken.']),
 foot:pair('× — умножение точки кривой на число. Схема, не программа восстановления ключей.','× denotes elliptic-curve scalar multiplication. Diagram, not key-recovery code.'),
 script:pair(`Здесь нужна одна формула, без экскурса в высшую математику. Закрытый ключ — число d. Открытый ключ Q получают из него операцией над известной точкой кривой G. Посчитать Q по d легко. Найти хорошее случайное d по Q — практически невозможно.

Но если секрет заведомо очень маленький, сложную задачу можно вообще не решать. Для чисел от одного до двухсот пятидесяти пяти вариантов совсем мало. Совпадение вычисленного открытого ключа с опубликованным подтверждает найденный секрет.

Большой размер сертификата и название P-384 эту ошибку не компенсируют. **Теперь вопрос не к математике: как такой ключ оказался сертифицирован?**`,
`We need one relationship, not a mathematics lecture. The private key is a number, d. A known curve point, G, is used to derive the public key, Q. Computing Q from d is easy. Recovering a properly random d from Q is impractical.

But a very small secret changes the problem. There are only 255 nonzero candidates below 256. A matching public key identifies the secret without defeating the curve’s normal security.

A large certificate and the P-384 label cannot compensate for poor key generation. **So the next question is operational: how did these keys get certified?**`)},
{kind:'ceremony',seconds:38,src:['bug'],
 title:pair('Подписали не тот набор ключей','The wrong keys got certified'),
 lead:pair('Предварительная версия eMudhra: ошибка процедуры, затем ошибка выбора.','eMudhra’s preliminary account: a procedure failure, then a selection failure.'),
 labels:pair(['30.04.2025','Штатный набор','Дополнительный слабый набор','Похожие метки','CSR со слабым ключом','Сертификат CA','Точный механизм ещё расследуется'],['30 Apr 2025','Intended key set','Additional weak key set','Similar labels','CSR with weak key','CA certificate','Exact mechanism still under investigation']),
 frames:pair(['CA сообщает о дополнительном наборе после изменения процедуры wrap/unwrap.','По версии CA, похожие метки привели к выбору слабых ключей для CSR.','Подпись сертификата закрепила ошибку. Причина появления слабых чисел ещё не установлена окончательно.'],['The CA reports a second key set after a wrap/unwrap procedure change.','According to the CA, similar labels led to weak keys being selected for CSRs.','Signing certified the mistake. The exact weak-key mechanism is not yet settled.']),
 foot:pair('CSR — запрос на сертификат с открытым ключом. Не утверждаем, что доказана неисправность HSM.','CSR is a certificate request containing a public key. A defective HSM has not been established.'),
 script:pair(`Предварительное объяснение eMudhra выглядит так: при изменении процедуры переноса ключей появился второй, слабый набор. Из-за похожих меток его по ошибке выбрали для запросов на сертификаты. Издатель подписал именно эти открытые ключи.

Это пока версия участника инцидента, а не завершённое независимое расследование. Как именно возникли маленькие числа и какую роль сыграли операции с аппаратным модулем, ещё выясняют. **Но последствия уже понятны: у одного слабого ключа оказалось больше одного пути доверия.**`,
`eMudhra’s preliminary explanation is that a change to the key-transfer procedure produced a second, weak set. Similar labels then led to the wrong keys being selected for certificate requests. Those public keys were certified.

This is the CA’s account, not a completed independent investigation. The exact operation that produced the tiny numbers, and the hardware module’s role, remain under scrutiny. **The consequence is already clear, though: the same weak key could have more than one trust path.**`)},
{kind:'cross',seconds:49,src:['fenko','google','pkix'],
 title:pair('Один ключ. Две цепочки.','One key. Two trust paths.'),
 lead:pair('Cross-signing: разные сертификаты подтверждают один и тот же открытый ключ.','Cross-signing: different certificates certify the same public key.'),
 labels:pair(['emSign ECC Root CA – G3','emSign Root TLS CA – G3','Сертификат A','AAA Certificate Services','Сертификат B','Один открытый ключ CA','Поддельный сертификат сайта','Блокировка ключа: обе ветви закрыты'],['emSign ECC Root CA – G3','emSign Root TLS CA – G3','Certificate A','AAA Certificate Services','Certificate B','Same CA public key','Forged website certificate','Key block: both branches closed']),
 frames:pair(['Слева — путь через emSign.','Справа — cross-sign от Sectigo: другой сертификат, тот же ключ.','Убрать один путь недостаточно, если клиент ещё принимает другой.','Блокировка по SPKI охватывает сертификаты с этим открытым ключом.'],['Left: a path through emSign.','Right: Sectigo cross-signing creates another certificate for the same key.','Removing one path is insufficient if the client still accepts the other.','An SPKI block covers certificates carrying that public key.']),
 foot:pair('Показан один из TLS-ключей. SPKI — структура открытого ключа; блокируется её хеш.','One affected TLS key is shown. SPKI is the public-key structure; its hash is blocked.'),
 script:pair(`Cross-signing — это не ещё один секрет. Разные издатели подписывают сертификаты с одним и тем же открытым ключом. Клиент может построить цепочку через ту ветку, которой доверяет.

У затронутых ключей были сертификаты и через emSign, и через AAA Certificate Services от Sectigo. Поэтому проверка только одного маршрута даёт неполную картину. Удаление одного корня не обязательно закрывает другой путь.

Google применил блокировку по хешу SPKI — структуре открытого ключа. Она узнаёт ключ, даже если меняются сертификат и его издатель. Это точнее, чем сопоставление только одного файла сертификата. **А что атакующий вообще получает от этого ключа?**`,
`Cross-signing does not create a new secret. Different issuers certify the same public key. A client can build a path through whichever branch it trusts.

The affected keys had certificates through emSign and through Sectigo’s AAA Certificate Services. Checking only one route can miss the other. Removing one root does not necessarily eliminate an alternative path.

Google blocked hashes of the Subject Public Key Info structure: SPKI. That identifies the key even across certificates issued by different authorities. It targets the shared key, rather than just one certificate file. **What can an attacker actually do with that key?**`)},
{kind:'attack',seconds:51,src:['tls','cf'],
 title:pair('Подмена сервера, не машина времени','Impersonation, not time travel'),
 lead:pair('Опасность возникает, когда клиент принимает поддельную идентичность сервера.','The danger is a client accepting a forged server identity.'),
 labels:pair(['Клиент','Настоящий сервис','Подмена на пути','Сертификат для нужного имени','Доверие ещё действует','Две отдельные TLS-сессии','Старые записи TLS с (EC)DHE','Ключ CA ≠ ключи этих сессий'],['Client','Real service','On-path impersonator','Certificate for the requested name','Trust still accepted','Two separate TLS sessions','Old TLS captures using (EC)DHE','CA key ≠ those session keys']),
 frames:pair(['Обычная сессия: клиент проверяет сервер и согласует ключи шифрования.','Для подмены нужны и сертификат, и возможность направить соединение к атакующему.','Если клиент принимает подделку, посредник может читать и менять передаваемые данные.','Один ключ CA не расшифровывает задним числом записанный трафик с forward secrecy.'],['Normally, the client authenticates the server and establishes encryption keys.','Impersonation needs a certificate and a way to direct the connection to the attacker.','If the client accepts the forgery, an intermediary can read or alter relayed data.','The CA key alone does not retrospectively decrypt captures with forward secrecy.']),
 foot:pair('Модель угроз, не демонстрация атаки. Forward secrecy — защита прошлых сессий при последующей утечке долгосрочного ключа.','Threat model, not an attack demo. Forward secrecy protects past sessions after long-term key compromise.'),
 script:pair(`Зная ключ CA, можно подписать поддельный сертификат для нужного имени с собственным серверным ключом. Но это ещё не переносит к тебе чужой трафик. Нужна позиция посредника или иной способ направить соединение на свой сервер. И клиент должен принять эту цепочку.

Тогда посредник устанавливает две отдельные TLS-сессии. Шифрование работает, но одна его конечная точка — атакующий. Поэтому он видит данные, которые через него проходят.

Это не означает возможность скачать старый перехват и расшифровать всё ключом CA. При обмене с эфемерными ключами, например (EC)DHE, прошлые сеансовые ключи так не восстанавливаются. **Значит, решающий момент — проверка сертификата клиентом.**`,
`With the CA key, an attacker can sign a certificate for a target name containing their own server public key. That does not automatically route anyone’s traffic to them. They also need an on-path position or another way to receive the connection. The client must still accept the chain.

An intermediary can then establish two TLS sessions. Encryption works, but the attacker is an endpoint and can read or change data being relayed.

That does not unlock old captured sessions. With ephemeral key exchange such as (EC)DHE, the CA key alone cannot recover past session keys. **The decisive point is the client’s certificate check.**`)},
{kind:'checks',seconds:57,src:['ct','crlset','google','openssl'],
 title:pair('Подпись, отзыв и CT — разные проверки','Signature, revocation and CT differ'),
 lead:pair('Одна корректная цепочка не гарантирует, что сертификат будет принят.','A valid chain does not guarantee acceptance.'),
 labels:pair(['Цепочка + имя','Подпись корректна','Отзыв / блокировка','Ключ больше не доверенный','Certificate Transparency','Нет подходящих SCT','Клиент с CT / блокировкой','Клиент без этих проверок','ОТКЛОНИТЬ','МОЖЕТ ПРИНЯТЬ'],['Chain + hostname','Signature is valid','Revocation / block','Key no longer trusted','Certificate Transparency','No compliant SCTs','Client enforcing CT / block','Client without those checks','REJECT','MAY ACCEPT']),
 frames:pair(['Подпись отвечает: соответствует ли сертификат ключу издателя?','CRL / OCSP и локальные списки сообщают об отзыве — если клиент их применяет.','CT требует подписанные подтверждения от журналов: SCT. Это не проверка CRL.','Для этого инцидента CT и экстренные блокировки закрывали путь в браузерах; другие клиенты могли отстать.'],['The signature check asks whether the certificate matches the issuer’s key.','CRL / OCSP and local blocks convey revocation—if the client applies them.','CT requires signed log promises, called SCTs. It is not a CRL check.','Here, CT and emergency blocks protected browsers; other clients could lag behind.']),
 foot:pair('Google: до блокировки не было TLS-сертификатов этих CA в CT. CRLSet — не полный список всех отзывов.','Google: no TLS certificates from these CAs were logged before blocking. CRLSet is not an exhaustive revocation list.'),
 script:pair(`Теперь разделим три вопроса. Первый: корректна ли цепочка и подходит ли имя? Второй: не отозван ли сертификат или не заблокирован ли ключ? CRL — опубликованный список отзывов. OCSP позволяет запросить статус. Но клиент должен действительно использовать этот механизм и его актуальные данные.

Третий вопрос — Certificate Transparency. Клиент с такой политикой требует SCT: подписанные обещания журналов включить сертификат. Это не запрос в журнал при каждом открытии сайта и не замена отзыву.

В этом инциденте отсутствие подходящих записей CT мешало использовать подделки против клиентов с обязательной CT-проверкой. Затем появились экстренные блокировки. Chrome доставляет их через CRLSet, а не обязательный онлайн-запрос OCSP на каждое соединение. **У терминальной программы политика может быть другой.**`,
`Separate three questions. First: does the chain validate, and does the name match? Second: has a certificate or key been revoked or blocked? A CRL publishes revoked certificates. OCSP can report status. A client must actually consume and apply that information.

Third is Certificate Transparency. A client enforcing CT requires signed promises from logs, called SCTs. It does not query a log on every page load, and CT does not replace revocation.

In this incident, the absence of compliant CT records prevented forgeries against CT-enforcing clients. Emergency blocks followed. Chrome distributes these through CRLSet, not a mandatory live OCSP request for every connection. **A command-line program may apply different rules.**`)},
{kind:'stores',seconds:51,src:['curl','hub'],
 title:pair('Одна macOS. Не одна система доверия.','One Mac. More than one trust path.'),
 lead:pair('Проверяет сертификат конкретная TLS-библиотека с конкретной конфигурацией.','A particular TLS library, with a particular configuration, performs the check.'),
 labels:pair(['Браузер / native API','Системная политика и блокировки','Отклоняет','Встроенный CLI-путь','/etc/ssl/cert.pem','Может доверять старому CA','curl из другой сборки','Другой backend / CA bundle','Проверить отдельно'],['Browser / native API','System policy and blocks','Rejects','Built-in CLI path','/etc/ssl/cert.pem','May still trust the old CA','A different curl build','Another backend / CA bundle','Check separately']),
 frames:pair(['Обновление системной политики защищает клиентов, которые её используют.','PEM-файл — набор сертификатов, не автоматическая доставка отзывов.','Название curl не определяет поведение: важны сборка, backend и выбранное хранилище.'],['A system policy update protects clients that actually use that policy.','A PEM bundle is a collection of certificates, not automatic revocation delivery.','The name curl is not enough: the build, backend and selected store matter.']),
 foot:pair('Наблюдение для встроенного CLI-пути из incident guide на 22.10.2026. Не утверждение обо всех версиях macOS/curl.','Built-in CLI behavior reported by the incident guide as of 22 Oct 2026; not all macOS/curl versions.'),
 script:pair(`Вот почему тест в Safari или Chrome не отвечает за всю macOS. Одно приложение использует системную политику, другое — отдельный файл корневых сертификатов.

В руководстве по этому инциденту отмечен путь встроенных утилит через /etc/ssl/cert.pem. Если такой файл не обновлён, а клиент не применяет отзыв, старая цепочка может оставаться допустимой. Это не означает, что любой curl на любом Mac работает одинаково.

Сам curl поддерживает разные TLS-библиотеки и способы выбора доверенных CA. Проверяйте фактически запускаемый бинарник, его сборку и настройки. Не подменяйте это вопросом «обновлена ли операционная система». **На сервере разрыв между обновлением и работающим кодом бывает ещё больше.**`,
`Passing a Safari or Chrome test does not clear the whole Mac. One application uses system policy; another uses its own certificate file.

The incident guide calls out a built-in command-line path using /etc/ssl/cert.pem. An unchanged bundle, combined with no effective revocation check, can leave an old chain acceptable. That does not mean every curl build on every Mac behaves identically.

curl supports multiple TLS backends and ways to select trusted CAs. Check the binary actually running, its build and its configuration. “The operating system is updated” is not enough information. **On a server, the gap between an update and running code can be larger still.**`)},
{kind:'deploy',seconds:48,src:['go','cf','oto'],
 title:pair('Исправление должно дойти до процесса','The fix must reach the running process'),
 lead:pair('Зависимость обновлена ≠ контейнер пересобран ≠ новый процесс запущен.','Dependency updated ≠ image rebuilt ≠ new process running.'),
 labels:pair(['Обновить','Библиотека / CA bundle','Пересобрать','Бинарник / образ','Развернуть','Работающий процесс','Go: 1.26.10 / 1.27.3','Старый бинарник сам не переписывается','IoT без обновления — отдельный риск'],['Update','Library / CA bundle','Rebuild','Binary / image','Deploy','Running process','Go: 1.26.10 / 1.27.3','An old executable does not rewrite itself','Unpatched IoT is a separate risk']),
 frames:pair(['Go добавил denylist в crypto/x509. Обновить toolchain — лишь первый шаг.','Исправленный код должен попасть в новую сборку приложения.','После развёртывания проверяем реальный процесс, включая HTTP-инструменты агента.'],['Go added a denylist in crypto/x509. Updating the toolchain is only step one.','The corrected code must be included in a new application build.','After deployment, test the real process—including an agent’s HTTP tools.']),
 foot:pair('Версии Go — первые исправленные ветки из advisory, не рекомендация навсегда. Пост otomir23 о колонке не подтверждён независимо.','Go versions are advisory fix baselines, not permanent recommendations. The otomir23 speaker report is not independently verified.'),
 script:pair(`Go добавил блокировку известных недоверенных промежуточных сертификатов в crypto/x509. Для этих веток исправление появилось в 1.26.10 и 1.27.3. Но установленный новый компилятор не меняет уже собранный бинарник. Приложение нужно пересобрать и развернуть.

Аналогично с контейнером: новый пакет на хосте не обязательно меняет содержимое образа. Для AI-агента проверяйте HTTP-инструмент или SDK, который реально ходит в сеть. Умная модель не исправляет его TLS-проверку.

Автор ещё одного поста сообщает, что с этими сертификатами удалось получить root на умной колонке. Мы это не воспроизводили; универсального вывода обо всех устройствах нет. **Как же проверить именно свой путь без попыток кого-либо атаковать?**`,
`Go added a denylist in crypto/x509, with fixes in 1.26.10 and 1.27.3 for those release branches. Installing a newer compiler does not change an executable already built. Rebuild the application and deploy it.

Likewise, updating a package on the host may leave a container image untouched. For an AI agent, inspect the HTTP tool or SDK that actually connects. A smarter model does not repair that tool’s TLS validation.

Another linked post claims the certificates helped root a smart speaker. We have not reproduced that claim; it does not establish that every device is affected. **How do you check your own path without attacking anything?**`)},
{kind:'test',seconds:48,src:['hub','curl','cf'],
 title:pair('Тестируем отказ, а не просто ошибку','Test rejection, not just an error'),
 lead:pair('Один клиент. Обе цепочки. Без отключения проверки сертификата.','One client. Both chains. Certificate verification stays enabled.'),
 labels:pair(['Тестовый endpoint emSign','Тестовый endpoint AAA','Клиент принимает сертификат','Этот путь всё ещё доверяет цепочке','Отказ проверки сертификата','Уточнить причину и цепочку','DNS / timeout / proxy error','Результат не определён'],['emSign test endpoint','AAA test endpoint','Client accepts the certificate','This path still trusts the chain','Certificate verification fails','Confirm reason and chain','DNS / timeout / proxy error','Inconclusive']),
 frames:pair(['Используем контролируемые тестовые endpoints из incident guide.','Нужен отказ именно проверки сертификата, а не любой сетевой сбой.','Проверка двух маршрутов не заменяет тест всех затронутых CA и всех приложений.'],['Use the controlled test endpoints published in the incident guide.','Look for a certificate-validation failure, not an arbitrary network error.','Two routes are a sample, not a complete test of every affected CA or application.']),
 foot:pair('Команды не выполняются этой страницей. Не использовать -k / --insecure. Тестовый сервис видит обычный запрос.','This page does not run commands. Do not use -k / --insecure. The test service receives an ordinary request.'),
 script:pair(`У Dennis Jackson есть тестовые адреса с цепочками через emSign и через AAA. Команды на экране просто обращаются к этим контролируемым endpoints. Они ничего не устанавливают и не меняют хранилище сертификатов. Но запрос виден владельцу сервиса.

Если клиент принимает тестовую цепочку, именно этот путь требует внимания. Если возникает ошибка сертификата, проверьте её причину: например, корпоративный прокси мог подставить собственную цепочку. Таймаут или ошибка DNS вообще не говорят, защищены ли вы.

Эти два адреса — выборочная проверка двух маршрутов. В руководстве есть расширенный набор. **И только после проверки можно считать развёртывание завершённым.**`,
`Dennis Jackson’s guide provides controlled endpoints with emSign and AAA chains. These commands make ordinary requests to those endpoints. They do not install anything or modify the certificate store, although the service operator can see the requests.

If your client accepts the test chain, that verification path needs attention. If certificate validation fails, confirm why: a corporate proxy could substitute a different chain. A timeout or DNS failure tells you nothing about protection.

These two addresses sample two routes. The guide has a broader test set. Use the application’s real network path, not a convenient substitute. **Verification is the final step of deployment, not an optional extra.**`)},
{kind:'response',seconds:43,src:['certin','cf','google'],
 title:pair('Закрыть риск, не отключая защиту','Close the gap without disabling checks'),
 lead:pair('Клиенту — актуальная проверка. Владельцу сайта — рабочая доверенная цепочка.','Clients need current validation. Site owners need a valid, trusted chain.'),
 labels:pair(['Найти','Кто проверяет TLS?','Обновить','Применить исправление поставщика','Доставить','Пересборка / перезапуск / rollout','Подтвердить','Тест из настоящего приложения','Не удалять корни вслепую','Не «чинить» ошибку флагом insecure'],['Locate','Who verifies TLS?','Patch','Apply the vendor’s fix','Deliver','Rebuild / restart / roll out','Confirm','Test from the real application','Do not blindly delete roots','Do not “fix” errors with insecure']),
 frames:pair(['Составьте карту клиентов: браузеры, CLI, runtimes, контейнеры, устройства.','Обновление должно изменить именно тот verifier или bundle, который используется.','Необновляемые системы требуют изоляции и плана замены; сайтам может потребоваться перевыпуск.'],['Map the clients: browsers, CLI tools, runtimes, containers and devices.','The update must reach the verifier or bundle actually in use.','Unmaintained systems need isolation and a replacement plan; sites may need reissuance.']),
 foot:pair('Удаление корня может ломать незатронутые сайты и не закрыть альтернативную цепочку. Решения согласуйте с владельцем инфраструктуры.','Root removal can break unrelated sites and still leave an alternate path. Coordinate infrastructure changes with its owner.'),
 script:pair(`Практический порядок такой: выяснить, кто проверяет TLS; применить исправление поставщика; доставить его в работающий процесс; проверить результат оттуда же. Владельцам затронутых сайтов может потребоваться новый сертификат из другой доверенной иерархии.

Не превращайте ошибку сертификата в повод отключить проверку. И не удаляйте случайные корни по скриншоту: это может сломать другие подключения и всё равно оставить альтернативную цепочку.

Для устройств без обновлений нужен отдельный план ограничения доступа и замены. **Инцидент заканчивается не публикацией патча, а исчезновением старого доверия из реальных соединений.**`,
`The practical sequence is: identify the verifier, apply the vendor’s fix, deliver it to the running process, and test from that process. Operators of affected websites may also need replacement certificates from another trusted hierarchy.

Do not turn a certificate error into an excuse to disable verification. Do not delete arbitrary roots based on a screenshot: you may break unrelated connections while leaving another path open.

Devices without updates need a separate containment and replacement plan. **An incident is not over when the patch is published. It is over when the outdated trust is gone from real connections.**`)},
{kind:'closing',seconds:20,src:['mark','hd','oto','fenko','hub','bug','google','curl'],
 title:pair('Доверие нужно доставлять','Trust needs maintenance'),
 lead:pair('Секрет — непредсказуемый. Проверка — актуальная. Исправление — в работающем клиенте.','An unpredictable secret. Current validation. A fix in the running client.'),
 labels:pair(['Криптография','Политика доверия','Доставка обновлений'],['Cryptography','Trust policy','Update delivery']),
 frames:pair(['Надёжный алгоритм не исправляет плохую генерацию ключей.','Правильный отзыв не помогает клиенту, который его не применяет.','Проверяйте не «компьютер вообще», а каждое реальное соединение.'],['A sound algorithm cannot fix poor key generation.','A correct revocation cannot help a client that never applies it.','Check real verification paths, not whether a computer is “updated”.']),
 foot:pair('TENGU / EP.03 / ИСТОЧНИКИ ПРОВЕРЕНЫ 22.10.2026 · Расследование продолжается.','TENGU / EP.03 / SOURCES CHECKED 22 OCT 2026 · Investigation ongoing.'),
 script:pair(`История с четвёркой кажется абсурдной. Но вывод вполне прикладной: криптография, политика доверия и доставка обновлений — три разные части защиты. Ни одна не подменяет остальные.

Источники и актуальные проверки — на экране. Перед применением рекомендаций проверьте новые сообщения поставщиков: расследование продолжается.`,
`The story of the number four sounds absurd. The practical lesson is not: cryptography, trust policy and update delivery are separate parts of protection. None replaces the others.

Sources and current checks are on screen. Before acting, check the latest vendor guidance. This investigation is still developing.`)}
];
