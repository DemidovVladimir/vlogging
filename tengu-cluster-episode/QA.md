# EP.02 — private QA record

22 October 2026. RU and EN: 9 scenes, 25 diagram phases each. Estimated runtime: 301 seconds each (RU 645 words at 140 wpm; EN 622 at 135 wpm; 25 seconds for sting/visual pauses). Presenter has not been timed.

## Local acceptance

- New topic replaces all reference narration, examples, IDs and chapter maps.
- Original brand assets retained byte-for-byte; approved closing silhouette fully visible; no logo recoloring.
- One narrative example, explicitly illustrative, not a live harness run or benchmark.
- Local architecture claims checked against current tracked source. Public main snapshot fdfdc2eb1961964b33f154a829550ded52acb279 has identical README, architecture walkthrough, Studio docs, executor, replan and scope files to local 9805470d751bc7fb18b4fa96153c1b095cdb73e6. Public links use the accessible main snapshot.
- Automated browser checks: all scenes and phases forward/reverse; pause, reset, speed, focus guards, reduced motion, hash reload; local narration and plan readers.
- Viewports: 1280×720, 1920×1080, 1440×900, 664×853, 390×844. No horizontal overflow; desktop scenes fit the viewport. All images and fonts load; no JS/resource errors.
- Both intros play after click, 1920×1080, 2.411 seconds, unmuted with decoded audio.
- Inspected full-deck montages in both languages, all RU phase frames, enlarged plan, mobile matrix, tablet permission boundary and closing composition. No overlapping labels or clipped closing bird. Enlarged the plan diagram after the first pass.
- Clock uses visibilitychange to stop when hidden; background-tab assertion runs when the headless browser reports the tab hidden. No claim of cross-browser exhaustive testing.

## Editorial limits

Configured reviewer is not automatic truth verification. Retries handle technical failures and can exhaust their budget. Reuse requires unchanged successful steps and dependencies. Permissions depend on all enabled routes, not one removed tool. Long-term memory is opt-in and can become stale. No claim of perfect security, universal speedup, guaranteed correctness or backend parity.

## Live acceptance

Deployment 998ba104-4bdf-4524-80ce-f05f7a858176 succeeded. HTTPS is verified normally; no DNS override or certificate bypass. All 85 served static files match the reviewed hashes on tengucluster.com, tengu-presentations.pages.dev and the immutable 998ba104 deployment URL. Sixty private paths per origin return 404, not an SPA shell or redirect. All 35 previous public files remain byte-identical.

Both languages passed the same scene/phase/keyboard/five-viewport/intro browser tests on tengucluster.com. A first navigation timed out while assets and the full hash audit were loading; the repeat completed with a 60-second navigation budget, no resource failures or JS errors. All three public repository reading links resolve to the pinned main snapshot. Browser and content/privacy reports are under qa/; never upload them or this file.
