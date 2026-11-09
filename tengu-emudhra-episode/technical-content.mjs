// Private EP.03 authoring. Diagrams illustrate mechanisms; no attacks were run.
import {scenes as previous,sources as originalSources,slug} from './content.mjs';
export {slug};
export const checked='2026-10-23';
export const sources={...originalSources,go:['Go / crypto/x509 advisory','https://pkg.go.dev/vuln/GO-2026-6809'],tunnel:['cloudflared / 2026.10.2','https://github.com/cloudflare/cloudflared/releases/tag/2026.10.2']};
const p=(ru,en)=>({ru,en});
const [cover,trust,attack,compare,update,,closing]=structuredClone(previous);
cover.seconds=34;
cover.foot=p('Проверено 23.10.2026 · Схемы, не тест вашего устройства.','Checked 23 Oct 2026 · Diagrams, not a test of your device.');
cover.script=p(`Браузер отклоняет опасный сертификат, а сервис на том же компьютере устанавливает соединение. Шифрование включено в обоих случаях. Различается проверка того, кто находится на другом конце.

В истории eMudhra это не теоретический вопрос. Восстановили закрытые ключи промежуточных удостоверяющих центров — тех, кто может заверять сертификаты сайтов. Здесь разберём не только саму ошибку: почему отзыв не доходит до всех клиентов, что сделала Cloudflare и как довести исправление до работающего приложения. **Начнём с причины.**`,
`A browser rejects a dangerous certificate, while a service on the same computer connects successfully. Both use encryption. What differs is how they authenticate the other endpoint.

In the eMudhra incident, that distinction is not theoretical. Researchers recovered intermediate certificate authorities’ private keys: keys that can sign certificates for websites. We will follow the failure beyond the key itself: why revocation misses some clients, what Cloudflare changed, and how a fix reaches a running application. **First, what actually broke?**`);
trust.kind='weak';trust.seconds=46;
trust.title=p('P-384. А секрет — меньше 256.','P-384. But the secret was below 256.');
trust.lead=p('Слабая генерация ключей, а не взлом алгоритма. Восемь intermediate CA: шесть TLS, два code signing.','Weak key generation, not a broken algorithm. Eight intermediate CAs: six TLS, two code signing.');
trust.labels=p(['Ожидание','Непредсказуемый закрытый ключ','Фактически','Всего 255 ненулевых вариантов','Последствие','Посторонний может подписать сертификат'],['Expected','An unpredictable private key','Actual','Only 255 non-zero candidates','Consequence','An outsider can sign a certificate']);
trust.frames=p(['Сертификат CA содержит открытый ключ — с ним можно сверять кандидатов.','Закрытые числа были настолько малы, что исследователи восстановили их.','По предварительному отчёту CA, в запросы на сертификаты попал ошибочный набор ключей.'],['The CA certificate exposes a public key against which candidates can be checked.','The private numbers were so small that researchers recovered them.','The CA’s preliminary report says an unintended key set was used in certificate requests.']);
trust.foot=p('Причина на уровне процедуры ещё расследуется. Нельзя сводить её к доказанной поломке HSM.','The procedural root cause remains under investigation. A broken HSM has not been established.');
trust.script=p(`У этих ключей использовалась кривая P-384. Но секретные числа оказались меньше двухсот пятидесяти шести. Вместо непредсказуемого значения — всего двести пятьдесят пять ненулевых кандидатов. Открытый ключ уже есть в сертификате, поэтому результат можно проверить. Один из восстановленных секретов вообще равнялся четырём.

Предварительное объяснение самого CA — ошибка в процедуре генерации: для сертификатов выбрали не тот набор ключей. Детали ещё расследуются, поэтому объявлять сломанным криптографический модуль нельзя.

Последствие конкретное: чужой человек может создать подпись, которую математическая проверка признает верной. **И эта подпись может опираться не на один путь доверия.**`,
`These keys used the P-384 curve. Yet their private numbers were below 256: only 255 non-zero candidates instead of an unpredictable secret. The public key is already in the certificate, so a candidate can be checked against it. One recovered secret was literally four.

The CA’s preliminary explanation points to its generation procedure: the wrong key set was selected for certificate requests. The details remain under investigation; a broken hardware security module has not been established.

The practical consequence is a signature an outsider can create and a mathematical verifier will accept. **And that signature can connect to more than one trust path.**`);
const cross={kind:'cross',seconds:42,src:['fenko','hub','google','pkix'],
 title:p('Два сертификата. Один опасный ключ.','Two certificates. One dangerous key.'),
 lead:p('Cross-signing: тот же открытый ключ заверен другой цепочкой издателей.','Cross-signing: the same public key is certified through a different issuer chain.'),
 labels:p(['Маршрут emSign','Промежуточный CA · ключ Q','Маршрут Sectigo / AAA','Другой сертификат · тот же Q','Подпись сайта','Блокировка по ключу закрывает оба пути'],['emSign route','Intermediate CA · key Q','Sectigo / AAA route','Different certificate · same Q','Website signature','A key-based block covers both paths']),
 frames:p(['Клиент строит цепочку от сертификата сайта к доверенному корню.','Другой сертификат того же ключа может дать альтернативный путь.','SPKI-блокировка привязана к открытому ключу, а не только к одному сертификату.'],['The client builds a path from the site certificate to a trusted root.','Another certificate carrying the same key may provide an alternative path.','An SPKI block targets the public key, not just one certificate.']),
 foot:p('Схема двух маршрутов, промежуточные звенья сокращены. Доступность пути зависит от trust store клиента.','Two routes, with intermediate links condensed. Path availability depends on the client’s trust store.'),
 script:p(`У затронутых ключей были и сертификаты eMudhra, и перекрёстные сертификаты через Sectigo. На экране меняется издатель сертификата, но сам открытый ключ остаётся прежним.

Почему это важно? Удаление одного пути не доказывает, что клиент отвергнет альтернативный. Нужно учитывать, каким корням он доверяет и какие цепочки умеет построить.

Блокировка по отпечатку SPKI адресует именно ключ: другой сертификат с тем же ключом тоже не пройдёт. Такой подход использует защита Chrome. Это не повод удалять весь корень Sectigo наугад: он обслуживает и другие сертификаты. **А что атакующему даёт оставшийся путь?**`,
`The affected keys appeared in both eMudhra certificates and cross-certificates through Sectigo. On screen, the certificate’s issuer changes, but the public key stays the same.

Removing one path does not prove that a client will reject an alternative. Its trusted roots and path-building rules matter.

Blocking an SPKI fingerprint targets the key itself: another certificate containing that key is rejected too. Chrome’s protection uses this approach. That is not a reason to remove an entire Sectigo root blindly; other certificates depend on it. **What can an attacker do if a usable path remains?**`)};
attack.seconds=40;attack.src=['tls','hub'];
compare.seconds=43;
compare.labels=p(['Сертификат с верной подписью','Но ключ издателя скомпрометирован','Chrome с актуальной защитой','CT + блокировка ключа через CRLSet','ОТКАЗ','Клиент без нужной проверки','Цепочка и имя могут пройти проверку','МОЖЕТ ПРИНЯТЬ'],['Valid certificate signature','But the issuer’s key is compromised','Chrome with current protection','CT + key block via CRLSet','REJECTED','Client missing the relevant check','Chain and hostname checks may pass','MAY ACCEPT']);
compare.frames=p(['Подпись, имя и цепочка — необходимые, но не все проверки доверия.','CT требует подтверждения от публичных журналов; CRLSet доставляет блокировку.','Публикация отзыва CA не заставляет любой TLS-клиент его применять.'],['Signature, hostname and chain checks are not the entire trust policy.','CT requires evidence from public logs; CRLSet distributes the block.','A CA publishing a revocation does not force every TLS client to enforce it.']);
compare.script=p(`Правильная подпись не означает, что ключу всё ещё можно доверять. В Chrome здесь сработали разные механизмы. Certificate Transparency требует подтверждений от публичных журналов. До блокировки сертификатов сайтов от этих TLS-центров там не было, поэтому клиенты с обязательной CT уже не принимали бы такие подделки. Затем CRLSet доставил прямую блокировку ключей.

У серверной программы может быть другой набор проверок: цепочка и имя сайта проходят, а нужной блокировки или CT нет. Публикация списка отзыва центром ещё не означает, что программа скачает и применит его.

**Поэтому инфраструктурному провайдеру пришлось исправлять не только браузерную сторону.**`,
`A valid signature does not mean the key is still trustworthy. Chrome had distinct protections here. Certificate Transparency requires evidence from public logs. Before the block, no site certificates under these TLS authorities had been logged, so clients enforcing CT would not have accepted the forgeries. CRLSet then delivered a direct key block.

A server application may apply a different policy: chain and hostname checks pass, but the relevant block or CT requirement is missing. Publishing a revocation list does not force that application to fetch and enforce it.

**An infrastructure provider therefore had more to fix than the browser-facing side.**`);
const cloudflare={kind:'cloudflare',seconds:35,src:['cf','tunnel'],
 title:p('Что исправляла Cloudflare','What Cloudflare changed'),
 lead:p('Исходящий HTTPS: прокси → origin, приложение → внешний API.','Outbound HTTPS: proxy → origin, application → external API.'),
 labels:p(['Trust stores + образы','Обновление','Работающие сервисы','Reload / restart / deploy','20.10 · 19:20 UTC','CDN + server-side Zero Trust'],['Trust stores + images','Update','Running services','Reload / restart / deploy','20 Oct · 19:20 UTC','CDN + server-side Zero Trust']),
 frames:p(['Общие trust stores и образы получили исправления.','Сервисы должны реально загрузить исправление.','Клиентский cloudflared: обновление 2026.10.2; контейнер — redeploy.'],['Shared trust stores and images received fixes.','Running services must actually load the fix.','Client-side cloudflared: update 2026.10.2; redeploy containers.']),
 foot:p('Cloudflare не обнаружила эксплуатации на своих сервисах. Это не вывод обо всём интернете.','Cloudflare found no exploitation on its services. That is not a claim about the whole Internet.'),
 script:p(`Cloudflare обновляла проверку исходящих соединений: от прокси к origin и от приложений к API. Исправила общие хранилища доверия и образы, затем активировала изменения перезапусками и развёртываниями. Защита CDN и серверной части Zero Trust была развёрнута двадцатого октября.

Для cloudflared вышла версия 2026.10.2. **Но почему недостаточно просто установить обновление?**`,
`Cloudflare patched outbound verification: proxies reaching origins and applications calling APIs. It updated shared trust stores and images, then activated fixes through restarts and deployments. CDN and server-side Zero Trust mitigations were deployed on October twentieth.

cloudflared received version 2026.10.2. **Why is installing an update not always enough?**`)};
update.seconds=48;update.src=['go','curl'];
update.title=p('Исправление должно попасть\nв работающий процесс','The fix must reach\nthe running process');
update.lead=p('Конкретный пример: Go добавил блокировку в crypto/x509. Старый бинарник от этого не меняется.','Concrete example: Go added a block in crypto/x509. An old binary does not change with it.');
update.labels=p(['Go toolchain','Обновлён','Развёрнутый Go-сервис','crypto/x509 внутри существующей сборки','СТАРЫЙ БИНАРНИК','НОВАЯ СБОРКА','Опасная цепочка может пройти','Новая блокировка отклоняет её','Пересобрать → развернуть → проверить'],['Go toolchain','Updated','Deployed Go service','crypto/x509 inside the existing build','OLD BINARY','REBUILT SERVICE','Dangerous chain may pass','New block rejects it','Rebuild → deploy → verify']);
update.frames=p(['Новый компилятор на build-машине не меняет работающий бинарник.','Пересобираем на исправленной версии Go и развёртываем новый артефакт.','Проверяем именно этот TLS-путь: опасная цепочка отклоняется.'],['A new compiler on the build host does not modify a running binary.','Rebuild with a patched Go version and deploy the new artifact.','Test this exact TLS path: the dangerous chain is rejected.']);
update.foot=p('GO-2026-6809: исправлено в Go 1.26.10 / 1.27.3. Состояния условные, не тест вашего сервиса.','GO-2026-6809: fixed in Go 1.26.10 / 1.27.3. Illustrative states, not a test of your service.');
update.script=p(`Возьмём Go. В crypto/x509 добавили блокировку затронутых ключей. Исправления есть в версиях 1.26.10 и 1.27.3. Но обновление компилятора на машине сборки не меняет уже развёрнутый бинарник. Чтобы получить именно эту защиту, сервис нужно пересобрать и развернуть заново.

Это не значит, что любой старый бинарник обязательно уязвим: на результат влияют и другие проверки. Мы показываем доставку конкретного исправления.

У другого приложения путь может отличаться: системное хранилище, отдельный CA-файл, встроенная библиотека. Например, даже curl выбирает хранилище в зависимости от сборки и настроек. Нужно установить, что использует именно ваш процесс. **И проверить результат, а не галочку в списке обновлений.**`,
`Take Go. A denylist was added to crypto/x509, with fixes in 1.26.10 and 1.27.3. Updating the compiler on a build machine does not modify a deployed binary. To gain this specific protection, rebuild the service and deploy the new artifact.

That does not make every older binary automatically vulnerable; other checks also affect the outcome. We are illustrating how one concrete fix reaches production.

Another application may use a system store, a separate CA file or a bundled library. Even curl’s trust source depends on its build and settings. Identify what your actual process uses. **Then verify the result, not just a checkmark beside an update.**`);
closing.seconds=39;closing.src=['cf','google','hub','go','bug'];
closing.title=p('Проверяйте путь доверия.\nНе только замочек.','Test the trust path.\nNot just the padlock.');
closing.lead=p('От приложения до того компонента, который действительно проверяет сертификат.','From the application to the component that actually verifies the certificate.');
closing.labels=p(['Опасная цепочка → отказ проверки','Нормальный HTTPS → работает','Тот же runtime, trust store и маршрут'],['Dangerous chain → verification fails','Ordinary HTTPS → still works','Same runtime, trust store and route']);
closing.frames=p(['DNS-ошибка или таймаут ещё не доказывают блокировку сертификата.','Положительный контроль отличает защиту от сломанной сети.','Один браузерный тест не проверяет все ваши приложения.'],['A DNS error or timeout does not demonstrate certificate blocking.','A positive control separates protection from a broken network.','One browser test cannot clear every application you run.']);
closing.foot=p('Срез 23.10.2026 · Не отключайте проверку сертификатов для устранения ошибок.','As of 23 Oct 2026 · Do not disable certificate verification to suppress errors.');
closing.script=p(`Для проверки используйте актуальные рекомендации поставщика и тестовые цепочки из материалов инцидента. Нужен отказ именно проверки сертификата, а не таймаут или ошибка DNS. Рядом нужен обычный корректный HTTPS-запрос: он должен продолжать работать.

Проверять следует из того же runtime, с тем же хранилищем и сетевым маршрутом, что у рабочего сервиса. Иначе вы проверили соседнюю программу, а не свою.

Главный вывод: криптографическая подпись, решение о доверии и доставка обновления — три разных механизма. В eMudhra сломался ключ. А масштаб проблемы определило то, сколько программ продолжало ему доверять.`,
`Use current vendor guidance and the incident’s test chains. You need a certificate-verification failure, not merely a timeout or DNS error. Pair it with an ordinary valid HTTPS request that should still succeed.

Test from the same runtime, trust store and network route as the production service. Otherwise you tested a neighbouring application, not your own.

The central lesson: a cryptographic signature, a trust decision and update delivery are three distinct mechanisms. In eMudhra, the key failed. The wider impact depended on how many applications continued to trust it.`);
export const scenes=[cover,trust,cross,attack,compare,cloudflare,update,closing];
