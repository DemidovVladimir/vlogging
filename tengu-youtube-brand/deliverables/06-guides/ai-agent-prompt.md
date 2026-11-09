# Ready-to-paste prompt for a motion AI agent

Recommended target: **Codex working in this Remotion project**. Claude Code or Cursor can follow the same brief. A generative video model should only make optional background texture plates; it must not redraw or animate the identity itself.

Copy everything below into the coding agent:

---

You are working on the TENGU YouTube identity in:

`/Users/vladimirdemidov/development/vlogging/tengu-youtube-brand`

Read `README.md`, `brand-guide.md`, and `handoff/motion-brief.md` before editing anything. The approved art direction is the Field Manual system: warm washi, sumi, vermilion, indigo, aged gold, technical registration marks, human-centered agent orbits, and restrained Japanese materiality.

Use the supplied vector assets. Do not redraw, reinterpret, or add parts to the logo. The exact primary mark is `source/svg/tengu-mark-primary.svg`; the small-size mark is `source/svg/tengu-mark-simplified.svg`.

The motion project is `motion/remotion`. Preserve these compositions:

- `TenguLogoSting`: 1920×1080, 30 fps, 72 frames, finished light-background bumper with audio.
- `TenguLogoStingTransparent`: the same timing, with real alpha, rendered as ProRes 4444.
- `TenguChapterBumperLight`: 1920×1080, 30 fps, 90 frames.
- `TenguChapterBumperDark`: 1920×1080, 30 fps, 90 frames.

Motion story:

1. Frames 0–8: the vermilion human core appears with a short stamp-like spring.
2. Frames 8–26: six specialist nodes leave the core and settle into fixed positions.
3. Frames 14–40: evidence rings and routes draw on with stroke dash animation.
4. Frames 28–49: black and vermilion brush arcs sweep into place.
5. Frames 43–62: wordmark, rule, descriptor, and metadata enter and settle.
6. Frames 62–72: clean hold; no constant spin.

Keep all text editable through props. Add a new composition only when it solves a real production need. Use `interpolate()`, `spring()`, SVG stroke animation, and `staticFile()`; do not use text-to-video or raster frame regeneration for logo motion.

Quality gates:

- Node count and geometry are identical in every frame.
- No clipping at 1920×1080.
- Cyrillic is rendered with the bundled fonts.
- MP4 is H.264, 30 fps, stereo audio.
- Alpha master is ProRes 4444 and reports an alpha-capable pixel format.
- Final hold is readable on a phone-sized preview.
- Verify at frames 12, 36, and 62 before delivery.

Run:

```bash
cd /Users/vladimirdemidov/development/vlogging/tengu-youtube-brand/motion/remotion
npm install
npm run studio
npm run render:sting
npm run render:alpha
npm run render:chapter-light
npm run render:chapter-dark
```

Return the exact output paths and a concise list of visual or timing changes. Do not overwrite the SVG masters.

---

## Why this is the right agent split

A coding agent is responsible for identity-critical motion, timing, export, and repeatable parameters. An image/video generator is responsible only for replaceable atmospheric material: paper grain, sumi mountains, brush haze, sun, dust, and light.

