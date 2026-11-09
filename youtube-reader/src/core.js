// Transcript logic that does not depend on the network or storage. Ported from the local
// Python version (legacy/python-local/app.py); the behaviour and error codes are the same.

export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const LANGUAGE = /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/;

// The first language in the browser's Accept-Language header, as a base code ('en-US' -> 'en').
// "Automatic" asks for captions in this language and takes the first available ones otherwise.
export function preferredLanguage(header) {
  for (const part of String(header || '').split(',')) {
    const base = part.split(';')[0].trim().toLowerCase().split('-')[0];
    if (/^[a-z]{2,3}$/.test(base)) return base;
  }
  return null;
}
export const WORDS_PER_MINUTE = 230;

export class ReaderError extends Error {
  constructor(message, code = 'request_failed', status = 400, extra = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const SHORT_HOSTS = new Set(['youtu.be', 'www.youtu.be']);
const NOCOOKIE_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);

export function videoIdFromUrl(input) {
  let value = String(input ?? '').trim();
  if (VIDEO_ID.test(value)) return value;
  if (!value.includes('://')) value = 'https://' + value;
  let candidate = '';
  try {
    const url = new URL(value);
    const portOk = url.port === '' || url.port === '80' || url.port === '443';
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password && portOk) {
      const host = url.hostname.toLowerCase();
      const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
      if (SHORT_HOSTS.has(host) && parts.length === 1) candidate = parts[0];
      else if (YOUTUBE_HOSTS.has(host)) {
        if (url.pathname === '/watch') candidate = url.searchParams.get('v') || '';
        else if (parts.length === 2 && ['shorts', 'embed', 'live'].includes(parts[0])) candidate = parts[1];
      } else if (NOCOOKIE_HOSTS.has(host) && parts.length === 2 && parts[0] === 'embed') candidate = parts[1];
    }
  } catch {
    candidate = '';
  }
  if (VIDEO_ID.test(candidate)) return candidate;
  throw new ReaderError('Paste a YouTube video link or an 11-character video ID.', 'invalid_url');
}

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', copy: '©', reg: '®', trade: '™',
  shy: '\u00ad', eacute: 'é', egrave: 'è', agrave: 'à', aacute: 'á', ccedil: 'ç', uuml: 'ü', ouml: 'ö',
  auml: 'ä', szlig: 'ß', ntilde: 'ñ', iacute: 'í', oacute: 'ó', uacute: 'ú', deg: '°', middot: '·',
};

// Decodes numeric character references and the named entities listed above. Unknown names stay as
// they are, which is what a browser does with an unknown entity.
export function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[A-Za-z][A-Za-z0-9]{1,31});/g, (whole, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '�';
      return String.fromCodePoint(code);
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body) ? NAMED_ENTITIES[body] : whole;
  });
}

// Text stays plain throughout storage and is rendered through textContent in the UI.
export function cleanText(value) {
  return decodeEntities(String(value).replace(/<[^>]+>/g, '')).split(/\s+/).filter(Boolean).join(' ');
}

const round3 = (n) => Math.round(n * 1000) / 1000;

export function normalizeSegments(items) {
  const output = [];
  for (const item of items) {
    const text = cleanText(String(item.text ?? ''));
    const start = Number(item.start ?? 0), duration = Number(item.duration ?? 0);
    if (!Number.isFinite(start) || !Number.isFinite(duration) || start < 0 || duration < 0) {
      throw new ReaderError('The caption file contains an invalid timestamp.', 'invalid_captions');
    }
    if (text) output.push({ text, start: round3(start), duration: round3(duration) });
  }
  if (!output.length) throw new ReaderError('No readable captions were found.', 'empty_transcript');
  return output.sort((a, b) => a.start - b.start);
}

const TIMING = /^\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d+:)?\d{2}:\d{2}[.,]\d{3})(?:\s+.*)?$/;
const LINE_BREAK = /\r\n|[\n\v\f\x1c\x1d\x1e\x85\u2028\u2029]/;

export function timestampSeconds(value) {
  const fields = value.replace(',', '.').split(':');
  let hours = 0, minutes, seconds;
  if (fields.length === 3) [hours, minutes, seconds] = [parseInt(fields[0], 10), parseInt(fields[1], 10), parseFloat(fields[2])];
  else [minutes, seconds] = [parseInt(fields[0], 10), parseFloat(fields[1])];
  if (minutes >= 60 || seconds >= 60) throw new ReaderError('The subtitle file contains an invalid timestamp.', 'invalid_captions');
  return hours * 3600 + minutes * 60 + seconds;
}

