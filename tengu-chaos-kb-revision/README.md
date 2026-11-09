# EP.04 chaos-kb guide — revision of 27 October 2026

Why: chaos-kb stopped keeping a hash of the whole vault (Merkle root) in
ed73a5e0c80651cf6f8c19b8e8c3942186a5f109, the same day chaos 1.2 dropped its Merkle tree. The guide
still drew the tree, printed vault roots and promised the same root on any machine. RU + EN:

- 02: the "same words" lane ends in the fingerprint table (fingerprint → where it is written). The card
  is now "Fingerprints and note hashes": a note's fingerprints give its hash, which tells `sync` what
  changed. It also says why there is no root: a root serves someone who checks data without holding it,
  like an Ethereum light client, and chaos-kb has every note on disk. The speed table is dated 24.10.2026.
- 03, 05: `sync`, `topics` and `read` outputs re-run with the page's install command at ed73a5e. They
  give the same answers and the same score, 0.28241580724716187, and no longer have a `root` field.
- 04: seven MCP tools (`kb_forget`); the scribe gets remember and forget. The callout is dated to the
  24.10 run, because the server's instructions have changed since.
- 06: new rows for `forget` and `dashboard`.
- 07: what works while Ollama is down. This was checked: `remember` and `forget` still change the note
  and then fail; a retried `remember` stores nothing twice.
- 08: `remember` answers `"stored": true`, and the two commands give a Taste.md byte-identical to the scribe's.
- The footer reads checked 27.10.2026, ed73a5e0c80651cf6f8c19b8e8c3942186a5f109. Sources are in the
  content.mjs header.

Baseline: production 67e09a4c-f550-4b05-bb5a-18caff11d246 (218 files, hash-verified copy in previous/).
Staged: 218 files, of which 2 changed (the two guide pages) and 216 are byte-identical.
build.mjs first renders content-live.mjs and proves that it gives both live pages byte for byte. Only
then does it render content.mjs. The menu envelope is taken from the live page itself.

## Build and QA (27.10.2026)

    node build.mjs
    S=~/.claude/skills/artifact-template-tengu-youtube/scripts
    node $S/check-navigation.mjs --public public       # PASS, 5 bilingual episodes
    node $S/audit-public.mjs --public public --manifest build-manifest.json \
      --ru episodes/chaos-kb/index.html --en en/episodes/chaos-kb/index.html \
      --previous-manifest previous/build-manifest.json $(jq -r '.changed[] | "--allow-change " + .' change-report.json)   # PASS
    node serve.mjs public 4183
    PLAYWRIGHT_DIR=… node verify.mjs http://127.0.0.1:4183                              # 37/37
    (cd ../tengu-chaos-substrate-revision && PLAYWRIGHT_DIR=… node verify.mjs http://127.0.0.1:4183)   # 27/27 site-wide

## Deployed 27.10.2026

The owner asked for it. Deployment record: deployment-record.json.

1. Gates: verify-baseline.mjs showed that live = previous/ (216 files). cf profile `tengu` listed
   production 67e09a4c-f550-4b05-bb5a-18caff11d246.
2. `wrangler 4.151.3 pages deploy public --project-name tengu-presentations --branch main`: 2 files
   uploaded, 214 already there. The deployment is c2577349-a8bd-49ee-b455-d0172b047ca8.
3. verify-public.mjs passed on tengucluster.com, tengu-presentations.pages.dev and
   c2577349.tengu-presentations.pages.dev: 216 hashes, 468 private paths 404. Live, verify.mjs passed
   37/37 and the site-wide checks 27/27.
4. finalize.mjs promoted ../tengu-cloudflare-pages/ (site revision 9).

## Rollback

`cf pages deployments rollback` (profile tengu) to 67e09a4c-f550-4b05-bb5a-18caff11d246. The snapshot
is in previous/.
