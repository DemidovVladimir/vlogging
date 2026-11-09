// Reads the existing captions of a public YouTube video. The same three requests as
// youtube-transcript-api 1.2.4, which the local version used:
//   1. the watch page, for the InnerTube API key (and YouTube's visitor cookies);
//   2. the InnerTube player endpoint as the ANDROID client, for the caption track list;
//   3. the chosen track's timed-text XML.
// No audio is downloaded and nothing is transcribed: a video without captions has no text here.

import { ReaderError, cleanText, decodeEntities, normalizeSegments, youtubeDocumentId } from './core.js';

const WATCH_URL = 'https://www.youtube.com/watch?v=';
const PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false&key=';
const INNERTUBE_CONTEXT = { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } };
const TIMEOUT_MS = 15_000;
// An honest client name. This reader does not imitate a browser or work around YouTube's checks:
// when YouTube refuses the server's network (it refuses Cloudflare's, verified 5 November 2026),
// the request fails with youtube_blocked and a hosted provider (src/supadata.js) is used instead.
const HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Margin-Reader/1.0',
};

const blocked = () => new ReaderError(
  'YouTube refused this request from the hosting server. Wait and try again later, or open the video on YouTube and import its transcript file.',
  'youtube_blocked', 429,
);
const noCaptions = () => new ReaderError(
  'This video has no captions that can be read. You can import a transcript file if you have one. Videos without captions need speech-to-text, which this version does not include.',
  'no_captions', 422,
);
const unavailable = () => new ReaderError(
  'This video is unavailable, private, age-restricted, or limited in another way. Try a public video with captions.',
  'video_unavailable', 422,
);
const upstream = (detail) => new ReaderError(
  `YouTube could not provide this transcript (${detail}). Try again later or import captions from a file.`,
  'youtube_error', 502,
);

// Cookies YouTube sets on the first response go back on the next requests, as a browser does.
class CookieJar {
  constructor() { this.map = new Map(); }
  take(response) {
    const list = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const line of list) {
      const pair = line.split(';', 1)[0];
      const i = pair.indexOf('=');
      if (i > 0) this.map.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
  }
  set(name, value) { this.map.set(name, value); }
  header() { return Array.from(this.map, ([k, v]) => `${k}=${v}`).join('; '); }
}

