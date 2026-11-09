"""Local-only YouTube caption reader. Start with uvicorn app:create_app --factory."""

from __future__ import annotations

import hashlib
import html
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import threading
import time
from urllib.parse import parse_qs, urlparse
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import requests
from starlette.middleware.trustedhost import TrustedHostMiddleware
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api import _errors as yt_errors


ROOT = Path(__file__).resolve().parent
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
LANGUAGE = re.compile(r"^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$")


class ReaderError(Exception):
    def __init__(self, message: str, code: str = "request_failed", status: int = 400):
        self.message, self.code, self.status = message, code, status


def video_id_from_url(value: str) -> str:
    value = value.strip()
    if VIDEO_ID.fullmatch(value):
        return value
    if "://" not in value:
        value = "https://" + value
    try:
        parsed = urlparse(value)
        if parsed.scheme not in {"https", "http"} or parsed.username or parsed.password:
            raise ValueError
        if parsed.port not in {None, 80, 443}:
            raise ValueError
        host = (parsed.hostname or "").lower()
        parts = parsed.path.strip("/").split("/")
        candidate = ""
        if host in {"youtu.be", "www.youtu.be"} and len(parts) == 1:
            candidate = parts[0]
        elif host in {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"}:
            if parsed.path == "/watch":
                candidate = parse_qs(parsed.query).get("v", [""])[0]
            elif len(parts) == 2 and parts[0] in {"shorts", "embed", "live"}:
                candidate = parts[1]
        elif host in {"youtube-nocookie.com", "www.youtube-nocookie.com"}:
            if len(parts) == 2 and parts[0] == "embed":
                candidate = parts[1]
        if VIDEO_ID.fullmatch(candidate):
            return candidate
    except ValueError:
        pass
    raise ReaderError("Paste a YouTube video link or an 11-character video ID.", "invalid_url")


class TimedSession(requests.Session):
    def request(self, method, url, **kwargs):
        kwargs.setdefault("timeout", (5, 15))
        return super().request(method, url, **kwargs)


def clean_text(value: str) -> str:
    # Text stays plain throughout storage and is rendered through textContent in the UI.
    return " ".join(html.unescape(re.sub(r"<[^>]+>", "", value)).split())


def normalize_segments(items: list[dict]) -> list[dict]:
    output = []
    for item in items:
        text = clean_text(str(item.get("text", "")))
        start, duration = float(item.get("start", 0)), float(item.get("duration", 0))
        if not math.isfinite(start) or not math.isfinite(duration) or start < 0 or duration < 0:
            raise ReaderError("The caption file contains an invalid timestamp.", "invalid_captions")
        if text:
            output.append({"text": text, "start": round(start, 3), "duration": round(duration, 3)})
    if not output:
        raise ReaderError("No readable captions were found.", "empty_transcript")
    return sorted(output, key=lambda row: row["start"])


def fetch_from_youtube(video_id: str, language: str) -> dict:
    try:
        # The library's session is not thread-safe; use a fresh one per extraction.
        with TimedSession() as session:
            tracks = list(YouTubeTranscriptApi(http_client=session).list(video_id))
            if not tracks:
                raise ReaderError("This video has no available captions.", "no_captions")
            if language == "auto":
                track = next((track for track in tracks if not track.is_generated), tracks[0])
            else:
                matching = [track for track in tracks if track.language_code == language]
                if not matching:
                    available = ", ".join(dict.fromkeys(track.language_code for track in tracks))
                    raise ReaderError(
                        f"No {language} captions are available. Available languages: {available}. Try First available.",
                        "language_unavailable",
                    )
                track = next((track for track in matching if not track.is_generated), matching[0])
            fetched = track.fetch()
            segments = normalize_segments(fetched.to_raw_data())
        title, author = f"YouTube video · {video_id}", "YouTube"
        try:
            response = requests.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
                timeout=(3, 4),
            )
            response.raise_for_status()
            metadata = response.json()
            title = str(metadata.get("title") or title)[:500]
            author = str(metadata.get("author_name") or author)[:200]
        except (requests.RequestException, ValueError, TypeError):
            pass  # Missing optional metadata must not discard a usable transcript.
        return {
            "id": hashlib.sha256(f"{video_id}:{track.language_code}".encode()).hexdigest()[:24],
            "video_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": title,
            "author": author,
            "language": track.language,
            "language_code": track.language_code,
            "is_generated": track.is_generated,
            "source": "youtube",
            "segments": segments,
        }
    except yt_errors.RequestBlocked as exc:
        raise ReaderError(
            "YouTube blocked this request. Wait before trying again, or open the video on YouTube and import its transcript. A VPN or cloud connection can also cause this.",
            "youtube_blocked", 429,
        ) from exc
    except yt_errors.TranscriptsDisabled as exc:
        raise ReaderError(
            "Captions are disabled or unavailable for this video. You can import a transcript if you have one. Videos without captions need speech-to-text, which this version does not include.",
            "no_captions", 422,
        ) from exc
    except (yt_errors.VideoUnavailable, yt_errors.VideoUnplayable, yt_errors.AgeRestricted) as exc:
        raise ReaderError(
            "This video is unavailable or requires access this reader does not have. Try a public video with captions.",
            "video_unavailable", 422,
        ) from exc
    except yt_errors.CouldNotRetrieveTranscript as exc:
        raise ReaderError(
            "YouTube could not provide this transcript. Try again later or import captions from a file.",
            "youtube_error", 502,
        ) from exc
    except requests.RequestException as exc:
        raise ReaderError("Could not reach YouTube. Check your connection and try again.", "network_error", 502) from exc


