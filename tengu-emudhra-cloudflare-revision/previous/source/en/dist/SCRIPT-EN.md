# TENGU EP.03 — eMudhra: the browser blocks it. Does your app? — TENGU

Revised episode: one continuous story, around five to six minutes including pauses. Estimate, not a measured recording. Bracketed directions are not spoken; bold bridges are spoken.

## 00 / Intro

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / The browser blocks it. Does your app?

[R; then → through the visual phases, following the explanation.]

A browser rejects a dangerous certificate, while a service on the same computer connects successfully. Both use encryption. What differs is how they authenticate the other endpoint.

In the eMudhra incident, that distinction is not theoretical. Researchers recovered intermediate certificate authorities’ private keys: keys that can sign certificates for websites. We will follow the failure beyond the key itself: why revocation misses some clients, what Cloudflare changed, and how a fix reaches a running application. **First, what actually broke?**

## 02 / P-384. But the secret was below 256.

[R; then → through the visual phases, following the explanation.]

These keys used the P-384 curve. Yet their private numbers were below 256: only 255 non-zero candidates instead of an unpredictable secret. The public key is already in the certificate, so a candidate can be checked against it. One recovered secret was literally four.

The CA’s preliminary explanation points to its generation procedure: the wrong key set was selected for certificate requests. The details remain under investigation; a broken hardware security module has not been established.

The practical consequence is a signature an outsider can create and a mathematical verifier will accept. **And that signature can connect to more than one trust path.**

## 03 / Two certificates. One dangerous key.

[R; then → through the visual phases, following the explanation.]

The affected keys appeared in both eMudhra certificates and cross-certificates through Sectigo. On screen, the certificate’s issuer changes, but the public key stays the same.

Removing one path does not prove that a client will reject an alternative. Its trusted roots and path-building rules matter.

Blocking an SPKI fingerprint targets the key itself: another certificate containing that key is rejected too. Chrome’s protection uses this approach. That is not a reason to remove an entire Sectigo root blindly; other certificates depend on it. **What can an attacker do if a usable path remains?**

## 04 / Encrypted. But to the wrong endpoint.

[R; then → through the visual phases, following the explanation.]

Suppose an attacker can already intercept the connection. They present a certificate with the expected name, signed using the compromised authority’s key. If the application accepts it, it establishes an encrypted connection with the wrong party.

The intermediary can separately connect to the real service. There are two encrypted channels, with someone in the middle who can read and change the relayed data. Saying “we use HTTPS” does not settle the question.

This does not unlock every old traffic capture. With forward secrecy, the authority’s key cannot recover those past session keys. **The immediate question is simpler: why did the application accept the forgery?**

## 05 / One certificate. Two sets of checks.

[R; then → through the visual phases, following the explanation.]

A valid signature does not mean the key is still trustworthy. Chrome had distinct protections here. Certificate Transparency requires evidence from public logs. Before the block, no site certificates under these TLS authorities had been logged, so clients enforcing CT would not have accepted the forgeries. CRLSet then delivered a direct key block.

A server application may apply a different policy: chain and hostname checks pass, but the relevant block or CT requirement is missing. Publishing a revocation list does not force that application to fetch and enforce it.

**An infrastructure provider therefore had more to fix than the browser-facing side.**

## 06 / What Cloudflare changed

[R; then → through the visual phases, following the explanation.]

Cloudflare patched outbound verification: proxies reaching origins and applications calling APIs. It updated shared trust stores and images, then activated fixes through restarts and deployments. CDN and server-side Zero Trust mitigations were deployed on October twentieth.

cloudflared received version 2026.10.2. **Why is installing an update not always enough?**

## 07 / The fix must reach the running process

[R; then → through the visual phases, following the explanation.]

Take Go. A denylist was added to crypto/x509, with fixes in 1.26.10 and 1.27.3. Updating the compiler on a build machine does not modify a deployed binary. To gain this specific protection, rebuild the service and deploy the new artifact.

That does not make every older binary automatically vulnerable; other checks also affect the outcome. We are illustrating how one concrete fix reaches production.

Another application may use a system store, a separate CA file or a bundled library. Even curl’s trust source depends on its build and settings. Identify what your actual process uses. **Then verify the result, not just a checkmark beside an update.**

## 08 / Test the trust path. Not just the padlock.

[R; then → through the visual phases, following the explanation.]

Use current vendor guidance and the incident’s test chains. You need a certificate-verification failure, not merely a timeout or DNS error. Pair it with an ordinary valid HTTPS request that should still succeed.

Test from the same runtime, trust store and network route as the production service. Otherwise you tested a neighbouring application, not your own.

The central lesson: a cryptographic signature, a trust decision and update delivery are three distinct mechanisms. In eMudhra, the key failed. The wider impact depended on how many applications continued to trust it.
