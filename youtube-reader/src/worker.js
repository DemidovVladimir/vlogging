// Margin on reader.tengucluster.com (Custom Domain of the Worker tengu-margin).
//   /...      the app's static files (public/), served by Workers Static Assets
//   /api/...  the library API, run by this script (run_worker_first in wrangler.jsonc)
// Cloudflare Access protects the whole hostname; this script also verifies the Access token on
// every API call (src/auth.js) and keeps each identity's transcripts separate in D1.
//
//   GET    /api/health                        {status, storage}
//   GET    /api/me                            {email, kind, extractor, provider_used, provider_limit, month}
//   GET    /api/library                       saved documents without segments, newest first
//   POST   /api/extract   {url, language}     full document + cached
//   POST   /api/import    {name, content}     full document
//   GET    /api/library/:id                   full document
//   DELETE /api/library/:id                   {deleted: true}
//   GET    /api/library/:id/export/:format    txt | md | srt attachment
// Errors: non-2xx JSON {error, code}. An unknown /api path is a JSON 404, never the app's HTML.

import {
  LANGUAGE, ReaderError, exportDocument, exportFilename, finalize, importTitle, parseCaptions, preferredLanguage, videoIdFromUrl,
} from './core.js';
import { identify, isLocalRequest } from './auth.js';
import { Store, acquireLock, countProviderCall, hit, monthKey, providerUsage, releaseLock } from './store.js';
import { fetchFromSupadata, youtubeMetadata, SUPADATA_BASE } from './supadata.js';
import { fetchFromYoutube } from './youtube.js';

const MAX_IMPORT_BYTES = 2_000_000;        // the caption file itself, UTF-8
const MAX_IMPORT_BODY = 4_500_000;         // the JSON request around it (escaping can double some characters)
const MAX_SMALL_BODY = 8_192;
const LOCK_MS = 90_000;
const DOC_ID = /^[A-Za-z0-9_-]{1,64}$/;

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS } });
}

const errorResponse = (e) => json({ error: e.message, code: e.code }, e.status);
const invalidInput = () => new ReaderError('Check the link or file. Caption files must be 2 MB or smaller.', 'invalid_input', 422);
const tooLarge = () => new ReaderError('Caption files must be 2 MB or smaller.', 'too_large', 413);

async function readJson(request, limit) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    throw new ReaderError('Send the request as JSON.', 'invalid_input', 415);
  }
  if (Number(request.headers.get('Content-Length') || 0) > limit) throw limit > MAX_SMALL_BODY ? tooLarge() : invalidInput();
  const chunks = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw limit > MAX_SMALL_BODY ? tooLarge() : invalidInput(); }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let value;
  try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw invalidInput(); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidInput();
  return value;
}

function extractor(env) {
  return env.EXTRACTOR === 'youtube' ? 'youtube' : 'supadata';
}

const providerLimit = (env) => Math.max(0, parseInt(env.PROVIDER_MONTHLY_LIMIT || '100', 10) || 0);
const extractPerHour = (env) => Math.max(1, parseInt(env.EXTRACT_PER_HOUR || '20', 10) || 20);

// Calls the configured provider. Every call that reaches the provider is counted, whatever its
// result, so the monthly count never undercounts the provider's credits.
async function extractLive(env, request, videoId, language) {
  const name = extractor(env);
  const prefer = preferredLanguage(request.headers.get('Accept-Language'));
  if (name === 'youtube') {
    await countProviderCall(env.DB, 'youtube');
    return fetchFromYoutube(videoId, language, fetch, prefer);
  }
  const base = isLocalRequest(request.url) && env.SUPADATA_API_BASE ? env.SUPADATA_API_BASE : SUPADATA_BASE;
  const key = env.SUPADATA_API_KEY;
  if (key) await countProviderCall(env.DB, 'supadata');
  const doc = await fetchFromSupadata(videoId, language, { key, base, prefer });
  const meta = await youtubeMetadata(videoId);
  if (meta && meta.title) doc.title = meta.title;
  if (meta && meta.author) doc.author = meta.author;
  return doc;
}

