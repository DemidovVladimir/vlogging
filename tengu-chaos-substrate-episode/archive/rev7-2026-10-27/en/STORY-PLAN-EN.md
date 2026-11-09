# TENGU EP.05 — Director’s plan

Story: the agent rereads code every time → index once → hashes combined into a tree → after an edit only the difference → answers from the index → one question across repositories → “already known?” in chaos-kb → routine and limits. Every number was measured on 27.10.2026; the four-lane diagram is an illustration with invented names.

## 00 / Intro — 00:00–00:03

Click to start the MP4 with sound; let it finish.

## 01 / Your agent reads the same code again — 00:03–00:38

Phases (R, then → as you explain):

- search → open files → answer → forgotten
- ask → exact lines → still current?

## 02 / Index once: units, links, features — 00:38–01:21

Phases (R, then → as you explain):

- Files are read once: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.
- Tree-sitter cuts each file into units a person would name.
- Calls and imports are linked across the whole project, not just within a file.
- Closely linked units form features — found from the links, not the folders.
- Each unit becomes a vector: numbers that capture its meaning.

## 03 / A fingerprint made of fingerprints — 01:21–02:08

Phases (R, then → as you explain):

- Each unit gets a hash of its text. Same text, same hash.
- A file’s hash comes from its units; a feature’s from its files; the root from every file.
- Change one function: only the hashes on its path change — file, feature, root.
- Equal hashes, equal content. A stored result can be reused without reading it again.

## 04 / Only what changed is redone — 02:08–02:47

Phases (R, then → as you explain):

- One line changed inside one function.
- chaos add compares each file’s hash with the stored one: one file is read again.
- New vectors only for units whose text changed: 5 of 1,690.
- A new summary only for features whose hash moved: 3 of 33. Done in 1.73 s.

## 05 / Answers come from the index — 02:47–03:27

Phases (R, then → as you explain):

- The question becomes a vector once and is compared with the feature summaries.
- Inside the closest features: meaning, keywords and exact names, fused into one ranking.
- One step along calls and implementations adds the neighbours.
- 11 excerpts with exact lines, 6,000 tokens, 0.20 s. Ask again and the page comes from the cache.

## 06 / One question. Four repositories. — 03:27–04:14

Phases (R, then → as you explain):

- The same question goes to each repository — each answers from its own index.
- A function name from one repository, found word for word in another’s code, is a link.
- Plain words and names shorter than six characters never link.
- One page, four lanes. The budget is split, so the answer is the size of one.

## 07 / Exact words: a lookup, not a model — 04:14–05:01

Phases (R, then → as you explain):

- A paragraph’s exact words: a hash and a lookup among the leaves. No model needed.
- Other words: the meaning of the nearest paragraphs is compared against 0.38.
- Below the threshold, the knowledge is missing. That fact is worth remembering.
- Add a fact and the root changes. Forget it and the root is exactly what it was.

## 08 / Read less. Trust what you can check. — 05:01–05:33

Phases (R, then → as you explain):

- Index once. Run add after every edit.
- Ask with feature; use --all-repos when a feature spans repositories.
- A hash proves “the same”, not “correct”.

## Controls & recording

- P: pause/resume; R: reset paused; ← / →: phase back/forward, paused.
- − / +: 0.25×–2×; 0: normal speed.
- Down / PageDown / Space: next; Up / PageUp / Shift+Space: previous. Home / End: intro / closing.
- Wheel / touch: natural scroll. Hidden tabs freeze diagrams. Reduced motion: final phase, manual stepping still works.
- Diagrams hold their final phase rather than looping. Controls do not scrub the MP4.
- Record the deck only. Keep script.html and ?view=plan in a separate LOCAL window/device.
- Slow down on the Merkle tree (03) and the root line in 07: that is the main idea. Do not read the hashes in 07 aloud.