TIMING = re.compile(
    r"^\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})(?:\s+.*)?$"
)


def timestamp_seconds(value: str) -> float:
    fields = value.replace(",", ".").split(":")
    if len(fields) == 3:
        hours, minutes, seconds = int(fields[0]), int(fields[1]), float(fields[2])
    else:
        hours, minutes, seconds = 0, int(fields[0]), float(fields[1])
    if minutes >= 60 or seconds >= 60:
        raise ReaderError("The subtitle file contains an invalid timestamp.", "invalid_captions")
    return hours * 3600 + minutes * 60 + seconds


def parse_captions(content: str, name: str) -> tuple[list[dict], bool]:
    content = content.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n").strip()
    timed = name.lower().endswith((".vtt", ".srt")) or content.startswith("WEBVTT") or "-->" in content
    if not timed:
        paragraphs = [clean_text(p) for p in re.split(r"\n\s*\n", content) if clean_text(p)]
        if not paragraphs:
            raise ReaderError("The file is empty.", "empty_transcript")
        return [{"text": p, "start": 0, "duration": 0} for p in paragraphs], False
    segments = []
    for block in re.split(r"\n\s*\n", content):
        lines = block.splitlines()
        if lines and lines[0].startswith(("NOTE", "STYLE", "REGION", "WEBVTT")):
            continue
        for index, line in enumerate(lines):
            match = TIMING.match(line)
            if match:
                start, end = map(timestamp_seconds, match.groups())
                if end < start:
                    raise ReaderError("A subtitle ends before it starts.", "invalid_captions")
                segments.append({"text": " ".join(lines[index + 1:]), "start": start, "duration": end - start})
                break
    return normalize_segments(segments), True


def finalize(document: dict) -> dict:
    segments = document["segments"]
    document["word_count"] = len(" ".join(row["text"] for row in segments).split())
    document["reading_minutes"] = max(1, math.ceil(document["word_count"] / 230))
    document["duration"] = max((row["start"] + row["duration"] for row in segments), default=0)
    document.setdefault("has_timestamps", True)
    document["created_at"] = time.time()
    return document


class Store:
    def __init__(self, directory: Path):
        directory.mkdir(parents=True, exist_ok=True)
        self.path = directory / "library.sqlite3"
        with self.connect() as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS transcripts (id TEXT PRIMARY KEY, document TEXT NOT NULL)")

    def connect(self):
        return sqlite3.connect(self.path, timeout=10)

    def get(self, key: str) -> dict:
        with self.connect() as conn:
            row = conn.execute("SELECT document FROM transcripts WHERE id = ?", (key,)).fetchone()
        if row is None:
            raise ReaderError("This transcript is no longer in your library.", "not_found", 404)
        return json.loads(row[0])

    def all(self) -> list[dict]:
        with self.connect() as conn:
            rows = conn.execute("SELECT document FROM transcripts").fetchall()
        return sorted((json.loads(row[0]) for row in rows), key=lambda row: row["created_at"], reverse=True)

    def save(self, document: dict):
        with self.connect() as conn:
            conn.execute("INSERT OR REPLACE INTO transcripts VALUES (?, ?)", (document["id"], json.dumps(document, ensure_ascii=False)))

    def delete(self, key: str):
        with self.connect() as conn:
            cursor = conn.execute("DELETE FROM transcripts WHERE id = ?", (key,))
        if not cursor.rowcount:
            raise ReaderError("This transcript is no longer in your library.", "not_found", 404)

    def cached_video(self, video_id: str, language: str) -> dict | None:
        return next((doc for doc in self.all() if doc.get("video_id") == video_id and (language == "auto" or doc["language_code"] == language)), None)


class ExtractInput(BaseModel):
    url: str = Field(min_length=1, max_length=2000)
    language: str = Field(default="auto", max_length=24)


class ImportInput(BaseModel):
    name: str = Field(default="Imported transcript.txt", max_length=250)
    content: str = Field(min_length=1, max_length=2_000_000)


def clock_time(seconds: float, *, srt: bool = False) -> str:
    millis = round(seconds * 1000)
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, ms = divmod(remainder, 1000)
    if srt:
        return f"{hours:02}:{minutes:02}:{secs:02},{ms:03}"
    return f"{hours:d}:{minutes:02}:{secs:02}" if hours else f"{minutes:d}:{secs:02}"


