# EP.03 — evidence ledger / revision 4

Checked 23 October 2026. Canonical input: cloudflare-content.mjs; visual generator: cloudflare-visuals.mjs. The eight-scene edition is an independent, concise explanation, not a translation of the complete article. Its narrative is article-led; explanatory examples are separately sourced.

## Sources and exact role

| Source | Used for | Boundary |
| --- | --- | --- |
| [Cloudflare incident report](https://blog.cloudflare.com/emudhra-certificate-compromise) | Response priorities, customer actions, scope qualification, dated rollout milestones | Company self-report, not an independent investigation. No claim of no exploitation across the Internet. |
| [Google incident response](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/) | Weak intermediate keys and impersonation risk | A forged certificate still needs an exploitable connection path and an accepting verifier. No claim that TLS encryption is broken. |
| [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/) | Separate Cloudflare-to-origin authentication; expiry, hostname and chain | This check is not the browser-to-edge check. Custom trust configurations can differ. |
| [Custom mTLS CAs](https://developers.cloudflare.com/ssl/client-certificates/byo-ca/) | Customer-selected CAs used to authenticate clients | Diagram arrows show who verifies whose identity, not handshake packet direction. |
| [cloudflared 2026.10.2](https://github.com/cloudflare/cloudflared/releases/tag/2026.10.2) | Named security-release reference | Dated release, not a perpetual latest-version recommendation. GitHub publication minute differs from the incident timeline; the slide explicitly attributes its timeline to the report. |
| [Docker image guidance](https://docs.docker.com/build/building/best-practices/#rebuild-your-images-often) | Immutable images; rebuild with updated dependencies | An available image is not the running container. The before/after is illustrative, not a measured test. |
| [Node.js additional CA setting](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) | A concrete startup-time configuration example | NODE_EXTRA_CA_CERTS is read at process launch. This illustrates activation, not a recommendation to add a CA as an eMudhra mitigation. |
| [Containers outbound traffic](https://developers.cloudflare.com/containers/configuration/outbound-traffic/) | Opt-in HTTPS interception and verification boundary | Requires appropriate handlers and application trust in the interception CA. No claim of automatic coverage for all container traffic. |
| [Requests advanced documentation](https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification) | Requests uses certifi; custom CA bundles are possible | An example dependency chain, not a claim about Cloudflare's internal stack. |
| [curl TLS verification](https://curl.se/docs/sslcerts.html) | Different backends and trust sources; verification must stay enabled | One curl build does not represent all applications. |
| [Dennis Jackson's incident guide](https://emudhra.we-have-a-problem.com/) | Further checks and remediation references | No test endpoint is contacted by the presentation. Browser checks do not certify the whole device; network errors alone are inconclusive. |
| [Mozilla incident response](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/) | OneCRL emergency update without a browser restart | Applies to supported/default configurations described by Mozilla, not every custom client. |
| [Canonical: upki](https://discourse.ubuntu.com/t/an-update-on-upki/77063) | Linux revocation infrastructure and CRLite integration | Development direction, not universal deployment or blanket protection today. |

## Editorial and visual boundaries

- Public source links accompany the relevant explanation. The original Cloudflare article remains accessible from the cover and close.
- Node.js, Requests and container rollout are original explanatory examples; they are not purported reconstructions of the vendor's internal systems.
- The activation animation depicts a service initially lacking the relevant mitigation and then receiving it. It does not claim every older instance is exploitable.
- Full (strict) checks server identity. mTLS checks client identity as well. The two settings must not be conflated.
- HTTPS interception terminates separate connections; the application must trust the interception CA. The diagram moves external-server verification, not all security responsibilities.
- A negative check needs an understood certificate-rejection reason and a valid-connection control. An outage or DNS failure proves neither vulnerability nor remediation.
- Historical article numbers are not a substitute for current supported releases at recording time. Platform-specific download tables stay at the vendor links instead of being frozen into tiny slide text.
- No live attacks, key recovery, forged certificate generation, trust-store modifications, deployment of interception or software upgrades were performed. All screen changes are authored illustrations.
- The earlier cryptographic deep dive and its research are recoverable in ../tengu-emudhra-cloudflare-revision/previous/source/. They are not current scene content.

## Private/public boundary

Private: this file, ARTICLE-MAP.md, SCRIPT-*.md, STORY-PLAN-*.md, script.html, authoring modules, QA, manifests, backups and skill resources.
Public: viewer HTML/JS/CSS, retained branding/media/fonts/licenses and source hyperlinks only.
The release updates EP.03 RU/EN. EP.01, EP.02, catalogs, menus and hosting controls remain byte-identical.