async function request(fetchImpl, jar, url, init = {}) {
  const headers = { ...HEADERS, ...(init.headers || {}) };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  let response;
  try {
    response = await fetchImpl(url, { ...init, headers, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    throw new ReaderError('The server could not reach YouTube. Try again in a minute.', 'network_error', 502, { cause: String(error && error.name) });
  }
  jar.take(response);
  if (response.status === 429) throw blocked();
  if (!response.ok) throw upstream(`HTTP ${response.status}`);
  return response;
}

const CONSENT_FORM = 'action="https://consent.youtube.com/s"';

async function watchPage(fetchImpl, jar, videoId) {
  let html = await (await request(fetchImpl, jar, WATCH_URL + videoId)).text();
  if (html.includes(CONSENT_FORM)) {
    const match = /name="v" value="(.*?)"/.exec(html);
    if (!match) throw upstream('consent page');
    jar.set('CONSENT', 'YES+' + match[1]);
    html = await (await request(fetchImpl, jar, WATCH_URL + videoId)).text();
    if (html.includes(CONSENT_FORM)) throw upstream('consent page');
  }
  return html;
}

function innertubeKey(html) {
  const match = /"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/.exec(html);
  if (match) return match[1];
  if (html.includes('class="g-recaptcha"')) throw blocked();
  throw upstream('unreadable watch page');
}

function assertPlayable(status) {
  if (!status || status.status === undefined || status.status === 'OK') return;
  const reason = String(status.reason || '');
  if (status.status === 'LOGIN_REQUIRED' && /not a bot/i.test(reason)) throw blocked();
  throw unavailable();
}

function trackName(track) {
  const name = track.name || {};
  return (name.runs && name.runs[0] && name.runs[0].text) || name.simpleText || track.languageCode;
}

// Manually created tracks first, then generated ones; one track per language in each group,
// the later one winning, as in youtube-transcript-api's TranscriptList.
export function listTracks(player) {
  const renderer = player && player.captions && player.captions.playerCaptionsTracklistRenderer;
  if (!renderer || !Array.isArray(renderer.captionTracks)) throw noCaptions();
  const manual = new Map(), generated = new Map();
  for (const track of renderer.captionTracks) {
    if (!track || typeof track.baseUrl !== 'string' || typeof track.languageCode !== 'string') continue;
    const isGenerated = track.kind === 'asr';
    (isGenerated ? generated : manual).set(track.languageCode, {
      url: track.baseUrl.replace('&fmt=srv3', ''),
      language: String(trackName(track)).slice(0, 100),
      language_code: track.languageCode,
      is_generated: isGenerated,
    });
  }
  const tracks = [...manual.values(), ...generated.values()];
  if (!tracks.length) throw noCaptions();
  return tracks;
}

export function chooseTrack(tracks, language, prefer = null) {
  if (language === 'auto') {
    const inPreferred = (t) => prefer && t.language_code.toLowerCase().split('-')[0] === prefer;
    const manual = tracks.filter((t) => !t.is_generated);
    return manual.find(inPreferred) || manual[0] || tracks.find(inPreferred) || tracks[0];
  }
  const matching = tracks.filter((t) => t.language_code === language);
  if (!matching.length) {
    const available = [...new Set(tracks.map((t) => t.language_code))].join(', ');
    throw new ReaderError(
      `No ${language} captions are available. Available languages: ${available}. Choose Automatic.`,
      'language_unavailable',
    );
  }
  return matching.find((t) => !t.is_generated) || matching[0];
}

const XML_ATTR = /([a-zA-Z_:][\w:.-]*)\s*=\s*"([^"]*)"/g;

// The timed-text format: <transcript><text start="1.2" dur="2.5">escaped text</text>...</transcript>.
// The text is XML-escaped HTML, so it is decoded twice, then its formatting tags are dropped.
export function parseTimedText(xml) {
  const body = String(xml).replace(/<text\b[^>]*\/>/g, '');
  const rows = [];
  const element = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = element.exec(body))) {
    const attrs = {};
    for (const [, key, value] of match[1].matchAll(XML_ATTR)) attrs[key] = value;
    rows.push({
      text: cleanText(decodeEntities(decodeEntities(match[2]))),
      start: parseFloat(attrs.start || '0'),
      duration: parseFloat(attrs.dur || '0'),
    });
  }
  return rows;
}

export async function fetchFromYoutube(videoId, language, fetchImpl = fetch, prefer = null) {
  const jar = new CookieJar();
  const key = innertubeKey(await watchPage(fetchImpl, jar, videoId));
  const playerResponse = await request(fetchImpl, jar, PLAYER_URL + key, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: INNERTUBE_CONTEXT, videoId }),
  });
  let player;
  try { player = await playerResponse.json(); } catch { throw upstream('unreadable player response'); }
  assertPlayable(player.playabilityStatus);
  const track = chooseTrack(listTracks(player), language, prefer);
  if (track.url.includes('&exp=xpe')) throw upstream('this caption track needs a browser proof-of-origin token');
  const xml = await (await request(fetchImpl, jar, track.url)).text();
  if (!xml.trim()) throw upstream('empty caption file');
  const rows = parseTimedText(xml);
  if (!rows.length) throw upstream('caption file without text');
  const segments = normalizeSegments(rows);
  const details = player.videoDetails || {};
  return {
    id: await youtubeDocumentId(videoId, track.language_code),
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: String(details.title || `YouTube video · ${videoId}`).slice(0, 500),
    author: String(details.author || 'YouTube').slice(0, 200),
    language: track.language,
    language_code: track.language_code,
    is_generated: track.is_generated,
    source: 'youtube',
    has_timestamps: true,
    segments,
  };
}
