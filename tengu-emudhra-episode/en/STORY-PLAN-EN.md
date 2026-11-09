# TENGU EP.03 — Director’s plan

Goal: connect trust failure to provider and customer actions. Independent explanation following Cloudflare’s argument: cause → infrastructure response → activation → clients → origin/mTLS → containers → dependencies → rapid trust updates. Node.js and Requests are explanatory examples, not claims about Cloudflare internals.

## 00 / Intro — 00:00–00:03

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / HTTPS still works. Trust does not. — 00:03–00:39

eMudhra: how a certificate-authority failure becomes an infrastructure-wide problem.

- 01: Weak CA keys undermine what a trusted signature proves.
- 02: Forged certificate + intercepted connection → traffic can be read or altered.

Cloudflare found no exploitation on its services. Report: 20 Oct 2026.

## 02 / Cloudflare verifies other servers, too — 00:39–01:14

Verification is not limited to the browser-to-website connection.

- 01: The visitor verifies Cloudflare. There is another connection behind it.
- 02: Cloudflare → origin and application → API: mitigation priorities.
- 03: Shared stores and images updated; bundled stores assessed separately.

20 Oct UTC: 02:00 clients · 09:15 cloudflared · 19:20 CDN / server-side Zero Trust. Cloudflare timeline.

## 03 / A new file is not a running fix — 01:14–01:54

Illustrative rollout: update the foundation, then replace the running instance.

- 01: The fix is available. The running instance has not changed yet.
- 02: Update the relevant dependency and deliver it into the application.
- 03: A new verification check confirms the changed behaviour.

Illustration, not a measured test. Reload, restart or redeploy depends on the application.

## 04 / Client software needs its own update — 01:54–02:29

A cloud-side fix does not replace the software on your device.

- 01: Check the installed version, not just whether a release exists.
- 02: cloudflared is a separate program; containers need redeployment too.
- 03: Gateway + an up-to-date client: Cloudflare’s stated protection condition.

Versions are a dated incident snapshot. Check the sources for current fixes and platform builds.

## 05 / Whose identity are you checking? — 02:29–03:10

Two separate configurations. Fixing one does not fix the other.

- 01: The origin needs a valid certificate for its hostname and a trusted chain.
- 02: With mTLS, the service checks the client against configured CAs.
- 03: Review both directions. Do not disable verification to silence an error.

The arrows show identity verification, not every message in the TLS handshake.

## 06 / Containers: who makes the trust decision? — 03:10–03:49

HTTPS interception changes where the external server is verified.

- 01: Ordinary outbound HTTPS uses the application’s trust mechanism.
- 02: With interception configured, Cloudflare verifies the external server.
- 03: This does not secure the whole container: the boundary is intercepted connections.

Interception is opt-in. The app must also trust the interception CA; images and dependencies still need maintenance.

## 07 / Look underneath the SDK — 03:49–04:33

The top layer changed. Did the trust decision change with it?

- 01: An API call passes through dependencies. Verification happens below the SDK.
- 02: A browser result does not test a different TLS stack.
- 03: Check the real app: reject the bad chain, keep valid connections working.

Do not disable certificate verification. Illustrative states; the slide runs no network tests.

## 08 / Trust needs an update path — 04:33–05:05

A CA list is only the beginning. Revocation must reach the verifier.

- 01: Firefox delivered a OneCRL block without a browser update.
- 02: upki brings revocation infrastructure to Linux software.
- 03: Find the verifier → apply the fix → confirm the result.

An independent TENGU explanation based on Cloudflare’s report and product documentation. Not an official Cloudflare publication.

## Controls

P pause/resume; R reset paused; ←/→ phases; −/+ speed (0.25×–2×); 0 normal. Down/PageDown/Space next; Up/PageUp/Shift+Space previous; Home/End intro/closing. Wheel/touch scroll naturally. Reduced motion uses the last phase; manual steps still work. Diagrams hold at the final phase. Controls do not scrub the MP4.

Record only the presentation; keep the local script.html in another window. Slides do not execute displayed commands, test the viewer’s certificates or contact test endpoints.
