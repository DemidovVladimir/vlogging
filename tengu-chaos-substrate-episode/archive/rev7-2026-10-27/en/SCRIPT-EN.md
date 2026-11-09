# TENGU EP.05 — Chaos Substrate — code memory and the Merkle tree

Spoken script. Bold bridges are spoken; bracketed cues are not. About five and a half minutes including pauses; estimated, not a timed presenter read.

## 00 / Intro

[Start the intro with sound. After 2.4 seconds, move to 01.]

## 01 / Your agent reads the same code again

Ask a coding agent how a feature works, and it searches, opens files, follows the calls, and answers. Next session, it does all of that again.

[→ second phase on “a memory of the code”.]

Chaos Substrate gives the agent a memory of the code. You index a repository once; after that, the agent asks the index and gets back the exact lines that matter. **But a memory only helps if you can tell when it is out of date.**

## 02 / Index once: units, links, features

Indexing starts with tree-sitter, a parser that cuts every file into units a person would name: a function, a type, a section of a document. Chaos then links the units — who calls whom, who imports what — across the whole project.

Closely linked units form groups — the features, found from the links, not from folder names. Each unit also becomes a vector: a list of numbers that captures its meaning.

On Chaos’s own code that took four minutes. **You pay that once. The trick is never paying it again.**

## 03 / A fingerprint made of fingerprints

Every unit gets a fingerprint: a hash computed from its text. Same text, same hash. Change one character, and the hash is completely different.

[→ on “combined upward”.]

The hashes are then combined upward. A file’s hash is made from its units, a feature’s from its files, and the root from every file. This is a Merkle tree, named after Ralph Merkle, who described it in 1979. Git stores its history the same way.

Edit one function, and only the hashes on its path change. Everything else stays the same. **So equal hashes mean nothing changed — without reading a single line.**

## 04 / Only what changed is redone

After an edit, you run chaos add. It compares each file’s hash with the stored one and rereads only the files that differ. In our test, one changed line meant one file, five units embedded again out of almost seventeen hundred, and three feature summaries rebuilt. Under two seconds.

A full rebuild uses the same idea: a unit whose hash already has a vector keeps it. Saved answers too — same hashes, same page. **The index is current. Let’s ask it something.**

## 05 / Answers come from the index

How are embeddings reused on reindex? The question becomes a vector and is compared with every feature’s summary; the closest features become the search area.

Inside them, three searches run together: by meaning, by keywords and by exact names. One step along the calls adds the neighbours, and everything is packed under a token budget.

Eleven excerpts, with files and exact line ranges, in a fifth of a second. The agent reads those, not the repository. **But real features rarely live in one repository.**

## 06 / One question. Four repositories.

A smart contract, the service that indexes its events, the web app and the docs: four repositories, one feature. Chaos 1.1 asks the same question in each, and each answers from its own index.

Then it joins them with evidence, not guesses. When a function found in one repository is named, word for word, in code found in another, that is a link. Plain words and short names don’t count.

One page shows all four with their links, and the token budget is split, so the answer stays the size of one. **The same hashes answer one more question.**

## 07 / Exact words: a lookup, not a model

chaos-kb, the personal knowledge base from episode four, keeps notes as plain Markdown, and every paragraph is a leaf of the same kind of tree.

Ask whether a paragraph’s exact words are already known, and it only computes a hash and looks it up. No model: four hundredths of a second. With other words, it compares meaning instead, against a threshold. Below it, the fact is new, and worth remembering.

[→ last phase: the root line.]

Add a fact, and the root changes. Forget it, and the root returns to exactly the old value. **One comparison tells an agent whether anything changed at all.**

## 08 / Read less. Trust what you can check.

The routine is short: index once. Run add after every edit. Ask with feature, across repositories when the feature spans them.

Know the limits. A hash proves content is the same, not that an answer is right. Routing by meaning can miss, and cross-repository links need exact names.

I build agentic systems, mostly in Rust, TypeScript and Python. This is the memory I built for them.
