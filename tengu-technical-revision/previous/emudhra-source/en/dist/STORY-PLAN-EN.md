# TENGU EP.03 — Director’s plan

Goal: the viewer can identify the actual TLS verifier and explain why CA revocation alone does not prove application protection. Key arithmetic, issuance procedure and patch versions remain in the technical notes.

## 00 / Intro — 00:00–00:03

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / The browser blocks it. Does your app? — 00:03–00:39

eMudhra: why a revoked certificate can still be accepted.

- 01: The browser rejects it.
- 02: Another application may still connect.

As of 22 Oct 2026 · Illustration, not a test of your device.

## 02 / The key that vouches for websites failed — 00:39–01:40

A certificate links a website name to its public key. The issuer signs that link.

- 01: Normally, only the issuer can produce its digital signature.
- 02: The keys were so weak that other people could recover them.
- 03: With that key, a forged certificate can carry a verifiable signature too.

Simplified: trust in the issuer follows a chain to a root in the client’s trust store. The encryption algorithm was not broken.

## 03 / Encrypted. But to the wrong endpoint. — 01:40–02:23

Impersonation needs both: the connection reaches the attacker, and the client accepts the certificate.

- 01: Normally, your application connects to the real service.
- 02: An attacker intercepts the connection and presents a forged certificate.
- 03: If the application accepts it, encryption ends at the intermediary.

Threat illustration, not a reproduced attack. The CA key alone does not reveal old sessions protected by forward secrecy.

## 04 / One certificate. Two sets of checks. — 02:23–03:17

Keep the certificate the same. Change the application’s verification rules.

- 01: A valid signature does not prove the issuer should still be trusted.
- 02: The browser applies additional checks and blocks.
- 03: Another application may use a separate set of trusted certificates and rules.

Illustrative comparison, not a verdict on every curl build or an entire OS. The actual build and settings matter.

## 05 / System updated. What about the app? — 03:17–03:59

The same test certificate. Only the running application’s protection changes.

- 01: Updating the system may leave the application’s bundled dependencies unchanged.
- 02: Update the relevant component and run the corrected version.
- 03: Now the same application rejects the same dangerous certificate.

Illustration of a fix. Required steps depend on the application; follow its vendor’s guidance.

## 06 / Check rejection, not just an error — 03:59–04:46

Test through the actual application, not a convenient browser next to it.

- 01: The test endpoints present certificates using affected chains.
- 02: Look for a rejection of the certificate’s trust.
- 03: A network failure does not prove the application is protected.

Follow the link for the full test set. This page runs no tests. Do not disable certificate validation to make a request succeed.

## 07 / A protected browser is not the whole system. — 04:46–05:13

Check the software you actually trust with your data.

- 01: Find the actual verifier.
- 02: Deliver the fix to it.
- 03: Confirm the result on the real connection path.

Sources and operational guidance are linked. Incident snapshot: 22 Oct 2026.

## Controls

P pause/resume; R reset paused; ←/→ phases; −/+ speed (0.25×–2×); 0 normal. Down/PageDown/Space next; Up/PageUp/Shift+Space previous; Home/End intro/closing. Wheel/touch scroll naturally. Reduced motion uses the last phase; manual steps still work. Diagrams hold at the final phase. Controls do not scrub the MP4.

Record only the presentation; keep the local script.html in another window. Slides do not execute displayed commands, test the viewer’s certificates or contact test endpoints.
