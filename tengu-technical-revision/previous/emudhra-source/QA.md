# EP03 revision 2 QA — 22 October 2026

## Editorial

One question: why can a protected browser reject a certificate while another application accepts it?
Seven substantive screens plus intro, twenty phases. Every scene adds a distinct step: consequence → weak signing key → conditional impersonation → different verification → actual application update → meaningful test → practical close.

Removed equation/byte arithmetic, CA ceremony, separate cross-sign lecture, acronym catalog, version table and terminal command wall. Detailed evidence remains in private SOURCES.md. The unverified smart-speaker claim is not used to establish an attack.

RU: 615 spoken words; 294 seconds estimated at 140 wpm plus 30 seconds of pauses.
EN: 744 words; 349 seconds on the same estimate. Presenter rehearsal is still needed.

The signature/identity/encryption distinction is preserved. A forged certificate alone does not redirect traffic. Not every curl or operating system behaves identically. CT and revocation are not equated. Before/after outputs are explicitly illustrative, not measured.

## Local acceptance

Both check-episode runs passed with ready metadata, zero warnings. Browser QA passed RU and EN:
- All 8 scenes, 20 phases in both directions; pause/reset/speed/navigation/hash refresh.
- Reduced motion and manual phases, focused-link guards, background clock freeze when a real hidden state is exposed.
- 1280×720, 1920×1080, 1440×900, 664×853 and 390×844.
- No horizontal overflow, desktop vertical clipping or JS/resource errors.
- Dedicated cover intersection test confirms heading, comparison and artwork do not overlap at any tested size.
- Intro: real click-started playback, 1920×1080, audible track decoded, about 2.4 seconds.
- Private script/plan readers load only locally; no reader links in viewer.
- Both all-phase contact sheets and overviews inspected, plus full-size cover on desktop/tablet/mobile and update intermediate frame.

Cover now uses an independent named grid. At narrow widths the heading spans the width and the comparison sits alongside the character. Statistics strip and technical caveats no longer compete with the opening question. Closing still uses the complete silhouette and unfiltered logo.

Evidence: qa/local/verification.json and screenshots. The previous authored version is recoverable under revisions/v1/; its public release under release/.

## Public release gate

release-v2/ is a fresh full-site snapshot, never the private working dist.
Only eight authorized EP03 viewer files may differ: index.html, app.js, journey.js and episode.css in RU and EN.
All 131 other files must remain byte-identical, including all 87 EP01/EP02 files.
Total public inventory remains 139 files, 137 static assets and two control files.
No DNS, trust store or security settings are changed. Presentation never runs endpoint checks.

Before publishing: audited manifest, authenticated project identity and unchanged production baseline bc795e24-58cf-48f9-bd86-ceff6915ccd0.
After publishing: use the release-v2 receipt and fresh live reports, not the old v1 success record. Require 137 static hash matches, 90 real private-path 404s per origin, root redirects and full live browser checks for both languages.

## Final live acceptance

Deployment e56daf0f-c3bf-42b6-89c5-51f21e5d0de8 succeeded; final receipt is release-v2-final/deployment-record.json. All 137 static hashes and 90 private-path 404 checks passed on the custom domain, Pages fallback and immutable deployment. Both languages passed the complete live browser suite: 8 scenes, 20 phases, five sizes and intro audio.

An existing browser tab exposed stale cached JS after the initial content release. The final HTML uses versioned URLs for app.js, journey.js and episode.css. In the same existing IAB tab, the ordinary public URL now shows the new chapter, matching caption and correct manual phases. The automated suite asserts versioned URLs and seven animation scene records. A first final browser attempt timed out during concurrent media/hash downloads; a fresh full run after those downloads passed without viewer code changes.

Only the eight intended EP03 viewer files differ from v1. Other episodes and brand assets are unchanged. Prior releases remain recoverable; nothing material was deleted.
