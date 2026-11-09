from copy import deepcopy
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

from fastapi.testclient import TestClient
import pytest

import app as reader


@pytest.fixture
def client(tmp_path):
    with TestClient(reader.create_app(tmp_path)) as client:
        yield client


@pytest.fixture
def document():
    return {
        "id": "sample", "video_id": "jNQXAC9IVRw", "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
        "title": "A sample video", "author": "An author", "language": "English", "language_code": "en",
        "is_generated": False, "source": "youtube",
        "segments": [{"text": "First idea.", "start": 1.2, "duration": 2.5}, {"text": "Second idea.", "start": 65, "duration": 3}],
    }


@pytest.mark.parametrize("value", [
    "jNQXAC9IVRw", "https://www.youtube.com/watch?v=jNQXAC9IVRw&t=20s",
    "https://youtu.be/jNQXAC9IVRw?si=example", "youtube.com/shorts/jNQXAC9IVRw",
    "https://m.youtube.com/live/jNQXAC9IVRw", "https://www.youtube-nocookie.com/embed/jNQXAC9IVRw",
])
def test_video_url_variants(value):
    assert reader.video_id_from_url(value) == "jNQXAC9IVRw"


@pytest.mark.parametrize("value", [
    "https://youtube.com.attacker.test/watch?v=jNQXAC9IVRw", "https://youtube.com@attacker.test/watch?v=jNQXAC9IVRw",
    "https://www.youtube.com/playlist?list=hello", "https://127.0.0.1/watch?v=jNQXAC9IVRw",
    "https://youtube.com:1234/watch?v=jNQXAC9IVRw", "file:///etc/passwd", "not a link",
])
def test_invalid_urls_never_reach_youtube(client, monkeypatch, value):
    def should_not_call(*args):
        pytest.fail("Invalid URL reached the provider")
    monkeypatch.setattr(reader, "fetch_from_youtube", should_not_call)
    response = client.post("/api/extract", json={"url": value})
    assert response.status_code == 400
    assert response.json()["code"] == "invalid_url"


def test_extraction_caching_exports_and_deletion(client, monkeypatch, document):
    calls = []
    def fetch(video_id, language):
        calls.append((video_id, language))
        return deepcopy(document)
    monkeypatch.setattr(reader, "fetch_from_youtube", fetch)
    response = client.post("/api/extract", json={"url": document["url"]})
    assert response.status_code == 200
    assert response.json()["word_count"] == 4
    assert response.json()["cached"] is False
    cached = client.post("/api/extract", json={"url": "jNQXAC9IVRw", "language": "en"})
    assert cached.json()["cached"] is True
    assert len(calls) == 1
    library = client.get("/api/library").json()
    assert len(library) == 1
    assert "segments" not in library[0]
    assert client.get("/api/library/sample").json()["segments"] == document["segments"]
    text = client.get("/api/library/sample/export/txt")
    assert "First idea.\n\nSecond idea." in text.text
    assert "attachment;" in text.headers["content-disposition"]
    markdown = client.get("/api/library/sample/export/md").text
    assert "[1:05](https://www.youtube.com/watch?v=jNQXAC9IVRw&t=65s)" in markdown
    subtitles = client.get("/api/library/sample/export/srt").text
    assert "00:00:01,200 --> 00:00:03,700" in subtitles
    assert "00:01:05,000 --> 00:01:08,000" in subtitles
    assert client.get("/api/library/sample/export/exe").status_code == 400
    assert client.delete("/api/library/sample").status_code == 200
    assert client.get("/api/library/sample").status_code == 404
    assert client.get("/api/library").json() == []


def test_library_survives_app_restart(tmp_path):
    first = TestClient(reader.create_app(tmp_path))
    doc = first.post("/api/import", json={"name": "Notes.txt", "content": "A useful idea."}).json()
    second = TestClient(reader.create_app(tmp_path))
    assert second.get(f"/api/library/{doc['id']}").json()["title"] == "Notes"


@pytest.mark.parametrize("name,content", [
    ("Captions.srt", "1\n00:00:01,200 --> 00:00:03,700\nHello <i>world</i>.\n\n2\n00:01:05,000 --> 00:01:08,000\nAnother &amp; idea."),
    ("Captions.vtt", "WEBVTT\n\ncue-1\n00:01.200 --> 00:03.700 align:start\nHello <i>world</i>.\n\n01:05.000 --> 01:08.000\nAnother &amp; idea."),
])
def test_subtitle_import(client, name, content):
    response = client.post("/api/import", json={"name": name, "content": content})
    assert response.status_code == 200
    data = response.json()
    assert data["has_timestamps"] is True
    assert data["segments"] == [
        {"text": "Hello world.", "start": 1.2, "duration": 2.5},
        {"text": "Another & idea.", "start": 65.0, "duration": 3.0},
    ]


