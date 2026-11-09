# TENGU EP.03 — Director’s plan

Goal: the viewer can identify the actual TLS verifier and explain why CA revocation alone does not prove application protection. Includes cross-signing, Cloudflare’s response and a concrete Go fix-delivery example, without equations or version tables.

## 00 / Intro — 00:00–00:03

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / The browser blocks it. Does your app? — 00:03–00:37

eMudhra: why a revoked certificate can still be accepted.

- 01: The browser rejects it.
- 02: Another application may still connect.

Checked 23 Oct 2026 · Diagrams, not a test of your device.

## 02 / P-384. But the secret was below 256. — 00:37–01:23

Weak key generation, not a broken algorithm. Eight intermediate CAs: six TLS, two code signing.

- 01: The CA certificate exposes a public key against which candidates can be checked.
- 02: The private numbers were so small that researchers recovered them.
- 03: The CA’s preliminary report says an unintended key set was used in certificate requests.

The procedural root cause remains under investigation. A broken HSM has not been established.

## 03 / Two certificates. One dangerous key. — 01:23–02:05

Cross-signing: the same public key is certified through a different issuer chain.

- 01: The client builds a path from the site certificate to a trusted root.
- 02: Another certificate carrying the same key may provide an alternative path.
- 03: An SPKI block targets the public key, not just one certificate.

Two routes, with intermediate links condensed. Path availability depends on the client’s trust store.

## 04 / Encrypted. But to the wrong endpoint. — 02:05–02:45

Impersonation needs both: the connection reaches the attacker, and the client accepts the certificate.

- 01: Normally, your application connects to the real service.
- 02: An attacker intercepts the connection and presents a forged certificate.
- 03: If the application accepts it, encryption ends at the intermediary.

Threat illustration, not a reproduced attack. The CA key alone does not reveal old sessions protected by forward secrecy.

## 05 / One certificate. Two sets of checks. — 02:45–03:28

Keep the certificate the same. Change the application’s verification rules.

- 01: Signature, hostname and chain checks are not the entire trust policy.
- 02: CT requires evidence from public logs; CRLSet distributes the block.
- 03: A CA publishing a revocation does not force every TLS client to enforce it.

Illustrative comparison, not a verdict on every curl build or an entire OS. The actual build and settings matter.

## 06 / What Cloudflare changed — 03:28–04:03

Outbound HTTPS: proxy → origin, application → external API.

- 01: Shared trust stores and images received fixes.
- 02: Running services must actually load the fix.
- 03: Client-side cloudflared: update 2026.10.2; redeploy containers.

Cloudflare found no exploitation on its services. That is not a claim about the whole Internet.

## 07 / The fix must reach the running process — 04:03–04:51

Concrete example: Go added a block in crypto/x509. An old binary does not change with it.

- 01: A new compiler on the build host does not modify a running binary.
- 02: Rebuild with a patched Go version and deploy the new artifact.
- 03: Test this exact TLS path: the dangerous chain is rejected.

GO-2026-6809: fixed in Go 1.26.10 / 1.27.3. Illustrative states, not a test of your service.

## 08 / Test the trust path. Not just the padlock. — 04:51–05:30

From the application to the component that actually verifies the certificate.

- 01: A DNS error or timeout does not demonstrate certificate blocking.
- 02: A positive control separates protection from a broken network.
- 03: One browser test cannot clear every application you run.

As of 23 Oct 2026 · Do not disable certificate verification to suppress errors.

## Controls

P pause/resume; R reset paused; ←/→ phases; −/+ speed (0.25×–2×); 0 normal. Down/PageDown/Space next; Up/PageUp/Shift+Space previous; Home/End intro/closing. Wheel/touch scroll naturally. Reduced motion uses the last phase; manual steps still work. Diagrams hold at the final phase. Controls do not scrub the MP4.

Record only the presentation; keep the local script.html in another window. Slides do not execute displayed commands, test the viewer’s certificates or contact test endpoints.
