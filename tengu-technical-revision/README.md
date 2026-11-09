# TENGU technical revision — 23 October 2026

Published and verified: 213faf4e-df95-4274-8e3d-5941b6173362
https://tengucluster.com/episodes/tengu-cluster/ (EN: /en/episodes/tengu-cluster/)
https://tengucluster.com/episodes/emudhra-ca-compromise/ (EN: /en/episodes/emudhra-ca-compromise/)

16 viewer resources changed. EP.01, catalogs, navigation, shared branding/media and hosting controls remain byte-identical. Authoritative current site snapshot: ../tengu-cloudflare-pages/. This folder preserves this specific release and its prior baseline.

Source inputs: ../tengu-cluster-episode/technical-content.mjs and ../tengu-emudhra-episode/technical-content.mjs, their author.mjs/CSS/renderers. Scripts, director plans, source ledgers and this folder's operational records stay private. Never upload either episode's working dist directory.

QA: four localized decks, every animation phase forward/back, P/R/rate controls, recording mode, menu inertness, intro audio, desktop 720p/1080p and mobile layout. Three HTTPS origins: 142 static hashes plus 128 private 404 probes each. See qa/.

Skill: same SKILL.md, publishing/production guidance and check-navigation.mjs installed in ~/.codex/skills/artifact-template-tengu-youtube and ~/.claude/skills/artifact-template-tengu-youtube; local kit/ZIP updated. Validated in each location. test-skill.mjs tests a new bilingual episode fixture and rejects missing catalog/menu entries, a bad language target and private navigation links. Test fixture is temporary and was never uploaded.

Timing estimates (not a measured presenter read): Cluster RU 5:01 / EN 5:56; eMudhra RU 5:09 / EN 5:40. Intro/pauses included.

Reproduction: author the episode(s), build.mjs stages the fixed prior snapshot, verify.cjs tests the staged site at loopback port 4177, release-check.mjs runs editorial/privacy/navigation gates. upload-assets.mjs uses only a short-lived stdin token with terminal echo disabled. Never print or save credentials. finalize.mjs requires completed live QA. All scripts here are snapshot-specific; reconcile the latest production state before a later release.

Recovery: previous/public is the full former site; previous/cluster-source and previous/emudhra-source are private source backups; previous/tengu-youtube-skill.zip is the old skill package. Nothing material was deleted. The actual Tengu Cluster repository was inspected read-only.
