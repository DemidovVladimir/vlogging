# Snapshot verification

Verified on 5 November 2026. Time zone: Europe/Berlin.

## Results

| Check | Result |
| --- | --- |
| Source snapshot | 13 files copied; every copy matches the working project's source bytes |
| Backend and asset regression tests | 33 passed |
| Frontend JavaScript syntax | Passed |
| Mac launcher shell syntax | Passed |
| Source hashes | Recorded in `SOURCE_MANIFEST.json` |

The tests were run in this snapshot's `app/` directory using the original project's existing virtual environment. No virtual environment was copied into the handoff.

```bash
cd /Users/vladimirdemidov/development/vlogging/margin-cloudflare-handoff/app
PYTHONDONTWRITEBYTECODE=1 /Users/vladimirdemidov/development/vlogging/youtube-reader/.venv/bin/python -m pytest -q -p no:cacheprovider
node --check static/app.js
bash -n "Start Margin.command"
```

Pytest output:

```text
33 passed, 1 warning in 0.44s
```

The warning is a Starlette TestClient deprecation notice about the current `httpx` integration. It did not fail the tests.

## What the tests establish

The suite checks supported URL forms, invalid URL rejection before provider access, extraction caching, library persistence, exports, subtitle and text imports, provider error handling, local host/origin restrictions, and asset loading. Asset tests cover `/`, `/index.html`, `/static/index.html`, and sibling file-path resolution.

The extraction tests substitute a provider or raise representative upstream library exceptions. They do not contact YouTube. They do not establish that a hosted extractor will work.

## Previous live checks and their limits

On 4 November 2026, a live local extraction from `https://www.youtube.com/watch?v=jNQXAC9IVRw` returned English captions. Local browser checks covered reading, timeline search, copying, reopening a saved transcript, and invalid-link feedback.

After the asset-path fix, the running local HTTP application returned the exact stylesheet with status 200 and `Content-Type: text/css; charset=utf-8`. Browser reload and navigation retained the styles. The supplied screenshot records that local session. The browser tool could not open `file://` URLs, so direct file rendering was not visually tested.

No live YouTube extraction, cloud migration, deployment, DNS change, authentication setup, or provider registration was performed while preparing this handoff. No application server is started by creating this folder.

## Reproduce with fresh dependencies

Use the working project for implementation:

```bash
cd /Users/vladimirdemidov/development/vlogging/youtube-reader
uv sync --frozen --group dev
uv run pytest -q
node --check static/app.js
```

The snapshot retains the same `pyproject.toml`, `uv.lock`, and `requirements.txt`. Claude must add hosted-runtime checks after selecting and implementing the deployment architecture.
