# EP.03 Cloudflare-led revision — 23 October 2026

Public RU: https://tengucluster.com/episodes/emudhra-ca-compromise/
Public EN: https://tengucluster.com/en/episodes/emudhra-ca-compromise/
Deployment: 164c89c5-ad6a-483f-bc55-d65e570dcceb.
Prior deployment: 213faf4e-df95-4274-8e3d-5941b6173362.

This is a complete 144-file site snapshot. Only eight EP.03 viewer resources changed. Other episodes, both catalogs, all navigation, approved assets, fonts and hosting controls are unchanged.

## Sources and privacy

Authoring: ../tengu-emudhra-episode/cloudflare-content.mjs, cloudflare-visuals.mjs, author.mjs, episode.css and render.js.
Narration and plans: ../tengu-emudhra-episode/ru/ and en/; local script.html readers are loopback-only and excluded from the upload.
No skill resources, private source, notes, scripts or QA files exist in public/.

## QA and reproduction

build.mjs verifies the saved prior inventory and stages eight explicitly allowed replacements, retaining the navigation envelope.
serve.mjs serves only public/ on 127.0.0.1:4178.
verify.cjs checks both languages, every phase forward/back, intro audio, keyboard, navigation and five viewports.
verify-phases.cjs captures 46 phase screenshots and checks pause, rate bounds, focus, language switching and recording URLs.
release-check.mjs validates the episodes, privacy inventory and bilingual navigation.
verify-public.mjs verifies 142 static hashes and 144 private 404 paths per HTTPS origin.
finalize.mjs promotes only after local/live browser QA and all three origin reports pass.

Final success is recorded in deployment-record.json; current authoritative baseline is ../tengu-cloudflare-pages/.
These are snapshot-specific release tools. Reconcile the current remote deployment and local baseline before another upload.
The uploader accepts a short-lived Pages token on non-echoing stdin only. Credentials are not saved in the package.

## Delivery

Eight substantive scenes plus the existing logo sting. 23 phases per language. Estimated including pauses: RU 5:12; EN 5:26. Narration has not been timed with the presenter.
P pause; R reset paused; arrows left/right phase; minus/plus speed; 0 normal; up/down scene; H recording navigation.
The full previous site and old private source are preserved under previous/. Nothing material was deleted.