def test_plain_text_import_does_not_invent_timing(client):
    data = client.post("/api/import", json={"name": "Notes.txt", "content": "An idea.\n\nAnother thought."}).json()
    assert data["has_timestamps"] is False
    assert len(data["segments"]) == 2
    assert client.get(f"/api/library/{data['id']}/export/srt").json()["code"] == "no_timestamps"


@pytest.mark.parametrize("content", [
    "no captions here", "1\n00:00:05,000 --> 00:00:01,000\nBackwards",
    "1\n00:99:00,000 --> 00:99:01,000\nBad timestamp",
])
def test_malformed_subtitle_files_are_rejected(client, content):
    response = client.post("/api/import", json={"name": "Invalid.srt", "content": content})
    assert response.status_code == 400
    assert client.get("/api/library").json() == []


def test_provider_error_is_actionable_and_releases_lock(client, monkeypatch, document):
    def blocked(*args):
        raise reader.ReaderError("YouTube blocked the request. Try importing captions.", "youtube_blocked", 429)
    monkeypatch.setattr(reader, "fetch_from_youtube", blocked)
    response = client.post("/api/extract", json={"url": "jNQXAC9IVRw"})
    assert response.status_code == 429
    assert response.json()["code"] == "youtube_blocked"
    assert client.get("/api/library").json() == []
    monkeypatch.setattr(reader, "fetch_from_youtube", lambda *args: deepcopy(document))
    assert client.post("/api/extract", json={"url": "jNQXAC9IVRw"}).status_code == 200


@pytest.mark.parametrize("error,code,status", [
    (reader.yt_errors.RequestBlocked("jNQXAC9IVRw"), "youtube_blocked", 429),
    (reader.yt_errors.IpBlocked("jNQXAC9IVRw"), "youtube_blocked", 429),
    (reader.yt_errors.TranscriptsDisabled("jNQXAC9IVRw"), "no_captions", 422),
    (reader.yt_errors.VideoUnavailable("jNQXAC9IVRw"), "video_unavailable", 422),
    (reader.yt_errors.AgeRestricted("jNQXAC9IVRw"), "video_unavailable", 422),
])
def test_actual_library_exceptions_are_mapped(client, monkeypatch, error, code, status):
    class FailingAPI:
        def __init__(self, **kwargs):
            pass

        def list(self, video_id):
            raise error

    monkeypatch.setattr(reader, "YouTubeTranscriptApi", FailingAPI)
    response = client.post("/api/extract", json={"url": "jNQXAC9IVRw"})
    assert response.status_code == status
    assert response.json()["code"] == code


def test_other_websites_cannot_change_or_read_library(client):
    response = client.post("/api/import", json={"name": "x.txt", "content": "x"}, headers={"Origin": "https://other.test"})
    assert response.status_code == 403
    assert client.get("/api/library", headers={"Sec-Fetch-Site": "cross-site"}).status_code == 403
    assert client.get("/api/library", headers={"Host": "attacker.test"}).status_code == 400
    assert client.get("/api/library").json() == []


def test_homepage_and_local_assets(client):
    response = client.get("/")
    assert response.status_code == 200
    assert 'id="extract-form"' in response.text
    assert response.headers["cache-control"] == "no-store"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/static/style.css").status_code == 200


class AssetReferences(HTMLParser):
    def __init__(self, markup):
        super().__init__()
        self.references = []
        self.feed(markup)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "link" and attrs.get("rel") in {"stylesheet", "icon"}:
            self.references.append(attrs["href"])
        elif tag == "script" and "src" in attrs:
            self.references.append(attrs["src"])


@pytest.mark.parametrize("page_path", ["/", "/index.html", "/static/index.html"])
def test_assets_load_from_every_page_route(client, page_path):
    page = client.get(page_path)
    assert page.status_code == 200
    references = AssetReferences(page.text).references
    assert len(references) == 3
    for reference in references:
        resolved = urljoin(f"http://testserver{page_path}", reference)
        asset = client.get(resolved)
        assert asset.status_code == 200, resolved
        if reference.endswith(".css"):
            assert asset.headers["content-type"].startswith("text/css")
            assert asset.text == (reader.ROOT / "static" / "style.css").read_text()
        elif reference.endswith(".js"):
            assert "javascript" in asset.headers["content-type"]
            assert asset.text == (reader.ROOT / "static" / "app.js").read_text()


def test_file_preview_assets_resolve_to_real_sibling_files():
    page = reader.ROOT / "static" / "index.html"
    for reference in AssetReferences(page.read_text()).references:
        resolved = urlparse(urljoin(page.as_uri(), reference))
        asset = Path(unquote(resolved.path))
        assert asset.is_file(), f"Missing asset when opening index.html directly: {asset}"
        assert asset.parent == page.parent
