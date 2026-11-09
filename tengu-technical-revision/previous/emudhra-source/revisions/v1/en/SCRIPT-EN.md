# TENGU EP.03 — eMudhra: eight bits of trust — TENGU

Extended technical episode, around nine minutes including pauses. Estimate, not a measured recording. Bracketed directions are not spoken; bold bridges are spoken.

## 00 / Intro

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / A key to trust. Four.

[R; then → through the visual phases, following the explanation.]

The posts joke about picking a random number and a private key equal to four. That number is real. The RSA label in the meme is not: the affected keys use the P-384 elliptic curve.

Eight eMudhra intermediate CA keys were compromised: six for TLS and two for code signing. We’ll focus on HTTPS.

The surprising part is that revoking a certificate doesn’t automatically stop every application from accepting it. This is a failure of key generation and of how protection reaches software, not a break in the encryption algorithm. **First, where does that trust come from?**

## 02 / A certificate delegates trust

[R; then → through the visual phases, following the explanation.]

A certificate binds a website’s name to a public key. A server could claim anything, so the client checks who signed it, and who authorized that issuer, back to a root it already trusts.

An intermediate can issue certificates within its constraints. Here, outsiders recovered the intermediate’s private key. They did not need the root’s private key.

Validation also checks dates, permitted uses, constraints and the requested hostname. During the handshake, the server proves it holds the matching private key. But a mathematically valid signature does not tell you whether its issuer has been revoked. **Why was this secret so easy to recover?**

## 03 / A large curve. A tiny secret.

[R; then → through the visual phases, following the explanation.]

We need one relationship, not a mathematics lecture. The private key is a number, d. A known curve point, G, is used to derive the public key, Q. Computing Q from d is easy. Recovering a properly random d from Q is impractical.

But a very small secret changes the problem. There are only 255 nonzero candidates below 256. A matching public key identifies the secret without defeating the curve’s normal security.

A large certificate and the P-384 label cannot compensate for poor key generation. **So the next question is operational: how did these keys get certified?**

## 04 / The wrong keys got certified

[R; then → through the visual phases, following the explanation.]

eMudhra’s preliminary explanation is that a change to the key-transfer procedure produced a second, weak set. Similar labels then led to the wrong keys being selected for certificate requests. Those public keys were certified.

This is the CA’s account, not a completed independent investigation. The exact operation that produced the tiny numbers, and the hardware module’s role, remain under scrutiny. **The consequence is already clear, though: the same weak key could have more than one trust path.**

## 05 / One key. Two trust paths.

[R; then → through the visual phases, following the explanation.]

Cross-signing does not create a new secret. Different issuers certify the same public key. A client can build a path through whichever branch it trusts.

The affected keys had certificates through emSign and through Sectigo’s AAA Certificate Services. Checking only one route can miss the other. Removing one root does not necessarily eliminate an alternative path.

Google blocked hashes of the Subject Public Key Info structure: SPKI. That identifies the key even across certificates issued by different authorities. It targets the shared key, rather than just one certificate file. **What can an attacker actually do with that key?**

## 06 / Impersonation, not time travel

[R; then → through the visual phases, following the explanation.]

With the CA key, an attacker can sign a certificate for a target name containing their own server public key. That does not automatically route anyone’s traffic to them. They also need an on-path position or another way to receive the connection. The client must still accept the chain.

An intermediary can then establish two TLS sessions. Encryption works, but the attacker is an endpoint and can read or change data being relayed.

That does not unlock old captured sessions. With ephemeral key exchange such as (EC)DHE, the CA key alone cannot recover past session keys. **The decisive point is the client’s certificate check.**

## 07 / Signature, revocation and CT differ

[R; then → through the visual phases, following the explanation.]

Separate three questions. First: does the chain validate, and does the name match? Second: has a certificate or key been revoked or blocked? A CRL publishes revoked certificates. OCSP can report status. A client must actually consume and apply that information.

Third is Certificate Transparency. A client enforcing CT requires signed promises from logs, called SCTs. It does not query a log on every page load, and CT does not replace revocation.

In this incident, the absence of compliant CT records prevented forgeries against CT-enforcing clients. Emergency blocks followed. Chrome distributes these through CRLSet, not a mandatory live OCSP request for every connection. **A command-line program may apply different rules.**

## 08 / One Mac. More than one trust path.

[R; then → through the visual phases, following the explanation.]

Passing a Safari or Chrome test does not clear the whole Mac. One application uses system policy; another uses its own certificate file.

The incident guide calls out a built-in command-line path using /etc/ssl/cert.pem. An unchanged bundle, combined with no effective revocation check, can leave an old chain acceptable. That does not mean every curl build on every Mac behaves identically.

curl supports multiple TLS backends and ways to select trusted CAs. Check the binary actually running, its build and its configuration. “The operating system is updated” is not enough information. **On a server, the gap between an update and running code can be larger still.**

## 09 / The fix must reach the running process

[R; then → through the visual phases, following the explanation.]

Go added a denylist in crypto/x509, with fixes in 1.26.10 and 1.27.3 for those release branches. Installing a newer compiler does not change an executable already built. Rebuild the application and deploy it.

Likewise, updating a package on the host may leave a container image untouched. For an AI agent, inspect the HTTP tool or SDK that actually connects. A smarter model does not repair that tool’s TLS validation.

Another linked post claims the certificates helped root a smart speaker. We have not reproduced that claim; it does not establish that every device is affected. **How do you check your own path without attacking anything?**

## 10 / Test rejection, not just an error

[R; then → through the visual phases, following the explanation.]

Dennis Jackson’s guide provides controlled endpoints with emSign and AAA chains. These commands make ordinary requests to those endpoints. They do not install anything or modify the certificate store, although the service operator can see the requests.

If your client accepts the test chain, that verification path needs attention. If certificate validation fails, confirm why: a corporate proxy could substitute a different chain. A timeout or DNS failure tells you nothing about protection.

These two addresses sample two routes. The guide has a broader test set. Use the application’s real network path, not a convenient substitute. **Verification is the final step of deployment, not an optional extra.**

## 11 / Close the gap without disabling checks

[R; then → through the visual phases, following the explanation.]

The practical sequence is: identify the verifier, apply the vendor’s fix, deliver it to the running process, and test from that process. Operators of affected websites may also need replacement certificates from another trusted hierarchy.

Do not turn a certificate error into an excuse to disable verification. Do not delete arbitrary roots based on a screenshot: you may break unrelated connections while leaving another path open.

Devices without updates need a separate containment and replacement plan. **An incident is not over when the patch is published. It is over when the outdated trust is gone from real connections.**

## 12 / Trust needs maintenance

[R; then → through the visual phases, following the explanation.]

The story of the number four sounds absurd. The practical lesson is not: cryptography, trust policy and update delivery are separate parts of protection. None replaces the others.

Sources and current checks are on screen. Before acting, check the latest vendor guidance. This investigation is still developing.
