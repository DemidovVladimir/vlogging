# TENGU EP.05 — Director’s plan

Story: the agent rereads code every time → an index is a cache, and its vectors are the expensive part → every saved result is keyed by the hash of exactly its own input; the Merkle tree is gone because nobody here checks without the data (stateRoot and a light client) → after an edit only the difference is redone, 1.1 measured against 1.2 → answers from the index → one question across repositories → a real search of the author’s knowledge base: vectors search, fingerprints recognise, same keys → routine and limits. The explanation builds on what the author’s knowledge base says about them: Web3 (Solana, EVM) and RAG. Every number was measured on 27.10.2026; the lanes in 06 are an illustration.

## 00 / Intro — 00:00–00:03

Click to start the MP4 with sound; let it finish.

## 01 / Your agent reads the same code again — 00:03–00:39

Phases (R, then → as you explain):

- search → open files → answer → forgotten
- ask → exact lines → still current?

## 02 / Index once: units, links, features — 00:39–01:18

Phases (R, then → as you explain):

- Files are read once: Rust, TypeScript, JavaScript, Python, Solidity, GraphQL, Markdown.
- Tree-sitter cuts each file into units a person would name.
- Calls and imports are linked across the whole project, not just within a file.
- Closely linked units form features — found from the links, not the folders.
- Vectors are the expensive part: with the vectors already there, the same build takes 22.24 s instead of 264.08.

## 03 / Every result is keyed by its own input — 01:18–02:37

Phases (R, then → as you explain):

- A vector is stored under the hash of its unit: its code plus a header with path and lines. Same hash: the vector still fits.
- Everything else works the same way: a file’s parse under the hash of its bytes, a summary’s vector under the hash of its text and model.
- Edit pack(): the unit’s and the file’s hashes change, so those are redone. The summary text is the same: its vector is reused.
- In 1.1 a summary was keyed by a tree hash over all its feature’s files, so any edit to them redid the summary.

## 04 / Only what changed is redone — 02:37–03:14

Phases (R, then → as you explain):

- One comment line inside pack().
- chaos add compares each file’s hash with what the index saw: 1 file of 96 is parsed again.
- A new vector for only 5 units: pack() and those whose line numbers moved. 1,702 vectors are reused.
- No summary text changed, so no summary was embedded again. All in 1.34 s.

## 05 / Answers come from the index — 03:14–03:44

Phases (R, then → as you explain):

- The question becomes a vector once and is compared with the feature summaries.
- Inside the closest features: meaning, keywords and exact names, fused into one ranking.
- One step along calls and implementations adds the neighbours.
- 16 excerpts with exact lines, 5,980 of 6,000 tokens, 0.14 s. Ask again and the page comes from the cache.

## 06 / One question. Four repositories. — 03:44–04:21

Phases (R, then → as you explain):

- The same question goes to each repository — each answers from its own index.
- A function name from one repository, found word for word in another’s code, is a link.
- Plain words and names shorter than six characters never link.
- One page, four lanes. The budget is split, so the answer is the size of one.

## 07 / Vectors search. Fingerprints recognise. — 04:21–05:15

Phases (R, then → as you explain):

- The notes never say “blockchain”. Vectors found these passages by meaning, in 0.11 s.
- This episode was prepared the same way: the base answered “Web3 and RAG”, hence stateRoot and vectors above.
- A stored paragraph’s exact words are recognised by fingerprint — the hash of its words — with no model: 0.04 s.
- Same keys as in 03: a passage’s vector sits under the hash of its text. There is no root over the whole base any more.

## 08 / Read less. Trust what you can check. — 05:15–05:50

Phases (R, then → as you explain):

- Index once. Run add after every edit. Ask with feature.
- Key each result by its own input. A tree is for checking without the data.
- A hash proves “the same”, not “correct”.

## Controls & recording

- P: pause/resume; R: reset paused; ← / →: phase back/forward, paused.
- − / +: 0.25×–2×; 0: normal speed.
- Down / PageDown / Space: next; Up / PageUp / Shift+Space: previous. Home / End: intro / closing.
- Wheel / touch: natural scroll. Hidden tabs freeze diagrams. Reduced motion: final phase, manual stepping still works.
- Diagrams hold their final phase rather than looping. Controls do not scrub the MP4.
- Record the deck only. Keep script.html and ?view=plan in a separate LOCAL window/device.
- Slow down on 03 (the “key” and “after editing” columns, then 1.1 against 1.2): that is the main idea. Do not read the key formulas aloud.
