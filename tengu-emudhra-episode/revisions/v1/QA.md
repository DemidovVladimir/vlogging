# EP03 QA

## Editorial review — 22 October 2026

- All five requested links are accounted for. Two jokes are distinguished from evidence; the IoT claim is attributed and not independently verified.
- Verified crypto/PKI facts against NIST, RFCs, CERT-In, Mozilla, Google, curl, OpenSSL and Go. CA preliminary explanation is marked preliminary. No assertion that P-384 itself failed or that all historical HTTPS traffic is decryptable.
- Distinct scene jobs; the final action sequence consolidates mechanisms into a decision rather than reteaching them. RU and EN preserve the same argument and animation cues.
- One equation is retained because it explains why a small scalar is recoverable. No key-recovery or certificate-forgery tooling included.
- CT, CRL/OCSP and browser block distribution are distinguished. Native and bundled trust stores are not conflated.
- The read-only test examples match the source endpoints, without insecure flags. No automatic test requests or trust-store changes. Both endpoints are a sample, not exhaustive coverage.
- Runtime exception is intentional: requested technical depth. Estimates 8:07 RU / 8:54 EN at 140 wpm plus 42 seconds of pauses; presenter rehearsal still needed.

## Visual and interaction checks

Automated reports and screenshots are in qa/<origin>/. Check actual report status before claiming completion. 13 scenes, 38 phases, 5 viewports: 1280×720, 1920×1080, 1440×900, 664×853, 390×844. Desktop diagrams use staged connections; mobile replaces wide SVGs with readable structured paths. The full closing bird asset is preserved, not cropped or recolored.

Checks: forward/back navigation, hash refresh, every phase in both directions, frozen clock on pause, speed/reset, focused-link guard, reduced-motion/manual control, media/resource errors, no horizontal overflow, desktop vertical fit, localized English, no script links, separate local scripts/plans, real click-started MP4 with decoded audio. A headless visibility test only asserts a hidden-tab freeze when the browser actually exposes a hidden state.

Initial complete local pass exposed visually faint connections inherited from reference CSS. Scoped overrides increase contrast; node titles wrap within boxes. Connections draw from the single clock and manual stepping yields a complete paused state. The second full local QA pass passed for both editions after that polish. RU and EN overviews and all-phase contact sheets were inspected; detailed crypto, cross-sign, attack and mobile path frames were also inspected.

## Publication gate

Preserve 87 previous files byte-for-byte. Publish only 52 newly allowlisted files (26 per language), plus the existing snapshot: 139 total, 137 static assets and 2 hosting control files. Final counts are checked by the manifest rather than assumed.

Before upload: ready metadata, public allowlist audit, no unexpected references, current production ID unchanged. After deploy: all content hashes, both languages, previous routes, HTTPS, root redirects, 90 private-path 404 checks per origin (custom, Pages fallback and immutable deployment). Save receipts outside public/. No new DNS access required.

The public hash/privacy checks passed on all three origins: 137 static hashes and 90 private-path 404 checks each, with 87 prior files unchanged. The first live browser run passed RU, then exposed a test synchronization race in EN: the emulated reduced-motion change event arrived after manual input. The test now waits for that event before exercising the key; no public viewer code was changed for this. A full live rerun is recorded in qa/tengucluster.com/verification.json once complete.

Final live rerun: PASS for RU and EN, all 13 scenes / 38 phases / five sizes and decoded intro audio. Deployment bc795e24-58cf-48f9-bd86-ceff6915ccd0 is successful. Source updates and the presenter’s own read timing remain future editorial work, not incomplete implementation checks.
