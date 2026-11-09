# Margin: handoff to Claude

Prepared on 5 November 2026. Time zone: Europe/Berlin.

The user wants a private YouTube transcript application that works at a stable URL under their Cloudflare-managed `tengucluster.com` domain. The current implementation is a local Python application. It has not been migrated or deployed to Cloudflare.

## Start here

1. Read [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md) for the task to continue.
2. Read [HANDOFF.md](HANDOFF.md) for requirements, verified findings, and unresolved decisions.
3. Read [API.md](API.md) before changing the backend.
4. Read [VERIFICATION.md](VERIFICATION.md) for the source snapshot's checks and their limits.

Claude should use the Cloudflare context and credentials it already holds. This folder contains no credentials and creates no Cloudflare resources.

## Files

| Location | Contents |
| --- | --- |
| `app/` | Complete source snapshot: FastAPI backend, frontend, dependency locks, launcher, and tests |
| `reference/preview-assets-fixed.png` | Screenshot from the last verified local browser session; not evidence of a hosted deployment |
| `SOURCE_MANIFEST.json` | SHA-256 hashes for the source snapshot and screenshot |
| `HANDOFF.md` | Requirements, deployment findings, migration considerations, and completion criteria |
| `API.md` | Current API and transcript data contract |
| `VERIFICATION.md` | Checks run against this snapshot |
| `CLAUDE_PROMPT.md` | Prompt the user can give Claude |

## Working directory

The current project is:

```text
/Users/vladimirdemidov/development/vlogging/youtube-reader
```

Use that project for implementation. Treat `app/` in this handoff as the baseline snapshot. Do not maintain two changing copies of the application.

Existing TENGU deployment records are in:

```text
/Users/vladimirdemidov/development/vlogging/tengu-cloudflare-pages
/Users/vladimirdemidov/development/vlogging/tengu-modal-city-release
```

Recheck live Cloudflare state before changing it. The user's existing Claude context may contain more current deployment details.
