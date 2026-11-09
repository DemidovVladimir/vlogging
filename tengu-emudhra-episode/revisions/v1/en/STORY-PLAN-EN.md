# TENGU EP.03 — Director’s plan

Goal: the viewer can identify the actual TLS verifier and explain why CA revocation alone does not prove application protection. More technical detail is intentional.

## 00 / Intro — 00:00–00:03

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / A key to trust. Four. — 00:03–00:41

eMudhra: not broken encryption, but failed keys and uneven protection.

- 01: One intermediate CA private key was the number 4.
- 02: Revoking certificates does not automatically update every client.

As of 22 Oct 2026. The “RSA PRIVATE KEY” post is a joke, not the actual key format.

## 02 / A certificate delegates trust — 00:41–01:29

The server supplies a chain. The client checks it against a root it trusts.

- 01: A trusted root is the client’s starting point, not a gift from the server.
- 02: The root signs an intermediate that can issue certificates.
- 03: The client validates the path and server name. Revocation and CT add checks.

Simplified path. CA = certificate authority. api.example.com is illustrative.

## 03 / A large curve. A tiny secret. — 01:29–02:17

Q = d × G: the public key Q is computed from the secret number d.

- 01: Normally, d is chosen unpredictably from an enormous range.
- 02: All eight affected secrets were smaller than 256.
- 03: Comparing public keys identifies the weak secret. P-384 itself was not broken.

× denotes elliptic-curve scalar multiplication. Diagram, not key-recovery code.

## 04 / The wrong keys got certified — 02:17–02:55

eMudhra’s preliminary account: a procedure failure, then a selection failure.

- 01: The CA reports a second key set after a wrap/unwrap procedure change.
- 02: According to the CA, similar labels led to weak keys being selected for CSRs.
- 03: Signing certified the mistake. The exact weak-key mechanism is not yet settled.

CSR is a certificate request containing a public key. A defective HSM has not been established.

## 05 / One key. Two trust paths. — 02:55–03:44

Cross-signing: different certificates certify the same public key.

- 01: Left: a path through emSign.
- 02: Right: Sectigo cross-signing creates another certificate for the same key.
- 03: Removing one path is insufficient if the client still accepts the other.
- 04: An SPKI block covers certificates carrying that public key.

One affected TLS key is shown. SPKI is the public-key structure; its hash is blocked.

## 06 / Impersonation, not time travel — 03:44–04:35

The danger is a client accepting a forged server identity.

- 01: Normally, the client authenticates the server and establishes encryption keys.
- 02: Impersonation needs a certificate and a way to direct the connection to the attacker.
- 03: If the client accepts the forgery, an intermediary can read or alter relayed data.
- 04: The CA key alone does not retrospectively decrypt captures with forward secrecy.

Threat model, not an attack demo. Forward secrecy protects past sessions after long-term key compromise.

## 07 / Signature, revocation and CT differ — 04:35–05:32

A valid chain does not guarantee acceptance.

- 01: The signature check asks whether the certificate matches the issuer’s key.
- 02: CRL / OCSP and local blocks convey revocation—if the client applies them.
- 03: CT requires signed log promises, called SCTs. It is not a CRL check.
- 04: Here, CT and emergency blocks protected browsers; other clients could lag behind.

Google: no TLS certificates from these CAs were logged before blocking. CRLSet is not an exhaustive revocation list.

## 08 / One Mac. More than one trust path. — 05:32–06:23

A particular TLS library, with a particular configuration, performs the check.

- 01: A system policy update protects clients that actually use that policy.
- 02: A PEM bundle is a collection of certificates, not automatic revocation delivery.
- 03: The name curl is not enough: the build, backend and selected store matter.

Built-in CLI behavior reported by the incident guide as of 22 Oct 2026; not all macOS/curl versions.

## 09 / The fix must reach the running process — 06:23–07:11

Dependency updated ≠ image rebuilt ≠ new process running.

- 01: Go added a denylist in crypto/x509. Updating the toolchain is only step one.
- 02: The corrected code must be included in a new application build.
- 03: After deployment, test the real process—including an agent’s HTTP tools.

Go versions are advisory fix baselines, not permanent recommendations. The otomir23 speaker report is not independently verified.

## 10 / Test rejection, not just an error — 07:11–07:59

One client. Both chains. Certificate verification stays enabled.

- 01: Use the controlled test endpoints published in the incident guide.
- 02: Look for a certificate-validation failure, not an arbitrary network error.
- 03: Two routes are a sample, not a complete test of every affected CA or application.

This page does not run commands. Do not use -k / --insecure. The test service receives an ordinary request.

## 11 / Close the gap without disabling checks — 07:59–08:42

Clients need current validation. Site owners need a valid, trusted chain.

- 01: Map the clients: browsers, CLI tools, runtimes, containers and devices.
- 02: The update must reach the verifier or bundle actually in use.
- 03: Unmaintained systems need isolation and a replacement plan; sites may need reissuance.

Root removal can break unrelated sites and still leave an alternate path. Coordinate infrastructure changes with its owner.

## 12 / Trust needs maintenance — 08:42–09:02

An unpredictable secret. Current validation. A fix in the running client.

- 01: A sound algorithm cannot fix poor key generation.
- 02: A correct revocation cannot help a client that never applies it.
- 03: Check real verification paths, not whether a computer is “updated”.

TENGU / EP.03 / SOURCES CHECKED 22 OCT 2026 · Investigation ongoing.

## Controls

P pause/resume; R reset paused; ←/→ phases; −/+ speed (0.25×–2×); 0 normal. Down/PageDown/Space next; Up/PageUp/Shift+Space previous; Home/End intro/closing. Wheel/touch scroll naturally. Reduced motion uses the last phase; manual steps still work. Diagrams hold at the final phase. Controls do not scrub the MP4.

Record only the presentation; keep the local script.html in another window. Slides do not execute displayed commands, test the viewer’s certificates or contact test endpoints.
