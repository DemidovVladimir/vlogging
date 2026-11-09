# Margin — a local YouTube transcript workspace

Paste a YouTube video link and read its captions as a transcript. Margin saves a private reading library on your computer, with paragraph and timeline views, search, timestamp links, copying, and TXT, Markdown, or SRT downloads. It also imports `.vtt`, `.srt`, and `.txt` files.

## Interface preferences

The design follows the visual preference stored in chaos-kb: neon, futuristic cyberpunk inspired by Blade Runner. The interface applies that preference with dark surfaces, cyan controls, amber accents, and narrow panel borders. Text remains readable without glow effects. Labels use direct wording. Definitions appear on the terms “transcript” and “captions” when hovered or focused with the keyboard.

## Start on this Mac

Double-click **Start Margin.command**. A terminal starts the local server and opens your browser at **http://127.0.0.1:8765**. Keep that terminal open while reading; press **Ctrl+C** to stop it. Run the same file whenever you want to return.

Use that HTTP address for the working application. Opening `static/index.html` directly shows a styled preview, with a notice that extraction and library access require the local server. Styles and scripts use relative paths so the preview does not lose its stylesheet.

If Finder opens the file in an editor, run it from Terminal:

```bash
cd /Users/vladimirdemidov/development/vlogging/youtube-reader
bash "Start Margin.command"
```

The launcher uses `uv` when available and installs the locked dependencies. On a new machine without `uv`, it can create a Python virtual environment and install `requirements.txt`; Python 3.11 or newer is required. No YouTube account or API key is needed.

## Use it

1. Paste a normal YouTube URL, a `youtu.be` link, Shorts/live/embed link, or video ID.
2. Leave **First available** selected, or choose the exact caption language you want. The app prefers a published manual track when available. It does not translate or detect the audio language.
3. Choose **Extract transcript**. A successful extraction is saved automatically.
4. Read paragraphs or use **Timeline** to inspect caption lines. Click a timestamp to open that moment on YouTube. Search filters matching passages without altering the saved transcript.
5. Use **Copy text** or **Export**. Reopening the same video and language uses your saved copy, with no new YouTube requests.

Keyboard shortcuts: **N** starts a new transcript; **/** focuses transcript search, when you are not typing in another field.

The reading time is an estimate at 230 words per minute. “Last caption” is the last caption end time. It is not the video's runtime. Paragraphs join adjacent caption lines. Text is not rewritten or summarized.

## What works and what can fail

This version **extracts existing captions; it does not transcribe audio**. Public videos need an accessible manual or auto-generated caption track. Private, age-restricted, region-restricted, removed, or captionless videos may not work. Captions, especially generated ones, can contain errors.

YouTube can block automated requests or change its caption endpoints. The extraction library is unofficial, and extraction is not guaranteed even when captions appear in your browser. Cloud/VPN IP addresses are particularly likely to be blocked. Margin shows an error rather than inventing text. Wait before retrying; saved transcripts and file imports still work offline.

If extraction fails and YouTube offers **Show transcript**, open it on YouTube, copy the transcript into a UTF-8 `.txt` file, and import the file. You can also import an existing UTF-8 `.srt` or `.vtt` subtitle file. The upload limit is 2 MB. Plain text imports have no timestamp links or SRT export. No paid proxy, external transcript provider, or audio model is configured.

For background: [youtube-transcript-api documentation](https://github.com/jdepoix/youtube-transcript-api). YouTube's [official caption download API](https://developers.google.com/youtube/v3/docs/captions/download) requires permission to edit the video, so it is not a general transcript API for other creators' videos.

## Privacy and storage

The server binds to **127.0.0.1**; it is intended for your computer only. It has no hosted service, analytics, external fonts, login, or paid API. Extracting a new video contacts YouTube for captions and optional title/author metadata. Opening a timestamp visits YouTube in a new tab.

Transcripts are saved as plaintext in `data/library.sqlite3` inside this folder. Anyone with access to that file can read them. Back up that file to retain your library. Removing an item deletes it from the library; downloaded exports remain wherever you saved them. Avoid putting the data folder in a public repository. The included `.gitignore` excludes it.

To move storage, set `YOUTUBE_READER_DATA_DIR` to a directory before starting. To use a different port, set `YOUTUBE_READER_PORT`, for example:

```bash
YOUTUBE_READER_PORT=8766 bash "Start Margin.command"
```

If the port is already in use, first check whether Margin is already running. Use a different port or stop the earlier server. Do not expose this local server to the internet; a hosted version would need a separate deployment and access design.

## Development and verification

```bash
uv sync --frozen --group dev
uv run pytest -q
node --check static/app.js
uv run uvicorn app:create_app --factory --host 127.0.0.1 --port 8765
```

Tests use temporary databases and a substituted transcript provider. They cover URL validation, caching, storage persistence, exports, imports, extraction failures, and local request boundaries. Live YouTube availability must be checked separately; automated tests do not guarantee it.
