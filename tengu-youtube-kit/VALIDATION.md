# Validation — 22 October 2026

## Bilingual Cloudflare workflow update

- Instruction-only update: retained source, preview, brand assets, fonts and narration references were not edited.
- Complete new-episode delivery now defaults to RU+EN on the existing tengu-presentations Pages project; explicit draft/local-only/one-language requests override it.
- Existing root release and previous episode paths are retained; the publishing guide covers complete-site deployment manifests, concurrent release checks and private rollback records.
- Scripts/plans/skill/archives are explicitly excluded from every upload, including previews. Historical Sites instructions were removed from the active workflow, not from archival source.
- New read-only audit-public.mjs passed the actual 35-file public release and all 16 isolated cases: bilingual entries, private files, unexpected files, hash changes, previous-release preservation, explicit changes, 404, fallback rewrites, symlinks and traversal.
- Publication guide includes current destination IDs and host-independent authentication rules; no credentials are bundled. Skill update does not deploy or change DNS.
- Codex, Claude Code and the portable skill directory are byte-identical. All retained assets/source files, screenshots, preview and artifact-template.json match the pre-update hashes. The three skill copies pass the skill-creator validator; the installer confirms both existing installations match.

The sections below record the original reference/package checks; their historical Sites URLs are not the current publishing destination.

## English release

Published as Site version 34 at https://tengu-agent-context.candygiant32.chatgpt.site/en/?v=34#slide-1
Source commit: db32a3622d3ed310222342c3879c4ae0335e2668

- All 38 locked Russian v33 runtime, asset and narration files remain byte-identical.
- English runtime: 12 scenes; every animation phase tested.
- Forward/backward scene navigation, hash restoration, phase stepping, pause/resume, reset, playback rate, hidden-tab pause, focus guards and reduced motion passed.
- Layouts checked at 1280×720, 1440×900, 664×853 and 390×844. Overview and key phases visually inspected.
- English and Russian script and plan readers load; published Markdown matches canonical files.
- Existing Russian regression suite and complete closing-bird asset suite passed.
- English sting: H.264 video, 1920×1080, 30fps, AAC audio, reported container duration 2.411 seconds. Rendered from the retained original animation with a localized descriptor.
- Live English page verified after successful deployment. Existing site audience preserved.
- English spoken script: 589 words; estimate 297 seconds at 135 words/minute plus 35 seconds of pauses. This is an estimate, not a timed human performance.

## Skill package

- Created with the Codex artifact-template helper as a Site reference template, then extended with the requested cross-host workflow.
- Required metadata, reference source and preview are present.
- Static dist/ explicitly retained: in this buildless project it is source, not disposable build output.
- SKILL.md passed the provided skill-creator frontmatter validator.
- Russian and English starter runs completed using Node built-in modules only.
- Structural checks passed for both starter fixtures with --allow-draft. The long approved Russian reference correctly emits a duration warning; it is a style reference, not the five-minute script for a new topic.
- Starter refuses existing directories. Final validator rejects copied draft/reference content.
- Local resource checker excludes inline JavaScript strings; no false missing-file error for the Markdown reader's template substitutions.
- Original hosting project ID is absent from the retained configuration.
- No symlinks in the package. No node_modules, .git or credentials packaged.
- Same package installed in Codex and Claude Code personal skill folders. Idempotent installer confirmed exact matches.
- Includes branding hashes, local fonts and OFL notices, editable English sting source, source media, screenshots, editorial rules, production checks and portability instructions.

## Limits

No new paid model runs, remote Claude session or autonomous new-topic generation benchmark was performed. Compatibility is based on the common SKILL.md format, official installation documentation, local installation and tested scripts. Future episodes still require factual review, rendered browser QA and a timed narration rehearsal. The skill reduces repeated setup; it does not guarantee a perfect first draft.
