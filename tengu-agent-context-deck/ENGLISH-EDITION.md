# TENGU — English edition and approved Russian release

22 October 2026.

## Editions

- Russian final v33 remains at the site root. Its HTML, scripts, narration, plan and existing assets are unchanged.
- English edition is at /en/. It shares the approved styles and character assets, with separate localized HTML, animation captions, narration, director’s plan, logo descriptor and intro MP4.
- English narration is an adaptation: 589 spoken words, excluding headings, preface and stage directions. At roughly 135 words/minute plus about 35 seconds for visual pauses and the intro, it is about five minutes. A timed rehearsal is still required.
- The longer approved Russian script has not been shortened. The five-minute editorial budget is the default for new episodes, not a retroactive rewrite of the approved release.

## Open

- Russian deck: https://tengu-agent-context.candygiant32.chatgpt.site/?v=33#slide-1
- English deck: https://tengu-agent-context.candygiant32.chatgpt.site/en/?v=34#slide-1
- English narration: https://tengu-agent-context.candygiant32.chatgpt.site/en/script.html?v=34
- English director’s plan: https://tengu-agent-context.candygiant32.chatgpt.site/en/script.html?view=plan&v=34

Run a local HTTP server from this folder serving dist, then open /en/. Do not open HTML via file:// because the separate narration uses fetch.

## Files

- SCRIPT-EN.md, STORY-PLAN-EN.md are canonical; byte-identical published copies are in dist/en/.
- dist/en/index.html, app.js and journey.js preserve the Russian scene IDs, cue counts and keyboard behavior.
- dist/en/script.html is the separate presenter page.
- dist/assets/tengu-logo-sting-en.mp4 and tengu-logo-sting-poster-en.png use the editable original Remotion animation and its original audio, with the English descriptor.
- motion/en/ retains the English Remotion source, background and WAV. Install the dependencies declared there when re-rendering; node_modules is intentionally not packaged. Render TenguLogoSting from src/index.ts at 1920×1080 / 30fps / 72 frames. The other inherited compositions are reference masters, not English deliverables.
- dist/assets/tengu-wordmark-horizontal-en.svg changes the descriptor only. The custom TENGU letterforms and symbol stay identical.
- licenses/ contains OFL notices for the bundled display/body fonts.
- releases/ru-v33-lock.json stores SHA-256 hashes of the approved Russian runtime, media and script files.

## Verify

Use Node.js with Playwright and sharp available on the module path:
- node tests/frozen-ru.cjs
- node tests/journey-smoke.cjs (local root)
- node tests/english-smoke.cjs (local /en/)
- node tests/closing-asset-smoke.cjs

The existing QA scripts use a local Chrome path; update it for your machine. TENGU_PREVIEW_URL overrides their local base URL; English expects a base ending in /en. The English suite covers every scene and cue, navigation, pause, reverse, speed, responsive widths, reduced motion, MP4 playback and separate presenter pages.

## Reuse

The portable TENGU skill package is kept beside this project in ../tengu-youtube-kit/. The installed personal copies are for Codex and Claude Code. Use the kit instructions rather than copying this deployment’s project ID to a new topic.

Treat all diagrams, attention links and design-comparison outputs as authored illustrations, not recorded model results. Existing source provenance remains in SOURCES.md. English wording has not turned those examples into a benchmark.
