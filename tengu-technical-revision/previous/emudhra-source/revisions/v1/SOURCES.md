# EP.03 — evidence and editorial boundaries

Checked 22 October 2026. This is a dated incident explainer, not a continuously maintained security advisory. Audience: technically curious adults; 8–10 minutes, deliberately longer than the default five-minute template. The central takeaway: trace the actual certificate verifier and update path, rather than assuming CA revocation or a browser update protects every application.

## Requested sources

- [Mark Jaquith](https://x.com/markjaquith/status/2112700200829759970): joke about choosing a number from the P-384 range. Paraphrased, not treated as cryptographic evidence.
- [hd_nvim](https://x.com/hd_nvim/status/2112943574320820401): RSA PEM-style meme containing 4. The deck explicitly corrects the algorithm mismatch; this is not a valid key-file example.
- [otomir23](https://x.com/otomir23/status/2112697830687047918): claims a friend helped root a smart-home speaker with the certificates. Attributed as an unverified personal report, not a verified exploit or an ecosystem-wide finding.
- [Ali Mosajjal / Fenko](https://fenko.nz/blog/emudhra-ca-compromise/): independent analysis and key comparisons; supports the reported value 4 and cross-signing explanation. Speculation about a particular wrapping bug is NOT presented as established cause.
- [Dennis Jackson’s incident guide](https://emudhra.we-have-a-problem.com/): operational checks, two trust routes, macOS CLI caveat and a changing patch directory. Its remediation commands were not executed. No files from proof.zip or key-recovery repositories are included.

X returned 403 through direct web retrieval. Public post text was obtained on 22 October through api.fxtwitter.com/<author>/status/<id>, with matching original status URLs. Media was not downloaded or reproduced. Social claims were not used to establish cryptographic facts.

## Primary technical evidence

| Topic | Source | What the episode can claim / limits |
| --- | --- | --- |
| Weak key scope | [CERT-In advisory CICA-2026-3649](https://www.cert-in.org.in/s2cMainServlet?CACODE=CICA-2026-3649&pageid=PUBADV01) | P-384 private scalars below 256; bad generation, not an algorithm break. Do not generalize to every eMudhra service. |
| Incident and CA account | [Mozilla bug 2083449, comments 5 and 11](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449) | Eight intermediates, six TLS / two code signing. CA says a second weak set was mistakenly selected after procedure changes. Exact creation mechanism remains under investigation. No conclusion that the HSM vendor is proven responsible. |
| ECDSA keys | [NIST FIPS 186-5, section 6 and appendix A](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf) | Q is a curve point derived from private scalar d and base point G. Multiplication here is a curve operation, not ordinary integer multiplication. 255 nonzero candidates below 256; no statement that P-384 has 384-bit security. |
| Chain validation | [RFC 5280, sections 4.2 and 6](https://www.rfc-editor.org/rfc/rfc5280.html) | Trust anchor is locally selected; path validation includes signatures, time and constraints. A root transmitted by a server does not become trusted just by being transmitted. |
| Verifier behavior | [OpenSSL verification options](https://docs.openssl.org/3.5/man1/openssl-verification-options/) | Path building, constraints, purpose and explicit revocation settings are distinct. A successful chain check is not proof every policy was applied. |
| Hostname and stores | [curl TLS verification](https://curl.se/docs/sslcerts.html) | curl verifies by default; backend, native store and file store choices matter. Do not universally identify curl with one verifier. Never recommend insecure as a fix. |
| Cross-sign blocking and CT outcome | [Google security response, 20 October](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/) | Emergency SPKI blocking covers shared keys across certificates. No affected TLS certificates logged before blocking, protecting CT-enforcing clients under the applicable policy. Root-store removal planned for 27 October is not called already shipped on 22 October. |
| Certificate Transparency | [RFC 6962, sections 3.2 and 5](https://www.rfc-editor.org/rfc/rfc6962.html) | SCT is a log’s signed inclusion promise, not an online revocation result. The episode does not equate a promise with an inclusion proof or claim live log access for each connection. |
| Browser revocation delivery | [Chromium CRLSets](https://www.chromium.org/Home/chromium-security/crlsets/) | Emergency block distribution; not an exhaustive set of all revoked certificates. Chrome does not generally perform online CRL/OCSP requests for each connection. |
| TLS authentication versus decryption | [RFC 8446, sections 4.4 and E.1](https://www.rfc-editor.org/rfc/rfc8446.html) | An accepted forgery enables impersonation if traffic reaches the attacker. CA key alone does not reveal past (EC)DHE traffic secrets. Do not generalize forward secrecy to every PSK or 0-RTT mode. |
| Deployment and real verification path | [Cloudflare response](https://blog.cloudflare.com/emudhra-certificate-compromise) | Bundled/custom stores need separate assessment; rebuilding, restarting and redeploying may be required. Tests apply to the tested TLS path, not the whole device. No active exploitation found on Cloudflare services is not a claim of no exploitation anywhere. |
| Concrete runtime patch | [Go GO-2026-6809](https://pkg.go.dev/vuln/GO-2026-6809) | crypto/x509 denylist; fixed baselines 1.26.10 and 1.27.3. Existing executables do not acquire new standard-library code merely because a compiler was upgraded. Prefer later maintained vendor releases at recording time. |

## Visual truth / simplifications

- All diagrams are authored explanations, not packet captures, measured cryptographic traces or a live exploit.
- The byte panel’s initial values are illustrative; the final 47 zero bytes and 04 illustrate one reported scalar, not all eight.
- The cross-sign diagram shows the TLS route, not the code-signing hierarchy. SPKI blocking is distinct from deleting a root.
- The attacker must be able to receive/intercept the connection and satisfy the client’s checks. Possession of the CA key does not redirect traffic by itself.
- The macOS diagram describes a reported built-in CLI path as of the check date. It does not assert every curl backend behaves alike.
- Test commands exactly match the guide: dv-g3b-emudhra.we-have-a-problem.com and dv-g3b-aaa-emudhra.we-have-a-problem.com. They are a sample, not all twelve TLS chains. A timeout/DNS/proxy failure is inconclusive; check the actual certificate chain and rejection reason. A corporate interception proxy can invalidate assumptions about the path tested.
- No tests against the user’s machine, certificate modifications, private-key recovery, forged certificates, exploit code, dependency upgrades or root-store mutations were performed. The public deck makes no test requests.
- Dates and release details should be rechecked before recording. Narration is original and concise; source prose is not reproduced.

## Private/public boundary

Private: this ledger, content.mjs, author.mjs, scripts, plans, QA, release records and build tools. Public: viewer HTML/CSS/JS, approved images/video/fonts/licenses and deliberately selected source links. The presentation is a new episode; EP01 and EP02 stay byte-identical.