def export_document(doc: dict, format: str) -> tuple[str, str]:
    title, url, segments = doc["title"], doc.get("url"), doc["segments"]
    if format == "txt":
        body = "\n\n".join(row["text"] for row in segments)
        return f"{title}\n{url or 'Imported transcript'}\n\n{body}\n", "text/plain"
    if format == "md":
        lines = [f"# {title}", "", f"Source: {url or 'Imported file'}", "", f"Language: {doc['language']}", ""]
        for row in segments:
            prefix = ""
            if doc["has_timestamps"]:
                stamp = clock_time(row["start"])
                prefix = f"[{stamp}]({url}&t={int(row['start'])}s) " if url else f"**{stamp}** "
            lines.append(prefix + row["text"] + "\n")
        return "\n".join(lines), "text/markdown"
    if format == "srt":
        if not doc["has_timestamps"]:
            raise ReaderError("This text import has no timestamps. Export it as TXT or Markdown.", "no_timestamps")
        return "\n\n".join(
            f"{index}\n{clock_time(row['start'], srt=True)} --> {clock_time(row['start'] + row['duration'], srt=True)}\n{row['text']}"
            for index, row in enumerate(segments, 1)
        ) + "\n", "application/x-subrip"
    raise ReaderError("Choose txt, md, or srt.", "invalid_format")


def create_app(data_dir: Path | None = None) -> FastAPI:
    app = FastAPI(title="Margin · YouTube Reader", docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["127.0.0.1", "localhost", "[::1]", "testserver"])
    store = Store(data_dir or Path(os.environ.get("YOUTUBE_READER_DATA_DIR", ROOT / "data")))
    extraction_lock = threading.Lock()
    app.state.store = store

    @app.middleware("http")
    async def local_requests(request: Request, call_next):
        # Prevent another website from making state-changing requests to this local service.
        origin = request.headers.get("origin")
        if request.method not in {"GET", "HEAD", "OPTIONS"} and origin and origin != str(request.base_url).rstrip("/"):
            return JSONResponse({"error": "Only this local reader can change the library.", "code": "foreign_origin"}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site" and request.url.path.startswith("/api/"):
            return JSONResponse({"error": "Open the reader directly to use its library.", "code": "foreign_origin"}, status_code=403)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        return response

    @app.exception_handler(ReaderError)
    async def handle_reader_error(request, exc):
        return JSONResponse({"error": exc.message, "code": exc.code}, status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request, exc):
        return JSONResponse({"error": "Check the link or file. Caption files must be under 2 MB.", "code": "invalid_input"}, status_code=422)

    @app.get("/")
    @app.get("/index.html")
    def index():
        return FileResponse(ROOT / "static" / "index.html")

    # Match the HTML's relative asset paths at the application root. The same
    # document also works at /static/index.html and as a local file preview.
    @app.get("/style.css")
    def stylesheet():
        return FileResponse(ROOT / "static" / "style.css", media_type="text/css")

    @app.get("/app.js")
    def javascript():
        return FileResponse(ROOT / "static" / "app.js", media_type="text/javascript")

    @app.get("/favicon.svg")
    def favicon():
        return FileResponse(ROOT / "static" / "favicon.svg", media_type="image/svg+xml")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "storage": "local"}

    @app.get("/api/library")
    def library():
        return [{key: value for key, value in doc.items() if key != "segments"} for doc in store.all()]

    @app.post("/api/extract")
    def extract(body: ExtractInput):
        video_id = video_id_from_url(body.url)
        if body.language != "auto" and not LANGUAGE.fullmatch(body.language):
            raise ReaderError("Use a language code such as en, de, or ru.", "invalid_language")
        cached = store.cached_video(video_id, body.language)
        if cached:
            return {**cached, "cached": True}
        if not extraction_lock.acquire(blocking=False):
            raise ReaderError("Another video is being extracted. Let it finish, then try again.", "busy", 409)
        try:
            doc = finalize(fetch_from_youtube(video_id, body.language))
            store.save(doc)
            return {**doc, "cached": False}
        finally:
            extraction_lock.release()

    @app.post("/api/import")
    def import_transcript(body: ImportInput):
        segments, timed = parse_captions(body.content, body.name)
        name = body.name.replace("\\", "/").rsplit("/", 1)[-1]
        doc = finalize({
            "id": uuid.uuid4().hex, "video_id": None, "url": None,
            "title": re.sub(r"\.(vtt|srt|txt)$", "", name, flags=re.I) or "Imported transcript",
            "author": "Imported file", "language": "Not specified", "language_code": "und",
            "is_generated": False, "source": "import", "has_timestamps": timed, "segments": segments,
        })
        store.save(doc)
        return doc

    @app.get("/api/library/{key}")
    def read_transcript(key: str):
        return store.get(key)

    @app.delete("/api/library/{key}")
    def delete_transcript(key: str):
        store.delete(key)
        return {"deleted": True}

    @app.get("/api/library/{key}/export/{format}")
    def export_transcript(key: str, format: str):
        doc = store.get(key)
        content, media_type = export_document(doc, format)
        return Response(content, media_type=media_type, headers={
            "Content-Disposition": f'attachment; filename="transcript-{doc["id"]}.{format}"',
        })

    app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
    return app