async function extract(request, env, who, store) {
  const body = await readJson(request, MAX_SMALL_BODY);
  const url = body.url, language = body.language === undefined ? 'auto' : body.language;
  if (typeof url !== 'string' || !url.length || url.length > 2000 || typeof language !== 'string' || language.length > 24) throw invalidInput();
  const videoId = videoIdFromUrl(url);
  if (language !== 'auto' && !LANGUAGE.test(language)) throw new ReaderError('Use a language code such as en, de, or ru.', 'invalid_language');

  const cached = await store.cachedVideo(videoId, language);
  if (cached) return json({ ...cached, cached: true });

  await hit(env.DB, `extract:${who.owner}`, extractPerHour(env), 3_600_000);
  const name = extractor(env);
  const limit = providerLimit(env);
  const used = await providerUsage(env.DB, name);
  if (name === 'supadata' && used >= limit) {
    throw new ReaderError(`This app has sent ${used} of its ${limit} transcript-provider requests for ${monthKey()}. The limit protects the free monthly credits. Saved transcripts still open; new extractions work again next month.`, 'quota_exhausted', 429);
  }
  const lock = `extract:${who.owner}`;
  if (!(await acquireLock(env.DB, lock, LOCK_MS))) {
    throw new ReaderError('Another video is being extracted. Let it finish, then try again.', 'busy', 409);
  }
  const started = Date.now();
  try {
    const doc = finalize(await extractLive(env, request, videoId, language));
    await store.save(doc);
    console.log(JSON.stringify({ event: 'extract', provider: name, video_id: videoId, ok: true, ms: Date.now() - started, segments: doc.segments.length }));
    return json({ ...doc, cached: false });
  } catch (e) {
    console.log(JSON.stringify({ event: 'extract', provider: name, video_id: videoId, ok: false, code: e.code || 'server_error', ms: Date.now() - started }));
    throw e;
  } finally {
    await releaseLock(env.DB, lock);
  }
}

async function importFile(request, store) {
  const body = await readJson(request, MAX_IMPORT_BODY);
  const name = body.name === undefined ? 'Imported transcript.txt' : body.name;
  const content = body.content;
  if (typeof name !== 'string' || name.length > 250 || typeof content !== 'string' || !content.length) throw invalidInput();
  if (new TextEncoder().encode(content).length > MAX_IMPORT_BYTES) throw tooLarge();
  const { segments, timed } = parseCaptions(content, name);
  const doc = finalize({
    id: crypto.randomUUID().replace(/-/g, ''), video_id: null, url: null,
    title: importTitle(name), author: 'Imported file', language: 'Not specified', language_code: 'und',
    is_generated: false, source: 'import', has_timestamps: timed, segments,
  });
  await store.save(doc);
  return json(doc);
}

async function exportFile(store, id, format) {
  const doc = await store.get(id);
  const { body, type } = exportDocument(doc, format);
  return new Response(body, {
    headers: { ...SECURITY_HEADERS, 'Content-Type': `${type}; charset=utf-8`, 'Content-Disposition': exportFilename(doc, format) },
  });
}

async function api(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    throw new ReaderError('Open the reader directly to use its library.', 'foreign_origin', 403);
  }
  const who = await identify(request, env);
  // State changes must come from a page on this same origin (stops cross-site form posts).
  if (method !== 'GET' && method !== 'HEAD' && request.headers.get('Origin') !== url.origin) {
    throw new ReaderError('Only this reader can change the library.', 'foreign_origin', 403);
  }
  const store = new Store(env.DB, who.owner);
  const path = url.pathname.slice('/api/'.length).split('/');
  const route = `${method} ${path[0] || ''}`;

  if (path.length === 1) {
    if (route === 'GET health') return json({ status: 'ok', storage: 'd1' });
    if (route === 'GET me') {
      const name = extractor(env);
      return json({ email: who.email, kind: who.kind, extractor: name, provider_used: await providerUsage(env.DB, name), provider_limit: name === 'supadata' ? providerLimit(env) : null, month: monthKey() });
    }
    if (route === 'GET library') return json(await store.list());
    if (route === 'POST extract') return extract(request, env, who, store);
    if (route === 'POST import') return importFile(request, store);
  }
  if (path[0] === 'library' && path.length >= 2 && DOC_ID.test(path[1])) {
    const id = path[1];
    if (path.length === 2 && method === 'GET') return json(await store.get(id));
    if (path.length === 2 && method === 'DELETE') { await store.delete(id); return json({ deleted: true }); }
    if (path.length === 4 && path[2] === 'export' && method === 'GET') return exportFile(store, id, path[3]);
  }
  throw new ReaderError('This API address does not exist.', 'not_found', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api' && !url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await api(request, env);
    } catch (e) {
      if (e instanceof ReaderError) return errorResponse(e);
      console.error(JSON.stringify({ event: 'error', path: url.pathname, message: String(e && e.message), stack: e && e.stack }));
      return json({ error: 'The server failed to complete this request. Try again.', code: 'server_error' }, 500);
    }
  },
};
