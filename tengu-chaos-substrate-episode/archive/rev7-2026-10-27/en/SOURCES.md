# TENGU EP.05 — Chaos Substrate: evidence ledger

Checked 2026-10-27. Firsthand measurements on the owner's machine; no paid services, no network calls except Ollama on localhost and the public GitHub clone. Raw outputs are kept privately in the session scratchpad evidence folder (A*, S*, B* files) and are not published.

## Environment

Apple M4 (10 cores, 16 GiB), macOS 26.6.2. Ollama 0.24.0 with embeddinggemma (768 dimensions). PostgreSQL 16.15 + pgvector 0.8.2 in Docker. chaos 1.1.0 (code published on branch v2 as 3c69fa12b485ee72250f9516d3c4bcb097c20f92; the measured binary was built from the same tree before a formatting-only change). chaos-kb 2.0.0.

## Claims and evidence

| Claim on screen / in narration | Evidence | Boundary |
| --- | --- | --- |
| Index of Chaos's own code: 96 files, 1,690 units (chunks), 3,944 links (edges), 33 features (communities), 241.51 s | `chaos index` on a fresh clone of public branch v2 @ 24c82ad8e23c1446e5d840df13c59834bd91d7e2 (S2) | One machine, one run. Times depend on hardware and embedder; counts reproduce for the same commit and binary. The run also reported 1,917 graph nodes and 88 file hashes in the Merkle roll-up. |
| `reindex` without --force is skipped in 0.02 s | S3: "HEAD … equals indexed commit and worktree is clean" | This skip uses Git (commit + clean worktree), not the Merkle tree. Said explicitly on screen. |
| `reindex --force`: 0 of 1,690 embedded again, 20.64 s | S4 | Embeddings are reused by content hash. Chunk building still runs. |
| One-line edit in src/domain/budget.rs inside pack(): `chaos add` re-read 1 file, embedded 5 units, rebuilt 3 of 33 summaries (4 communities changed), 1.73 s | S5a | `add` re-embeds the chunks of the changed file whose text changed; a later revert re-embedded 5 chunks again (old vectors were purged with the old chunks). `add` can lose a few edges compared with a full index (3,944 → 3,942 here); not claimed equal to a full index. |
| Reverting the edit returns the root hash to the original value | S5b: root back to fa137032258dc89293273ed4ff956567725ce169c2cedfb5aeccd5d5e559e3b6 | Not used on screen; supports "equal content, equal hash". |
| Merkle roll-up: chunk SHA-256 → file → community (feature) → repository root | src/domain/merkle.rs and src/domain/hash.rs at 3c69fa12b485ee72250f9516d3c4bcb097c20f92 | The root is computed from all file hashes; feature hashes are a parallel roll-up over member files. Summaries are recomputed only when a feature's hash (plus model) changed (src/application/index.rs rebuild_hierarchy). |
| `feature "how are embeddings reused on reindex"`: 5 routed features covering 39 files, 11 excerpts, 16 edges, 6,000 tokens, 0.20 s; second run page_cached = true, 0.16 s | S6a, S6b (content_hash 098c4f17d67ee8b3a7e19d69af4497483059ad77a91931c7cf5db08d4d36afad) | Five of the eleven excerpts are shown. The routed feature labels are not shown (they are machine labels). |
| Cross-repo answers in 1.1: same question per repo, links only when a retrieved symbol name (identifier-shaped, ≥ 6 chars) occurs as a whole word in another repo's retrieved code; budget split evenly | src/application/project_feature.rs at 3c69fa12b485ee72250f9516d3c4bcb097c20f92 | The four-lane diagram uses invented names (labelled on screen). The measured line (5,803 tokens, 13 excerpts, 7 links at 4 × 1,500 tokens) comes from the owner's private four-repository project; no names or code from it are shown. |
| chaos-kb check: exact words of a stored paragraph → fingerprint lookup among the Merkle leaves, no embedding, 0.04 s | B3a3 (Kitchen.md:10, presence exact); README "Speed" (0.04 s at 1 note and 503 notes) | "Exact" means a whole stored paragraph, normalized for case, spacing and punctuation. One sentence of a two-line paragraph is found by meaning instead (B3a). |
| Paraphrase → similar 0.56 (Car.md:5–6), 0.18 s; unrelated → absent 0.20, 0.15 s; threshold 0.38 | B3b, B3c; v2 README calibration note | Scores are from embeddinggemma; another embedder gives other scores. |
| remember → root fcb9adaf4dce19bc5284aaa8cb0fe79066a3f7ff8f2057a9d419265b7ed260bc; forget → root back to 4caab1c3169871f100d6e6f27a5263978a555413009644be398e192c192b9027; note bytes identical | B4a–B4e | After forget, `check` on that fact still returned "similar" (0.45) because a neighbouring paragraph is close. The page does not claim "unknown" after forget. |
| Ralph Merkle described hash trees in 1979 (US patent 4,309,569, filed 1979, granted 1982) | https://patents.google.com/patent/US4309569A/en | Narration says "described in 1979". |
| Git object ids are hashes of content that include child ids (a Merkle-style structure) | https://git-scm.com/book/en/v2/Git-Internals-Git-Objects | Said as "Git stores its history the same way" — the principle, not the same hash function. |
| Author facts: senior AI/ML engineer, agentic systems and LLMOps, 10+ years in production software, Rust / TypeScript / Python | Owner's chaos-kb vault: Profile.md:3-5, Skills.md:3, Skills.md:7 | By the owner's choice: no name, employer or location. |

## Public links on the closing scene

- https://github.com/DemidovVladimir/chaos-substrate/tree/3c69fa12b485ee72250f9516d3c4bcb097c20f92
- https://github.com/DemidovVladimir/chaos-substrate/blob/3c69fa12b485ee72250f9516d3c4bcb097c20f92/v2/README.md
- https://tengucluster.com/episodes/chaos-kb/ and https://tengucluster.com/en/episodes/chaos-kb/

## Deliberate omissions

No private repository names, paths or code. No claim that cross-repo links find every relation (they need exact names). No speed comparison against other tools. The `doctor` output was not used because it lists private local paths.
