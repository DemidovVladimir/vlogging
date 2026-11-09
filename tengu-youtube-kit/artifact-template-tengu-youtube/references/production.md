# Production and QA

## Retained implementation

This is a buildless HTML/CSS/JavaScript Site, not a PowerPoint. assets/source/dist is source code and required static assets, despite the directory's usual build-output name. Keep it.

Read these when adapting:
- index.html: scene content, IDs and DOM order.
- styles.css then atlas.css: original base and current approved overrides.
- app.js: scene selectors, phase lists, single clock, keyboard controls and intro playback.
- journey.js: chapter labels and restrained transitions.
- script.html: private/local Markdown reader, with ?view=plan; never part of a public upload.
- SCRIPT-*.md and STORY-PLAN-*.md: separate narration and choreography.
- tests/: original regression tests show what to preserve, but their old topic-specific assertions must be adapted, not blindly copied.
- motion/en/: optional intro re-render, not required to author an episode.

No application backend, paid API or API key is required for a local presentation. Use an HTTP server, not file://. The reference uses local fonts and assets.

## Bootstrap safely

Use scripts/new-episode.mjs with a new absolute output directory. It refuses an existing path, copies the selected language into dist/, removes no user files and creates no hosting identity. It does not draft new subject matter: the copied reference remains marked as draft until rewritten.

The selected English entry is normalized from its /en/ reference path to the new project's root, while the shared assets and styles are copied unchanged. Default delivery is bilingual: bootstrap separate RU and EN working directories, adapt the same story for each, then assemble their public projections at the paths in publishing.md. The starter's .openai/hosting.json is historical local scaffolding, not permission to publish dist or create a Sites project.

For a request to update an existing project, work in place and preserve unrelated user changes. Do not bootstrap over it.

Keep source logos, characters and fonts. Reuse layouts and code; rewrite topic-specific content. Update title/description/OG metadata, chapter labels, scene indices, totals, source links, alt text, ARIA strings and scripts in the chosen language. No mixed-language leftovers except intentionally named technical terms.

## Build the argument into the animation

For every new scene:
1. Name its unique teaching job and observable visual change.
2. Decide its phases and narration cue.
3. Connect those states to the common clock.
4. Handle reset/back/forward, pause, rate and reduced motion.
5. Update the story map and scene count.
6. Check the first, middle and final frame for caption/state alignment.

Do not retain stale selector entries for removed scene IDs. If changing the number of scenes, update the rail total and original topic-specific smoke tests. Keep the separate script heading order consistent with actual scene order.

## Content verification

Use a primary-source ledger in SOURCES.md with URLs, checked dates, claims and qualifications. For stable or firsthand material, distinguish facts from the host's explanation or opinion. Never reuse source links merely because they were in the previous episode.

If discussing language models, keep these boundaries accurate:
- Provider is the service/operator; inference is computation using the model.
- Tokenization occurs on text input; it does not repeat as a new tokenizer between each transformer block.
- Attention is part of the trained model, not a preprocessor outside it.
- Input-dependent internal states change; ordinary inference does not rewrite trained weights.
- Agent loop connects model calls and tool actions; decoding generates tokens within a model call.
- Prompt caching can reuse intermediate state for an eligible matching prefix, not substitute a finished answer or remove conflicting instructions.
- A skill has no intrinsic API priority merely because it is called a skill. Placement, roles and platform behavior matter.
- Model/version changes may alter which instructions help; tools providing access/actions do not become unnecessary merely because the model is smarter.

These are safeguards for relevant topics, not a requirement to teach them in every episode.

## Automated checks

Run scripts/check-episode.mjs. During authoring, add --allow-draft to inspect the draft without passing it as a finished episode. Omit that flag for final acceptance. It checks required files, duplicate IDs, scene numbering, script/plan parity, local references, draft status, approximate spoken duration and original brand asset hashes.

It does not judge factual correctness, storytelling, vertical fit or whether a pictured comparison is fair.

Use the host's existing browser/test tooling. Adapt the retained Playwright tests to the new topic and available Chrome path; do not assume the original user's runtime paths exist. Use bundled dependencies when available. Avoid unnecessary dependency downloads.

Verify:
- No JS exceptions or failed local resource requests.
- All scenes reachable forward and backward, hash refresh works.
- Every phase can be selected in both directions, with stable layout.
- Pause holds, speed changes work, reset works, hidden-tab and reduced-motion behavior work.
- Source links resolve to intended pages. Intro video and audio work after a click.
- Script and plan load separately over localhost, and their locally served copies equal canonical files. They must be absent from public deployments.
- No presenter controls or text leak onto the deck.

## Visual verification

Capture and inspect all scenes at 1920×1080 or 1280×720 and at the user's recording size. Also test approximately 1440×900, 664×853 and 390×844 for web sharing.

Inspect every comparison phase, not just the final state. Check overlap, clipping, heading wraps, text contrast, stable heights and full closing silhouette. Inspect the actual image, not only DOM bounds. Watch the transition and intro at least once. Cut words before shrinking essential text.

Use the three supplied reference screenshots as fidelity anchors, not topic templates.

## Acceptance and handoff

For a complete publication, both catalogs and every episode menu must include the new RU/EN pair. Run `scripts/check-navigation.mjs --public <PUBLIC_DIR>`, then test same-episode language switching, preserved slide/hash and recording query, menu focus/Escape, and `H` hiding navigation. Previously final slide content must remain unchanged unless the user requests revisions. Never add narration, plans or skill downloads to public navigation.

The episode is ready only when:
- It answers one clear question, with no duplicate scene jobs.
- A competent non-specialist can follow the cause and consequence.
- Narration has bridges and a plausible measured/estimated five-minute budget.
- Output-changing illustrations are clearly labeled when not measured.
- Brand assets and interaction behavior remain intact.
- Visual and browser QA passed; any limitations are stated.
- episode.json no longer marks copied reference content and the user's requested deliverables exist.

For requested complete episode delivery, follow [publishing.md](publishing.md): both languages in one Cloudflare Pages deployment, existing episodes retained, scripts and the skill excluded. Use Sites only when explicitly requested and still preserve the private/public boundary. Never upload working dist directly. If publishing access is absent, provide the audited public package separately from private working files and state that it is not published.

Keep screenshots and a brief QA report outside dist unless intentionally publishing them. Do not package .git, credentials, environment files, node_modules, caches, customer exports or old production project IDs. Use a new release/snapshot when the user calls a version final; don't silently overwrite it next time.
