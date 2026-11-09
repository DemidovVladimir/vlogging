"""Temporary loopback-only report server, owned by the experiment lifecycle."""
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from common import ROOT, require_managed

require_managed()
DEST = ROOT.parent / 'lumen-pilot-results-2026-10-26'
assert DEST.resolve() == DEST and not DEST.is_symlink()
assert json.loads((DEST / '.lumen-result-export.json').read_text())['source'] == str(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path in ['/', '/fine-tuning', '/fine-tuning/']:
            self.send_response(302)
            self.send_header('Location', '/runs/report.html')
            self.end_headers()
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, 'Directory listing disabled')
        return None

print('Local report: http://127.0.0.1:8463/runs/report.html ; loopback only; stop through manage.py', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8463), functools.partial(Handler, directory=str(DEST))).serve_forever()
