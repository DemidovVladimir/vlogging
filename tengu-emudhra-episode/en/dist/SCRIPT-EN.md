# TENGU EP.03 — eMudhra: restoring trust — TENGU

Revised episode: one continuous story, around five to six minutes including pauses. Estimate, not a measured recording. Bracketed directions are not spoken; bold bridges are spoken.

## 00 / Intro

[Start the MP4 with sound. Let it finish, then move to 01.]

## 01 / HTTPS still works. Trust does not.

[R; then → through the visual phases, following the explanation.]

Imagine an encrypted connection to the right-looking address, but the server is an impostor. Weak private keys associated with eight eMudhra intermediate certificates made fraudulent certificates possible. Some software could still trust them.

An attacker still needs to intercept the connection, and the client must accept the certificate. The failure is in proving the server's identity, not breaking HTTPS encryption.

**How do you remove that trust across an entire infrastructure, rather than one browser?**

## 02 / Cloudflare verifies other servers, too

[R; then → through the visual phases, following the explanation.]

Cloudflare prioritized outbound connections, updated shared trust stores and images, assessed bundled stores separately, and activated fixes through restarts and deployments.

The browser verifies Cloudflare. Then Cloudflare connects to the website's origin and verifies its certificate. That is Full strict: separate connections, not one continuous protected tunnel.

**So downloading a fix is only part of the job. Which running program actually uses it?**

## 03 / A new file is not a running fix

[R; then → through the visual phases, following the explanation.]

You downloaded a new base image, but the service still runs in an old container. The file on disk changed; the application did not. Build and deploy the new instance.

Some programs load trust configuration only at startup. Node.js reads its additional CA setting when the process starts. Changing that environment variable inside a running program does not reload it.

There is no universal update button. Identify the component and how its update takes effect.

**Start with the software customers install themselves.**

## 04 / Client software needs its own update

[R; then → through the visual phases, following the explanation.]

Check the installed build, not just the product name.

For Tunnel, cloudflared 2026.10.2 is the security release. Its existence does not prove it is installed. In a container deployment, check the image of the running instance.

For other clients, use the report's platform links: mobile and desktop versions differ. “We use Cloudflare” does not describe the full protection configuration.

**Server operators also own certificates and trust decisions of their own.**

## 05 / Whose identity are you checking?

[R; then → through the visual phases, following the explanation.]

In Full strict mode, Cloudflare checks your origin certificate: validity, hostname and trust chain. If that chain is no longer trusted, a working browser tells you little about the origin connection. The origin certificate may need replacing.

With mTLS, the direction changes: the service checks the client's certificate. If you uploaded your own certificate authorities, that configured set matters too. Replacing a server certificate does not automatically repair client authentication.

An error after an update calls for checking the certificate and configuration. Disabling verification removes the protection itself.

**Containers add another choice: where to verify the external server.**

## 06 / Containers: who makes the trust decision?

[R; then → through the visual phases, following the explanation.]

By default, an application inside a container verifies an external HTTPS server itself. Its libraries and trust configuration remain part of the problem.

Cloudflare Containers can intercept outbound HTTPS. This splits the connection: the application trusts the interception CA, while Cloudflare infrastructure verifies the external server. The diagram moves that verification decision, not the entire application.

Interception must be enabled and configured. It does not secure every kind of container traffic or remove the need to maintain dependencies. Ask a specific question: does this connection actually pass through that verifier?

**Ask the same question about your SDK.**

## 07 / Look underneath the SDK

[R; then → through the visual phases, following the explanation.]

An SDK sends its request through an HTTP library, which relies on TLS and a selected set of trusted certificates. Python Requests, for example, normally uses certifi; a different CA bundle can also be configured. A new SDK version tells you little about what changed underneath.

Even curl can use different TLS backends and trust sources. A successful check with one tool is not a check of every other program.

Test the application's own path. Expect two outcomes: an untrusted chain is rejected, and a valid connection still works. A generic network failure does not prove that the fix succeeded.

**This is where a one-off patch becomes an ongoing trust-management problem.**

## 08 / Trust needs an update path

[R; then → through the visual phases, following the explanation.]

Browsers can distribute urgent trust changes quickly. Firefox delivered this block through OneCRL without requiring a browser update. Other software does not automatically inherit that mechanism when it uses a related root-certificate list.

The upki project aims to close that gap for Linux utilities and language runtimes by distributing revocation information. It is a direction for infrastructure, not a claim that every server already has that protection enabled.

The practical takeaway: identify the verifier, deliver the fix into the running program, and check its behaviour. Do not stop at a package version.

Thanks for watching.
