-- Margin library (D1). See src/store.js for how each column is used.

CREATE TABLE transcripts (
  owner TEXT NOT NULL,             -- 'email:<address>' or 'service:<Access client ID>' (src/auth.js)
  id TEXT NOT NULL,                -- YouTube: first 24 hex of SHA-256('<video id>:<language code>'); import: random UUID hex
  video_id TEXT,                   -- NULL for imports
  language_code TEXT NOT NULL,     -- 'und' for imports
  created_at REAL NOT NULL,        -- Unix time in seconds
  summary TEXT NOT NULL,           -- the document as JSON, without segments
  body TEXT NOT NULL,              -- the segments: JSON, or gzip + base64 (encoding = 'gzip')
  encoding TEXT NOT NULL,          -- 'json' | 'gzip'
  PRIMARY KEY (owner, id)
);
CREATE INDEX transcripts_by_time ON transcripts (owner, created_at DESC);
CREATE INDEX transcripts_by_video ON transcripts (owner, video_id, language_code, created_at DESC);

-- One live extraction per owner at a time. A row past its expiry is free to take.
CREATE TABLE locks (
  k TEXT PRIMARY KEY,
  expires INTEGER NOT NULL         -- ms since epoch
);

-- Rate-limit windows: k = 'extract:<owner>'.
CREATE TABLE throttle (
  k TEXT PRIMARY KEY,
  n INTEGER NOT NULL,              -- attempts in the current window
  reset INTEGER NOT NULL           -- window end, ms since epoch
);

-- Transcript-provider requests this app sent, per calendar month (UTC). Counted by the app, so it
-- can stop before the provider's free monthly credits are used up.
CREATE TABLE usage (
  month TEXT NOT NULL,             -- 'YYYY-MM'
  provider TEXT NOT NULL,          -- 'supadata' | 'youtube'
  n INTEGER NOT NULL,
  PRIMARY KEY (month, provider)
);
