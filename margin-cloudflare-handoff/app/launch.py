"""Start Margin on loopback and open it after the server is ready."""

import json
import os
import threading
import time
from urllib.error import URLError
from urllib.request import urlopen
import webbrowser

import uvicorn


def is_margin_running(url):
    try:
        with urlopen(url + "/api/health", timeout=0.5) as response:
            return json.load(response) == {"status": "ok", "storage": "local"}
    except (URLError, TimeoutError, ValueError, OSError):
        return False


def open_when_ready(url):
    for _ in range(100):
        if is_margin_running(url):
            webbrowser.open(url)
            return
        time.sleep(0.1)


if __name__ == "__main__":
    port = int(os.environ.get("YOUTUBE_READER_PORT", "8765"))
    url = f"http://127.0.0.1:{port}"
    if is_margin_running(url):
        print(f"Margin is already running at {url}", flush=True)
        webbrowser.open(url)
        raise SystemExit(0)
    print(f"\nMargin will open at {url}\nKeep this terminal open. Press Ctrl+C to stop.\n", flush=True)
    threading.Thread(target=open_when_ready, args=(url,), daemon=True).start()
    uvicorn.run("app:create_app", factory=True, host="127.0.0.1", port=port)