// Returns {segments, timed}. Plain text keeps its paragraphs and gets no invented timing.
export function parseCaptions(raw, name) {
  const content = String(raw).replace(/^\ufeff+/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lower = String(name).toLowerCase();
  const timed = lower.endsWith('.vtt') || lower.endsWith('.srt') || content.startsWith('WEBVTT') || content.includes('-->');
  const blocks = content.split(/\n\s*\n/);
  if (!timed) {
    const paragraphs = blocks.map(cleanText).filter(Boolean);
    if (!paragraphs.length) throw new ReaderError('The file is empty.', 'empty_transcript');
    return { segments: paragraphs.map((text) => ({ text, start: 0, duration: 0 })), timed: false };
  }
  const segments = [];
  for (const block of blocks) {
    const lines = block.split(LINE_BREAK);
    if (lines.length && /^(NOTE|STYLE|REGION|WEBVTT)/.test(lines[0])) continue;
    for (let index = 0; index < lines.length; index++) {
      const match = TIMING.exec(lines[index]);
      if (match) {
        const start = timestampSeconds(match[1]), end = timestampSeconds(match[2]);
        if (end < start) throw new ReaderError('A subtitle ends before it starts.', 'invalid_captions');
        segments.push({ text: lines.slice(index + 1).join(' '), start, duration: end - start });
        break;
      }
    }
  }
  return { segments: normalizeSegments(segments), timed: true };
}

export function finalize(document, now = Date.now()) {
  const segments = document.segments;
  const words = segments.map((row) => row.text).join(' ').split(/\s+/).filter(Boolean).length;
  document.word_count = words;
  document.reading_minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  document.duration = segments.reduce((max, row) => Math.max(max, row.start + row.duration), 0);
  if (document.has_timestamps === undefined) document.has_timestamps = true;
  document.created_at = now / 1000;
  return document;
}

export function clockTime(seconds, srt = false) {
  const millis = Math.round(seconds * 1000);
  const hours = Math.floor(millis / 3_600_000);
  const minutes = Math.floor((millis % 3_600_000) / 60_000);
  const secs = Math.floor((millis % 60_000) / 1000);
  const ms = millis % 1000;
  const p2 = (n) => String(n).padStart(2, '0');
  if (srt) return `${p2(hours)}:${p2(minutes)}:${p2(secs)},${String(ms).padStart(3, '0')}`;
  return hours ? `${hours}:${p2(minutes)}:${p2(secs)}` : `${minutes}:${p2(secs)}`;
}

export const EXPORT_TYPES = { txt: 'text/plain', md: 'text/markdown', srt: 'application/x-subrip' };

// Returns {body, type}. The same output as the local version, byte for byte.
export function exportDocument(doc, format) {
  const { title, segments } = doc;
  const url = doc.url || null;
  if (format === 'txt') {
    const body = segments.map((row) => row.text).join('\n\n');
    return { body: `${title}\n${url || 'Imported transcript'}\n\n${body}\n`, type: EXPORT_TYPES.txt };
  }
  if (format === 'md') {
    const lines = [`# ${title}`, '', `Source: ${url || 'Imported file'}`, '', `Language: ${doc.language}`, ''];
    for (const row of segments) {
      let prefix = '';
      if (doc.has_timestamps) {
        const stamp = clockTime(row.start);
        prefix = url ? `[${stamp}](${url}&t=${Math.floor(row.start)}s) ` : `**${stamp}** `;
      }
      lines.push(prefix + row.text + '\n');
    }
    return { body: lines.join('\n'), type: EXPORT_TYPES.md };
  }
  if (format === 'srt') {
    if (!doc.has_timestamps) throw new ReaderError('This text import has no timestamps. Export it as TXT or Markdown.', 'no_timestamps');
    const body = segments
      .map((row, i) => `${i + 1}\n${clockTime(row.start, true)} --> ${clockTime(row.start + row.duration, true)}\n${row.text}`)
      .join('\n\n') + '\n';
    return { body, type: EXPORT_TYPES.srt };
  }
  throw new ReaderError('Choose txt, md, or srt.', 'invalid_format');
}

// A readable download name. The ASCII fallback is always safe; filename* carries the title.
export function exportFilename(doc, format) {
  const slug = String(doc.title || 'transcript')
    .replace(/[\u0000-\u001f\u007f"*/:<>?\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'transcript';
  const ascii = `transcript-${doc.id}.${format}`;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(`${slug}.${format}`)}`;
}

export function importTitle(name) {
  const base = String(name).replace(/\\/g, '/').split('/').pop();
  return base.replace(/\.(vtt|srt|txt)$/i, '') || 'Imported transcript';
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// YouTube documents keep the local version's ID: the video and language decide it.
export async function youtubeDocumentId(videoId, languageCode) {
  return (await sha256Hex(`${videoId}:${languageCode}`)).slice(0, 24);
}

export function summaryOf(doc) {
  const { segments, ...summary } = doc;
  return summary;
}
