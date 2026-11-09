# Visual identity and meaningful motion

## Fixed brand assets

Source assets are in ../assets/source/dist/assets relative to this references directory. Keep file names, intrinsic proportions and original colors unless the user asks for a change.

- tengu-mark-simplified.svg — small rail/icon mark.
- tengu-mark-primary.svg — large emblem.
- tengu-wordmark-horizontal.svg — Russian lockup.
- tengu-wordmark-horizontal-en.svg — English lockup.
- tengu-kaiju-v23.png — approved framed cover portrait.
- tengu-kaiju-complete-v33.png — complete, transparent closing silhouette. Use this, not the cropped cover portrait, for an unframed bird.
- tengu-robot-v23.png — approved companion robot.
- field-light.jpg / field-dark.jpg — atmospheric paper/ink landscapes.
- tengu-logo-sting.mp4 / poster.png — Russian intro.
- tengu-logo-sting-en.mp4 / poster-en.png — English intro, same audio/motion.
- fonts/ — local Manrope, IBM Plex Mono and Literata; OFL notices in source/licenses/.
- motion/en/ — retained editable English sting source and original WAV.

Other sprites in the source are historical references. Do not use the superseded chibi/carpenter/samurai/screen-travel assets in a new episode. The ceramics photo belongs to the first episode's example, not every future topic.

## Palette and type

Sumi #11110F; washi #E9DFC9; vermilion #C92F20; muted indigo #1D3342; aged gold #A9853E.

Manrope: clear display headings and body labels. IBM Plex Mono: numbered rail, metadata, concise technical labels. Literata: selected editorial quotes or the separate script. TENGU is a custom vector wordmark, not an ordinary typeface. Never substitute a vaguely cyberpunk font for the logo.

Warm paper and dark ink frame the information. Vermilion signals one important change or contrast. Indigo/gold are secondary, not a reason to recolor the logo. Avoid neon glows, gradients everywhere, fake holograms, bevels and all-caps paragraphs.

Japanese motifs can be atmospheric. Any meaningful Japanese text needs a nearby translation in the audience's language. Do not insert unexplained Japanese section labels.

## Layout

Reuse source styles.css and atlas.css, then adapt content within the established grid. Match reference screenshots before creating new layout variants.

Aim for a clear headline, one visual relationship and a brief takeaway. Viewer-facing scenes contain no script toggle, next button, table-of-contents panel or presenter notes. The intro has a deliberate start button to enable audio.

At 16:9, all important content fits within the viewport below the rail. Leave breathing room around the character, logo, caption and source caveat. Keep the closing bird's entire silhouette inside its container. Never mask a clipped asset with overflow:hidden.

Use smaller text only for secondary caveats, not the explanation. If a heading wraps badly, shorten it before reducing type. At narrow widths, allow readable vertical flow; do not crush a desktop diagram into tiny boxes.

## Characters

Mature biomechanical kaiju and robot: restrained and imposing, not cute or silly. They can frame an opening, annotate a meaningful moment and return in the close. Do not force them into every diagram or assign them false literal roles inside the model. Keep identity, silhouette and color consistent.

Do not regenerate the brand assets merely because image generation is available. Use the existing transparent asset or code-native transform. For genuinely new raster scene artwork, use the host's image workflow with the approved character as reference, then inspect the result. Preserve vector geometry for logos.

## Motion grammar

A phase changes something the viewer can name: a source enters the context, a relationship becomes visible, an output changes, a permission boundary blocks an action. It should still make sense paused.

Write the phase list before code. Each phase has one narration cue. Transition labels and outputs together; do not let a new caption describe the previous frame.

Keep source behavior:
- One scene clock, not independent CSS loops that ignore pause.
- P pauses/resumes; left/right steps a phase and pauses.
- R resets the current animation to the first phase, paused.
- Minus/plus changes rate from 0.25× to 2×; 0 restores normal rate.
- Down/PageDown/Space and Up/PageUp/ShiftSpace navigate scenes.
- Home/End go to intro/close.
- Wheel/touch retain natural scrolling.
- Hidden tabs freeze the animation clock; reduced motion permits manual phases without autoplay.
- Keyboard handlers respect focused inputs/links/buttons and modifiers.
- Navigation follows DOM order, not assumptions about old hash numbers.

The approved transition is a restrained ~200ms fade. Do not revive characters pushing screens, theatrical wipes or repeated spinning particles. Keep chart/diagram updates deterministic. Maintain constant scene height across phases.

The MP4 is separate: click to enable sound; 1920×1080, 30fps, 72 frames, about 2.4 seconds. Keyboard diagram controls do not promise to scrub its audio.
