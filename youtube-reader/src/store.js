// D1 storage. Every row belongs to one owner (see src/auth.js); every query filters by it, so one
// signed-in identity can never read or change another identity's transcripts.
//
// A transcript row keeps the document without its segments in `summary` (for the library list)
// and the segments in `body`: plain JSON, or gzip + base64 when the JSON is large, so that a
// 2 MB caption file fits under D1's 2 MB row limit.

import { ReaderError, summaryOf } from './core.js';

const COMPRESS_FROM = 512 * 1024;          // bytes of segments JSON
const MAX_BODY = 1_900_000;                // bytes stored in one row's body column
const LIBRARY_LIMIT = 2000;

const notFound = () => new ReaderError('This transcript is no longer in your library.', 'not_found', 404);

function toBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(out);
}

function fromBase64(text) {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function streamBytes(stream) {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeSegments(segments) {
  const json = JSON.stringify(segments);
  const bytes = new TextEncoder().encode(json);
  if (bytes.length < COMPRESS_FROM) return { body: json, encoding: 'json' };
  const gz = await streamBytes(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));
  const body = toBase64(gz);
  if (body.length > MAX_BODY) throw new ReaderError('This transcript is too large to store. Split the file and import the parts.', 'too_large', 413);
  return { body, encoding: 'gzip' };
}

export async function decodeSegments(body, encoding) {
  if (encoding === 'json') return JSON.parse(body);
  if (encoding === 'gzip') {
    const bytes = await streamBytes(new Blob([fromBase64(body)]).stream().pipeThrough(new DecompressionStream('gzip')));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  throw new Error(`unknown segment encoding ${encoding}`);
}

export class Store {
  constructor(db, owner) {
    this.db = db;
    this.owner = owner;
  }

  async list() {
    const { results } = await this.db
      .prepare('SELECT summary FROM transcripts WHERE owner = ?1 ORDER BY created_at DESC LIMIT ?2')
      .bind(this.owner, LIBRARY_LIMIT).all();
    return results.map((row) => JSON.parse(row.summary));
  }

  async get(id) {
    const row = await this.db
      .prepare('SELECT summary, body, encoding FROM transcripts WHERE owner = ?1 AND id = ?2')
      .bind(this.owner, id).first();
    if (!row) throw notFound();
    return { ...JSON.parse(row.summary), segments: await decodeSegments(row.body, row.encoding) };
  }

  // The newest saved copy of a video: in a given language, or (for 'auto') in any language.
  async cachedVideo(videoId, language) {
    const stmt = language === 'auto'
      ? this.db.prepare('SELECT id FROM transcripts WHERE owner = ?1 AND video_id = ?2 ORDER BY created_at DESC LIMIT 1').bind(this.owner, videoId)
      : this.db.prepare('SELECT id FROM transcripts WHERE owner = ?1 AND video_id = ?2 AND language_code = ?3 ORDER BY created_at DESC LIMIT 1').bind(this.owner, videoId, language);
    const row = await stmt.first();
    return row ? this.get(row.id) : null;
  }

  async save(doc) {
    const { body, encoding } = await encodeSegments(doc.segments);
    await this.db
      .prepare(`INSERT INTO transcripts (owner, id, video_id, language_code, created_at, summary, body, encoding)
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                ON CONFLICT (owner, id) DO UPDATE SET video_id = excluded.video_id, language_code = excluded.language_code,
                  created_at = excluded.created_at, summary = excluded.summary, body = excluded.body, encoding = excluded.encoding`)
      .bind(this.owner, doc.id, doc.video_id, doc.language_code, doc.created_at, JSON.stringify(summaryOf(doc)), body, encoding)
      .run();
  }

  async delete(id) {
    const result = await this.db.prepare('DELETE FROM transcripts WHERE owner = ?1 AND id = ?2').bind(this.owner, id).run();
    if (!result.meta.changes) throw notFound();
  }
}

// --- one extraction at a time per owner, rate limits, and provider usage per month

export async function acquireLock(db, key, ttlMs) {
  const now = Date.now();
  const result = await db
    .prepare('INSERT INTO locks (k, expires) VALUES (?1, ?2) ON CONFLICT (k) DO UPDATE SET expires = excluded.expires WHERE locks.expires <= ?3')
    .bind(key, now + ttlMs, now).run();
  return result.meta.changes > 0;
}

export function releaseLock(db, key) {
  return db.prepare('DELETE FROM locks WHERE k = ?1').bind(key).run();
}

// Counts an attempt in bucket k; refuses once the window holds more than max attempts.
export async function hit(db, k, max, windowMs) {
  const now = Date.now();
  const row = await db
    .prepare(`INSERT INTO throttle (k, n, reset) VALUES (?1, 1, ?2)
              ON CONFLICT (k) DO UPDATE SET n = CASE WHEN reset <= ?3 THEN 1 ELSE n + 1 END,
                                           reset = CASE WHEN reset <= ?3 THEN ?2 ELSE reset END
              RETURNING n, reset`)
    .bind(k, now + windowMs, now).first();
  if (row.n > max) {
    const minutes = Math.max(1, Math.ceil((row.reset - now) / 60_000));
    throw new ReaderError(`Too many extractions in a short time. Try again in ${minutes} min.`, 'rate_limited', 429);
  }
}

export const monthKey = (now = new Date()) => now.toISOString().slice(0, 7);

export async function providerUsage(db, provider, month = monthKey()) {
  const row = await db.prepare('SELECT n FROM usage WHERE month = ?1 AND provider = ?2').bind(month, provider).first();
  return row ? row.n : 0;
}

export function countProviderCall(db, provider, month = monthKey()) {
  return db
    .prepare('INSERT INTO usage (month, provider, n) VALUES (?1, ?2, 1) ON CONFLICT (month, provider) DO UPDATE SET n = n + 1')
    .bind(month, provider).run();
}
