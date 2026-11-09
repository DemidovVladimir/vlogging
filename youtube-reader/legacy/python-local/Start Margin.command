#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"

reader_uv="$(command -v uv || true)"
if [ -z "$reader_uv" ] && [ -x "$HOME/.local/bin/uv" ]; then
  reader_uv="$HOME/.local/bin/uv"
fi

if [ -n "$reader_uv" ]; then
  "$reader_uv" sync --frozen --no-dev
else
  if [ ! -x .venv/bin/python ]; then
    python3 -m venv .venv
  fi
  .venv/bin/python -m pip install -r requirements.txt
fi

exec .venv/bin/python launch.py
