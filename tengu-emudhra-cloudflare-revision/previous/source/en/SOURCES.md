# EP.03 — evidence and editorial boundaries

Rechecked 23 October 2026. Revision 3: eight substantive scenes, approximately 5:09 RU / 5:40 EN. This is a dated incident explainer, not a continuously maintained security advisory. The current authoring source is technical-content.mjs. It adds key-generation specifics, cross-signing, Cloudflare's response and a concrete Go rebuild example without returning to a large version table. Earlier source and public releases are recoverable under ../tengu-technical-revision/previous/.

## Revision 3 verification

- Re-read Mozilla bug 2083449, including comments 5 and 11; Fenko's independent key comparison; Google's response; Cloudflare's response; curl's TLS verification documentation; GO-2026-6809 and the cloudflared 2026.10.2 release. Links below remain the evidence ledger, not executable instructions.
- Cloudflare's mitigation scope and deployment time are attributed to its own report. Its statement about exploitation is limited to its services, not the entire Internet. The public scene links the report directly.
- Go's patched crypto/x509 requires a rebuilt/deployed artifact to incorporate that code change; an older build is not automatically proven vulnerable because other trust-policy controls can reject the same chain.
- No test endpoints, certificate-recovery commands, trust-store changes or attacks were executed. All changing outcomes are labelled illustrations.
- Google's planned general root-store removal on 27 October is not presented as already rolled out on 23 October. Android and macOS platform-wide status is omitted rather than generalized from conflicting historical dates.

## Requested sources

- [Mark Jaquith](https://x.com/markjaquith/status/2112700200829759970): joke about choosing a number from the P-384 range. Paraphrased, not treated as cryptographic evidence.
- [hd_nvim](https://x.com/hd_nvim/status/2112943574320820401): RSA PEM-style meme containing 4. Not a valid key-file example: the affected keys are ECDSA P-384. The joke is omitted from the shortened narration.
- [otomir23](https://x.com/otomir23/status/2112697830687047918): claims a friend helped root a smart-home speaker with the certificates. Unverified personal report, not a verified exploit or an ecosystem-wide finding. Omitted from the shortened narration rather than adding a distracting qualification.
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
- The key diagram illustrates how compromised signing authority enables a forged certificate. The numeral 4 refers to one reported scalar, not all eight. Byte arithmetic and the cross-sign diagram were removed from revision 2.
- The same-certificate browser/app comparison and update before/after are illustrations, not measured outputs. They contrast a client applying the relevant protection with one that lacks it, not all browsers versus all applications.
- The attacker must be able to receive/intercept the connection and satisfy the client’s checks. Possession of the CA key does not redirect traffic by itself.
- The shortened deck uses a generic application with separate TLS dependencies. The reported macOS CLI path remains background evidence; it is not generalized to all curl builds.
- Optional test endpoints: dv-g3b-emudhra.we-have-a-problem.com and dv-g3b-aaa-emudhra.we-have-a-problem.com. These sample two routes, not all twelve TLS chains. Revision 2 links to the full guide instead of filling the screen with commands. A timeout/DNS/proxy failure is inconclusive; check the actual certificate chain and rejection reason. A corporate interception proxy can invalidate assumptions about the path tested.
- No tests against the user’s machine, certificate modifications, private-key recovery, forged certificates, exploit code, dependency upgrades or root-store mutations were performed. The public deck makes no test requests.
- Dates and release details should be rechecked before recording. Narration is original and concise; source prose is not reproduced.

## Private/public boundary

Private: this ledger, content.mjs, author.mjs, scripts, plans, QA, release records and build tools. Public: viewer HTML/CSS/JS, approved images/video/fonts/licenses and deliberately selected source links. The presentation is a new episode; EP01 and EP02 stay byte-identical.
