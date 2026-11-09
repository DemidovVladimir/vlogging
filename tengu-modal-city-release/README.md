# Modal City navigation release — 26 October 2026

The site now links to the Modal City trainer (Vim, tmux, terminal; English only) at
https://tengucluster.com/modal-city/. The trainer itself is not part of this Pages project: it is
the separate Worker `tengu-modal-city` on the route `tengucluster.com/modal-city*`, with its
static files and a D1 database for accounts and progress. Source, tests and deploy notes:
/Users/vladimirdemidov/development/neovim_pro/site (Worker) and tools/ (build, site-dev, site-e2e).
Pages releases that redeploy public/ do not touch it.

Deployed 26.10.2026: production d19c7d06-0851-432f-b55a-354fcfde01eb (revision 6, previous
b0bd4027-f710-4779-928b-a56355ebb169). Worker version 48b450ed-fd3e-41b0-9d91-daaff95ccc97.
Record: deployment-record.json; baseline promoted to ../tengu-cloudflare-pages/.

## What changed (12 of 166 files; everything else byte-identical, build.mjs proves it)

- index.html, en/index.html: "Тренажёр" / "Trainer" in the header nav after "Выпуски" / "Episodes"
  (the RU link carries hreflang="en"), and the new catalog.css cache key.
- site/catalog.css: one rule for 320–374 px that tightens the header padding and gaps by 24 px, so
  the extra tab fits a 320 px phone without sideways scrolling.
- The 8 viewers (4 episodes × RU/EN): in the episode menu, a second link next to "← На главную" /
  "← Home": "Тренажёр Modal City (на английском): Vim, tmux, терминал →" / "Modal City trainer:
  Vim, tmux, terminal →", both in a new .episode-menu__links row; and the new site.css cache key.
- site/site.css: that row's rule (`display:flex; flex-wrap:wrap; column-gap:28px`).

## Build and QA

    node build.mjs                      # public/, build-manifest.json, change-report.json
    S=~/.claude/skills/artifact-template-tengu-youtube/scripts
    node $S/check-navigation.mjs --public public
    node $S/audit-public.mjs --public public --manifest build-manifest.json --ru index.html --en en/index.html \
      --previous-manifest previous/build-manifest.json $(jq -r '.changed[] | "--allow-change " + .' change-report.json)
    node serve.mjs public 4181
    export PLAYWRIGHT_DIR=/Users/vladimirdemidov/development/neovim_pro/tools/node_modules/playwright-core
    node verify-trainer.mjs http://127.0.0.1:4181   # the new links, 320–1920 px (28 checks)
    node verify.mjs http://127.0.0.1:4181           # EP.04 release regression suite, unchanged (33 checks)

Results, local and on tengucluster.com: navigation PASS, audit PASS (166 files, 12 authorized
changes), verify-trainer 28/28, verify 33/33. Before the fix in catalog.css the RU header was 16 px
too wide at 320 px.

## Deployment

1. Baseline: previous/ is ../tengu-cloudflare-pages as of b0bd4027-f710-4779-928b-a56355ebb169,
   hash-checked against its manifest and against the live site (qa/tengucluster.com/baseline-verification.json).
2. The Worker went first and was verified (route wins over Pages for /modal-city*, the rest of the
   site still served by Pages; neovim_pro tools/site-e2e.mjs --base https://tengucluster.com: 60/60).
3. Upload: `wrangler 4.151.3 pages deploy public --project-name tengu-presentations --branch main`,
   with the cf profile `tengu` OAuth token in CLOUDFLARE_API_TOKEN. 12 files uploaded, 152 already there.
4. Live: verify-public.mjs on tengucluster.com, tengu-presentations.pages.dev and
   d19c7d06.tengu-presentations.pages.dev: 164 hashes match, 280 private paths 404, /ru redirects to /.
   Browser suites on tengucluster.com as above; a click from each catalog's tab and each menu lands
   on /modal-city/, and the trainer's "TENGU ↗" link returns to / or /en/ by the referring page.
5. finalize.mjs promoted this snapshot (build-manifest.json, upload-manifest.json with Wrangler's
   blake3 keys: the 152 unchanged keys reproduced, record) to ../tengu-cloudflare-pages/.

## Rollback

- Navigation only: `cf pages deployments rollback` (profile tengu) to b0bd4027-f710-4779-928b-a56355ebb169;
  the snapshot is in previous/.
- The trainer: delete the Worker route (or the Worker `tengu-modal-city`); /modal-city/ then falls
  back to the Pages 404. Roll the navigation back first, so no link points at a 404.
