# Requirements and deployment context

## User objective

The user wants to paste a YouTube link and read the video as text instead of watching it. The transcript library must be private. They initially chose a local application, then repeatedly reported that the website did not work. They are now considering hosting it under their own `tengucluster.com` domain and want Claude to continue with its existing Cloudflare context.

## Current implementation

- Python FastAPI backend with `youtube-transcript-api` and `requests`.
- Plain HTML, CSS, and JavaScript frontend. No frontend build step or external fonts.
- Local SQLite database at `data/library.sqlite3` by default.
- Local launcher: `Start Margin.command`, which runs `launch.py` and binds Uvicorn to `127.0.0.1:8765`.
- Saved library, paragraph and timeline views, transcript search, timestamp links, copying, TXT/Markdown/SRT exports, and VTT/SRT/TXT imports.
- Captions only. Audio transcription and AI summarization are not implemented.
- The app prefers manual captions when available. It does not translate captions or identify the original audio language.
- The app is not a Cloudflare Worker, Pages Functions app, or container deployment. No Cloudflare configuration exists in the working project.

The implementation is a starting point for migration. It is not an always-running website. The tests and previous screenshots must not be presented as proof that the user's deployment works.

## Problems already encountered

1. The original design did not follow the user's saved preferences. The latest source uses a dark interface with cyan and amber accents and direct wording.
2. The HTML initially referenced `/static/...` assets. Those paths fail when the HTML is opened as a local file. They were changed to sibling-relative paths. FastAPI now serves matching root routes as well as `/static/...` routes. Regression tests cover this.
3. A file preview has no backend. It now displays a notice explaining that the local server must be started. It disables extraction and imports in `file:` mode.
4. The local preview servers used during development were stopped after verification. There was no listener on port 8765 when the user next reported failure. No background service or startup service was installed.
5. A live extraction succeeded during development, but YouTube may block other videos or connections. The local test does not establish that extraction works from Cloudflare.

Desktop tools could not inspect the user's Brave window. The in-app browser blocks `file://` URLs. File asset resolution was checked programmatically; browser verification used the running HTTP application. The user's exact original browser address was not obtained.

## Verified Cloudflare findings

These are observations from 5 November 2026, not assumptions for future deployment. Recheck them with Claude's own Cloudflare context.

| Item | Observation |
| --- | --- |
| Domain | `tengucluster.com` is an active zone in the connected account |
| Main site | HTTPS GET to `https://tengucluster.com/` returned 200 and the TENGU episode catalog |
| Pages project | `tengu-presentations`, production branch `main` |
| Project domains | `tengucluster.com`, `tengu-presentations.pages.dev` |
| Production deployment reported by API | `c7211e8e-8b39-4cfd-a9fa-bda5e9c6e1c4`, created `2026-10-28T14:25:03.085107Z` |
| Production deployment URL | `https://c7211e8e.tengu-presentations.pages.dev` |
| Access query | The connected API returned `access.api.error.not_enabled` |
| Worker routes query | This connector lacked `workers-routes.read` / `workers-routes.write`; the response was 403. This does not establish the permissions of Claude's credentials |

No Cloudflare resource was created or changed for Margin. No transcript provider account, subscription, API key, or hosted database was configured.

The system Python 3.13 urllib request had a local certificate trust error. The application's virtual-environment `requests` client successfully validated the same site's HTTPS connection. Do not disable TLS verification to work around that local tooling difference.

## Existing infrastructure evidence

Read these local files and validate their contents against current live state:

```text
/Users/vladimirdemidov/development/vlogging/tengu-cloudflare-pages/deployment-record.json
/Users/vladimirdemidov/development/vlogging/tengu-cloudflare-pages/README-RU.md
/Users/vladimirdemidov/development/vlogging/tengu-modal-city-release/deployment-record.json
/Users/vladimirdemidov/development/vlogging/tengu-modal-city-release/README.md
```

