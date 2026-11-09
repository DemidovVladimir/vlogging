# Current application contract

This describes the source snapshot. It does not describe an existing hosted service.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/`, `/index.html` | Application HTML |
| GET | `/style.css`, `/app.js`, `/favicon.svg` | Assets referenced relative to the root document |
| GET | `/static/...` | The same assets and `index.html` at the static path |
| GET | `/api/health` | Returns `{"status":"ok","storage":"local"}` |
| GET | `/api/library` | Saved documents, newest first; omits `segments` |
| POST | `/api/extract` | Extract captions or return a saved copy |
| POST | `/api/import` | Parse and save a caption/text file |
| GET | `/api/library/{id}` | Full saved document |
| DELETE | `/api/library/{id}` | Remove a saved document |
| GET | `/api/library/{id}/export/{format}` | Download `txt`, `md`, or `srt` |

## Extract request

```json
{
  "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "language": "auto"
}
```

The backend accepts supported YouTube watch, short-link, Shorts, live, embed, and nocookie embed URLs, or an 11-character video ID. It validates the hostname and ID before making a request. Credentials in URLs, arbitrary hosts, and unusual ports are rejected.

`auto` means the first available manual caption track, otherwise the first available generated track. It does not mean detected audio language or automatic translation. An explicit language must match an available track. An existing saved copy for the same video and requested language avoids a new upstream call. In `auto` mode, any saved language for that video can satisfy the cache.

The extraction response is a full document with an additional boolean `cached` field. The current backend permits one concurrent live extraction per application process through a thread lock. That lock is not a hosted distributed rate limiter.

## Import request

```json
{
  "name": "captions.vtt",
  "content": "WEBVTT\n\n00:01.200 --> 00:03.700\nExample caption."
}
```

Supported formats are UTF-8 VTT, SRT, and plain text. The browser applies a 2 MB file-size limit. The current Pydantic model limits `content` to 2,000,000 characters; the hosted version should enforce the intended byte limit on the server as well.

Plain text imports have `has_timestamps: false`. They cannot be exported as SRT. Their duration fields are zero. The parser must not invent timing.

## Document schema

Illustrative document:

```json
{
  "id": "opaque-document-id",
  "video_id": "jNQXAC9IVRw",
  "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "title": "Video title",
  "author": "Channel name",
  "language": "English",
  "language_code": "en",
  "is_generated": false,
  "source": "youtube",
  "segments": [
    {"text": "Example caption.", "start": 1.2, "duration": 2.5}
  ],
  "word_count": 2,
  "reading_minutes": 1,
  "duration": 3.7,
  "has_timestamps": true,
  "created_at": 1793876400.0
}
```

`start`, segment `duration`, document `duration`, and `created_at` are measured in seconds. `created_at` is Unix time. Document `duration` is the last caption end time, not the video's runtime. Reading time is rounded up at 230 words per minute, with a minimum of one minute.

`source` is `youtube` or `import`. Imports have `video_id: null`, `url: null`, language `Not specified`, and language code `und`. YouTube document IDs are derived from video ID and language. Import IDs are UUIDs.

If another provider reports offsets or durations in milliseconds, convert them to seconds. Verify the result with an actual timestamp link and SRT export.

## Errors

Handled errors return a non-2xx response with this shape:

```json
{
  "error": "Readable explanation",
  "code": "machine_readable_code"
}
```

Existing codes include `invalid_url`, `invalid_language`, `language_unavailable`, `youtube_blocked`, `no_captions`, `video_unavailable`, `youtube_error`, `network_error`, `busy`, `not_found`, `invalid_captions`, `empty_transcript`, `no_timestamps`, `invalid_format`, `invalid_input`, and `foreign_origin`.

The frontend expects JSON from API endpoints. Preserve that behavior for authentication, quota, and provider failures. A missing API route must not be handled as the application HTML.

## Local storage and access boundaries

SQLite currently has a `transcripts` table with `id TEXT PRIMARY KEY` and `document TEXT NOT NULL`. Each document is serialized JSON. There is no cloud database or per-user identity field.

The local app accepts only loopback/test hostnames. It rejects foreign-origin mutations and cross-site API requests. It sets `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and a Content Security Policy allowing same-origin scripts/styles. These settings require review for the hosted origin; removing them is not a substitute for implementing authentication.

The frontend inserts transcript content through `textContent` and text nodes. Keep that boundary when rendering externally supplied captions. Export responses are attachments. Local database files and user exports were not included in the handoff.
