# EP.04 chaos-kb guide — revision of 28 October 2026 (chaos-kb 2.1.1)

Why: chaos-kb 2.1.0 (ecee6f4609326a64524daf476aee9c7b037c7edd) puts the notes back when the index cannot
follow, so "remember and forget still change the note" became wrong; and the Claude Code exercise without
the CLAUDE.md line was repeated (~/tengu-lab/chaos-kb/claude-code/20261028-0949: 3 of 3 runs looked in the
knowledge base on their own). RU + EN:

- 03: install output `chaos-kb 2.1.0` (installed with the page's own command from GitHub at ecee6f46).
- 04: callout "When the agent looks": the server's routine, 24.10 (did not look) vs 28.10 (3 of 3), the line
  still shown.
- 07: a new row with the real message `error: nothing was changed: embeddings request to …` and its fix; the
  note says an error from remember/forget leaves the note as it was.
- 08: lead and step 2 updated; the two 24.10 screenshots are labelled 24.10.2026; the note gives the 28.10
  repeat. Footer: 28.10.2026 · chaos-kb 2.1.0 · ecee6f4609326a64524daf476aee9c7b037c7edd.
- Every other chaos-kb output on the page re-ran unchanged with that install (see the content.mjs header).

Baseline: production c2577349-a8bd-49ee-b455-d0172b047ca8 (218 files in previous/, live = previous/
checked by verify-baseline.mjs on 28.10). Staged: 2 files changed, 216 byte-identical.

## QA (28.10.2026)

    node build.mjs                       # content-live.mjs renders the live pages byte for byte first
    check-navigation PASS, audit-public PASS
    node serve.mjs public 4184; verify.mjs 39/39; ../tengu-chaos-substrate-revision/verify.mjs 27/27

## 2.1.1 and deploy (28.10.2026)

chaos-kb 2.1.1 (95dd8af63c25ece22de689760abf397e6e407a53): kb_read also takes `id`, the field name in the topics
rows (every round 2 run passed it first and retried). Install output, footer and commit moved to 2.1.1; callout
and step 2 say "chaos-kb 2.1" (six runs out of six looked); the 08 note explains the id/ids retry and the three
round 3 runs without it. Every chaos-kb output re-ran unchanged with the GitHub install of 2.1.1.

QA: build 2 changed / 216 unchanged, check-navigation PASS, audit-public PASS, local 39/39 + 27/27.
DEPLOYED with wrangler as production c7211e8e-8b39-4cfd-a9fa-bda5e9c6e1c4 (created 2026-10-28T14:25:03.085107Z,
site revision 10, previous c2577349-a8bd-49ee-b455-d0172b047ca8). verify-public passed on tengucluster.com,
tengu-presentations.pages.dev and c7211e8e.tengu-presentations.pages.dev; live verify.mjs 39/39 (the first live
run had one flake: two lazy images in 08 not yet loaded at 1920×1080; both return 200 and equal the staged bytes;
two re-runs 39/39), site-wide 27/27. finalize.mjs promoted the baseline ../tengu-cloudflare-pages/.
Rollback target: c2577349-a8bd-49ee-b455-d0172b047ca8.
