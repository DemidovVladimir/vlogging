# TENGU EP.03 — eMudhra: the browser blocks it. Does your app? — TENGU

Revised episode: one continuous story, around five to six minutes including pauses. Estimate, not a measured recording. Bracketed directions are not spoken; bold bridges are spoken.

## 00 / Intro

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / The browser blocks it. Does your app?

[R; then → through the visual phases, following the explanation.]

Imagine your browser rejects a connection with a dangerous certificate, but an application on the same computer accepts it. The application has not necessarily switched off HTTPS. Encryption is still there. The difference is how it checks whom it is connecting to.

That gap matters in the eMudhra incident. A certificate authority had weak private keys. Certificates were revoked and browsers received protection, but that did not automatically fix every application.

**Let’s follow one thread: what broke, how impersonation becomes possible, and where to check the protection.**

## 02 / The key that vouches for websites failed

[R; then → through the visual phases, following the explanation.]

Encrypting a connection is not enough. You also need to know that the other end is the website you intended to reach. The server presents a certificate: its name, its public key, and the issuer’s signature.

That issuer is a certificate authority, or CA. Your application checks its authority through a certificate chain leading back to a root it already trusts. Producing the signature requires a private key that only the owner should know.

Eight eMudhra intermediate authorities had easily recoverable keys. One was literally four. The encryption mathematics did not fail; the keys were generated incorrectly. Six affected authorities were for HTTPS and two for signing software.

Someone who recovers a key can sign a forged certificate for another website. **But a certificate alone does not redirect your traffic to the attacker.**

## 03 / Encrypted. But to the wrong endpoint.

[R; then → through the visual phases, following the explanation.]

Suppose an attacker can already intercept the connection. They present a certificate with the expected name, signed using the compromised authority’s key. If the application accepts it, it establishes an encrypted connection with the wrong party.

The intermediary can separately connect to the real service. There are two encrypted channels, with someone in the middle who can read and change the relayed data. Saying “we use HTTPS” does not settle the question.

This does not unlock every old traffic capture. With forward secrecy, the authority’s key cannot recover those past session keys. **The immediate question is simpler: why did the application accept the forgery?**

## 04 / One certificate. Two sets of checks.

[R; then → through the visual phases, following the explanation.]

A signature answers one question: was this certificate signed with the corresponding key? It does not answer another: should we still trust that key?

Browsers apply additional rules. Certificate Transparency, for example, requires evidence from public certificate logs. In this incident, that requirement already prevented the forgeries from working against clients enforcing it. Direct blocks on the dangerous keys followed.

A separate application might accept the chain and website name without applying the relevant block or transparency check. Even on the same computer, it may read its own file of trusted certificates.

So a browser result cannot clear a command-line tool, a server, or an AI agent’s HTTP tool. **The protection must reach the software that actually opens the connection.**

## 05 / System updated. What about the app?

[R; then → through the visual phases, following the explanation.]

Here is a common trap: the system is updated, but the application still runs an old bundled library or uses its own certificate bundle. In this illustration, we change neither the website nor the request—only the application’s protection.

First, identify the component that verifies certificates. Then apply the recommended fix. An application update may be enough. Other cases require a restart, or a rebuild and deployment of your own service. An updated package on the host does not prove the copy inside a container has changed.

**Installing a fix is not the finish line. Check that the behavior actually changed.**

## 06 / Check rejection, not just an error

[R; then → through the visual phases, following the explanation.]

Dennis Jackson’s incident guide provides controlled test endpoints. They help check whether a client still trusts the affected chains. Use the actual application and network path you want to assess. The test service operator will receive the request.

If the certificate is accepted, that path needs protection. If certificate validation fails, check the reason and the chain: a corporate proxy may have substituted its own. A timeout or DNS error says nothing about certificate trust.

The affected certificates have multiple trust chains, so one address is not a complete test. The guide provides the full set. And do not add an option that disables certificate verification. That hides the problem instead of fixing it.

**Now return to the question on the first screen.**

## 07 / A protected browser is not the whole system.

[R; then → through the visual phases, following the explanation.]

The takeaway is not “HTTPS is broken.” A weak key allowed forged signatures, and different applications stopped trusting them in different ways.

Ask three questions: who verifies the certificate, did the fix reach that component, and did the result change? That applies to ordinary applications and to your AI agent’s tools. A capable model does not replace the software that checks its network connections.

**Check the path your data actually takes—not a reassuring security indicator somewhere else.**
