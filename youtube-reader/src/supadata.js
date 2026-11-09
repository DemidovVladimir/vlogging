// Supadata transcript API (https://docs.supadata.ai), used because YouTube refuses Cloudflare's
// network. Only mode=native is ever sent: it returns captions that already exist on YouTube and
// costs 1 credit. mode=auto and mode=generate (AI speech-to-text, 2 credits per minute) are never
// used. Offsets and durations arrive in milliseconds and are stored in seconds.

import { ReaderError, normalizeSegments, youtubeDocumentId } from './core.js';

export const SUPADATA_BASE = 'https://api.supadata.ai/v1';
const TIMEOUT_MS = 25_000;
const POLL_INTERVAL_MS = 2_000;
const POLL_ATTEMPTS = 8;

const providerError = (message, code = 'provider_error', status = 502) => new ReaderError(message, code, status);

export function languageName(code) {
  if (!code || code === 'und') return 'Not specified';
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
    if (name && name !== code) return name;
  } catch { /* unknown or malformed code */ }
  return code;
}

async function call(fetchImpl, url, key) {
  try {
    return await fetchImpl(url, { headers: { 'x-api-key': key, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw providerError('The server could not reach the transcript provider (Supadata). Try again in a minute.', 'network_error');
  }
}

async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}

// Maps Supadata's documented statuses and error codes to this app's error codes.
function failure(status, data, language) {
  const code = data && typeof data.error === 'string' ? data.error : '';
  if (status === 206 || code === 'transcript-unavailable') {
    return language === 'auto'
      ? new ReaderError('This video has no captions that can be read. You can import a transcript file if you have one. This app does not generate transcripts from audio.', 'no_captions', 422)
      : new ReaderError(`No ${language} captions are available for this video. Choose Automatic.`, 'language_unavailable', 422);
  }
  if (status === 401 || status === 403 || code === 'unauthorized' || code === 'forbidden') {
    return providerError('The transcript provider rejected the API key. The owner must store a valid Supadata key as the SUPADATA_API_KEY secret.', 'provider_auth', 503);
  }
  if (status === 402 || status === 429 || code === 'upgrade-required' || code === 'limit-exceeded') {
    return providerError('The transcript provider refused the request: the free monthly credits are used up, or too many requests were sent. Credits renew each month. Saved transcripts still open.', 'quota_exhausted', 429);
  }
  if (status === 404 || code === 'not-found') {
    return new ReaderError('The transcript provider could not find this video. It may be private, removed, or age-restricted.', 'video_unavailable', 422);
  }
  return providerError(`The transcript provider returned an error (HTTP ${status}${code ? `, ${code}` : ''}). Try again later or import captions from a file.`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchFromSupadata(videoId, language, { key, prefer = null, base = SUPADATA_BASE, fetchImpl = fetch, pollMs = POLL_INTERVAL_MS } = {}) {
  if (!key) throw providerError('Extraction is not configured: the transcript provider key is missing. The owner must store it as the SUPADATA_API_KEY secret.', 'provider_unconfigured', 503);
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  const query = new URLSearchParams({ url: watch, mode: 'native', text: 'false' });
  // Without lang, Supadata returns "the first available language", which may be a translation
  // (German for an English video in tests). Automatic therefore asks for the reader's language;
  // Supadata falls back to the first available language when that one is missing.
  if (language !== 'auto') query.set('lang', language);
  else if (prefer) query.set('lang', prefer);
  let response = await call(fetchImpl, `${base}/transcript?${query}`, key);
  let data = await readJson(response);

  if (response.status === 202 && data && typeof data.jobId === 'string') {
    const job = encodeURIComponent(data.jobId);
    for (let attempt = 0; ; attempt++) {
      if (attempt >= POLL_ATTEMPTS) throw providerError('The transcript provider is still preparing this transcript. Try again in a minute.', 'provider_pending', 503);
      await sleep(pollMs);
      response = await call(fetchImpl, `${base}/transcript/${job}`, key);
      data = await readJson(response);
      if (!response.ok) break;
      if (data && data.status === 'failed') throw failure(206, data.error && typeof data.error === 'object' ? data.error : data, language);
      if (data && data.status === 'completed') break;
    }
  }
  if (response.status !== 200 || !data) throw failure(response.status, data, language);
  if (!Array.isArray(data.content)) throw providerError('The transcript provider returned text without timestamps. Try again later.');

  const code = typeof data.lang === 'string' && data.lang ? data.lang : (language === 'auto' ? 'und' : language);
  if (language !== 'auto' && code.toLowerCase().split('-')[0] !== language.toLowerCase().split('-')[0]) {
    const available = Array.isArray(data.availableLangs) ? data.availableLangs.join(', ') : 'unknown';
    throw new ReaderError(`No ${language} captions are available. Available languages: ${available}. Choose Automatic.`, 'language_unavailable', 422);
  }
  const segments = normalizeSegments(data.content.map((chunk) => ({
    text: chunk && chunk.text,
    start: Number(chunk && chunk.offset) / 1000,
    duration: Number(chunk && chunk.duration) / 1000,
  })));
  return {
    id: await youtubeDocumentId(videoId, code),
    video_id: videoId,
    url: watch,
    title: `YouTube video · ${videoId}`,
    author: 'YouTube',
    language: languageName(code),
    language_code: code,
    // Supadata does not say whether a person or YouTube's speech recognition wrote the captions.
    is_generated: null,
    source: 'youtube',
    provider: 'supadata',
    has_timestamps: true,
    segments,
  };
}

// Title and channel name from YouTube's public oEmbed endpoint. Optional: a failure keeps the
// transcript and its placeholder title.
export async function youtubeMetadata(videoId, fetchImpl = fetch) {
  try {
    const query = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, format: 'json' });
    const response = await fetchImpl(`https://www.youtube.com/oembed?${query}`, { signal: AbortSignal.timeout(4_000), headers: { 'User-Agent': 'Margin-Reader/1.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data && data.title ? String(data.title).slice(0, 500) : null,
      author: data && data.author_name ? String(data.author_name).slice(0, 200) : null,
    };
  } catch {
    return null;
  }
}
