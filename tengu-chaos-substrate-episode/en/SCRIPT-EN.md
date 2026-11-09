# TENGU EP.05 — Chaos Substrate — code memory without a Merkle tree

Spoken script. Bold bridges are spoken; bracketed cues are not. About five and a half minutes including pauses; estimated, not a timed presenter read.

## 00 / Intro

[Start the intro with sound. After 2.4 seconds, move to 01.]

## 01 / Your agent reads the same code again

Ask a coding agent how a feature works: it searches, opens files, follows the calls, and answers. Next session, it does it all again.

[→ second phase on “a memory of the code”.]

Chaos Substrate gives the agent a memory of the code. Index a repository once; after that, the agent asks the index and gets back the exact lines. **But an index is a cache. And the first question about a cache is: what in it is still true after an edit?**

## 02 / Index once: units, links, features

Indexing starts with tree-sitter, a parser that cuts every file into units: a function, a type, a section of a document. Chaos links them across the project and groups closely linked units into features.

[→ last phase: vectors.]

Each unit also becomes a vector — the expensive part: over four minutes for the first build, twenty-two seconds when the vectors are already there.

If you have built RAG, you know the next question. **You changed one function. Which of seventeen hundred vectors are now stale?**

## 03 / Every result is keyed by its own input

Every saved result is stored under a key: the hash of what it was made from. A unit’s vector sits under the hash of its code, path and line numbers. Same hash, and the vector still fits.

[→ on “the same way”.]

The same goes for the rest: a file’s parse under the hash of its bytes, a summary’s vector under the hash of its text and the model.

[→ the edit.]

Edit pack(): the unit’s and the file’s hashes change, so those are redone. The summary text is the same, so its vector is reused.

[→ last phase.]

Version 1.1 also had a Merkle tree: a feature’s hash built from its files’ hashes, like stateRoot in an Ethereum block. That kind of tree serves a light client, which checks an account against a block header without holding the state. Our index holds its data, so it never checked anything that way, and the feature hash changed on every edit, re-embedding summaries whose text was the same. We removed the tree. **The key is the hash of exactly its own input.**

## 04 / Only what changed is redone

After an edit, you run chaos add. It compares each file’s hash on disk with what the index saw — not file times, and not just git diff.

One comment line cost one file of ninety-six, five new vectors and no summaries, in just over a second. Version 1.1 on the same code re-embedded four summaries and lost two links — a bug we found while removing the tree. **The index is current. Let’s ask it something.**

## 05 / Answers come from the index

How are embeddings reused on reindex? The question becomes a vector and is compared with the feature summaries; the closest features become the search area. Inside, it searches by meaning, keywords and exact names, plus one step along the calls.

Sixteen excerpts with exact line ranges, in under a fifth of a second. **But real features rarely live in one repository.**

## 06 / One question. Four repositories.

A contract, the indexer of its events, the web app and the docs: four repositories, one feature. Chaos asks each, and each answers from its own index.

A link appears only when a function name from one repository is found word for word in another’s code. It is one page, and the budget is split, so the answer stays the size of one. **The same idea runs a personal knowledge base. Here is a real query.**

## 07 / Vectors search. Fingerprints recognise.

chaos-kb is the knowledge base from episode four. A query to mine: what does the author know about blockchains and embeddings? The word “blockchain” is nowhere in my notes; vectors found these passages by meaning, in a tenth of a second.

[→ second phase.]

That is how this episode was prepared: the agent asked my knowledge base what to build on and got Web3 and RAG.

[→ third phase.]

Exact words are recognised by fingerprint — the hash of a paragraph’s words — with no model.

[→ last phase: the sync line.]

And the keys are the same: a passage gets a vector only when its hash is new. No root over the whole base here either. **Vectors search; the input’s hash tells you what still holds.**

## 08 / Read less. Trust what you can check.

So: index once, run add after every edit, ask with feature — across repositories when a feature spans them.

Key every result by its own input, and only what really changed is redone. A tree is for checking without the data. And a hash proves content is the same, not that an answer is right.

I build agentic systems, mostly in Rust, TypeScript and Python. This is the memory I built for them.