The Modal City release records describe a separate Worker, `tengu-modal-city`, at `tengucluster.com/modal-city*`, with D1-backed accounts and progress. They identify the source directory as `/Users/vladimirdemidov/development/neovim_pro/site` and mention a `cf` profile named `tengu`. These are historical records, not a new verification of that Worker or profile. Preserve that application and the public episode catalog.

## Proposed architecture, not an approved configuration

The recommendation was a separate private application at `reader.tengucluster.com`, with Workers for the application, D1 for transcripts, and private sign-in through Access. No hostname or architecture was finalized. Use Claude's existing context to select the appropriate integration.

The current FastAPI source cannot simply be uploaded as static Pages assets. A hosted backend and durable storage must be implemented. Python Workers support FastAPI, but local SQLite, synchronous HTTP calls, threads, and filesystem assumptions must be reviewed for that runtime. A JavaScript/TypeScript Worker is another implementation option.

The frontend currently calls root-relative `/api/...` endpoints. A subdomain fits that contract. A path deployment requires an explicit API base path and correct asset routing, including the trailing-slash behavior.

Review local-only host/origin checks during migration. Retain same-origin protection while allowing the actual hosted origin. Implement authenticated ownership for stored data. The local SQLite library has no user ownership model because it was designed for a single computer.

## Extraction provider decision

The existing unofficial extractor warns that YouTube frequently blocks cloud-provider IPs. Test extraction from the actual deployed environment before treating it as usable.

Supadata was suggested as one possible hosted provider. Its pricing page, checked on 5 November 2026, listed 100 free credits per month and one credit per existing transcript. Its native mode fetches existing captions; its auto mode can fall back to AI transcription, which has different credit usage. These were research findings, not authorization to register, subscribe, transmit user video URLs, or enable automatic charges. No API key is included in this folder. Use an existing approved provider if Claude's context already identifies one. Recheck current pricing and terms before selection.

The YouTube official caption download endpoint requires permission to edit the video. It is not a general replacement for extracting captions from other creators' public videos.

## Design requirements

Consult chaos-kb. Relevant saved preferences are:

- `Preferences.md`, Visual style: neon, futuristic cyberpunk inspired by Blade Runner.
- `Preferences.md`, Writing style: precise, simple language; short sentences; no metaphors; definitions on technical terms through hover popups.
- `Projects/Margin.md`, Visual style: dark workspace for Margin.

The snapshot already applies these preferences. It uses dark surfaces, cyan controls, amber accents, readable sans-serif body text, and inline term definitions. `reference/preview-assets-fixed.png` shows the latest local layout. Preserve readability and verify the actual CSS response in the deployed browser.

## Completion criteria

The hosted result is complete when:

1. The application has a stable HTTPS URL under the user's domain and does not require their Mac to remain running.
2. The user can sign in. Anonymous requests cannot read, export, import, delete, or extract private library data. Alternate deployment and preview hostnames do not bypass authentication.
3. A real public YouTube URL produces real text and timestamps from the deployed environment. Missing captions, upstream blocks, exhausted quota, and unavailable credentials produce clear errors.
4. A saved transcript remains available after closing and reopening the browser.
5. Transcript search, timestamp links, copying, TXT/Markdown/SRT exports, and file imports work.
6. CSS and JavaScript return the correct content types. Reloads and navigation retain styling. API failures do not return an HTML fallback as successful JSON.
7. The existing TENGU site and unrelated applications still work.
8. The user receives the URL, verification evidence, operational limitations, cost controls if relevant, and a rollback procedure.

## Sources to recheck

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/languages/python/packages/fastapi/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/d1/
- https://github.com/jdepoix/youtube-transcript-api#working-around-ip-bans-requestblocked-or-ipblocked-exception
- https://developers.google.com/youtube/v3/docs/captions/download
- https://supadata.ai/pricing
- https://github.com/supadata-ai/skills/blob/main/skills/supadata/references/video.md
