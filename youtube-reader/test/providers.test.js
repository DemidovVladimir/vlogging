// Both extractors, with a fake fetch. Nothing here contacts YouTube or Supadata.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchFromYoutube, parseTimedText, listTracks, chooseTrack } from '../src/youtube.js';
import { fetchFromSupadata, languageName } from '../src/supadata.js';
import { ReaderError } from '../src/core.js';

const ID = 'jNQXAC9IVRw';
const WATCH = '<html><script>ytcfg.set({"INNERTUBE_API_KEY":"KEY_123","X":1})</script></html>';
const XML = '<?xml version="1.0" encoding="utf-8" ?><transcript><text start="1.2" dur="2.5">All right, so here we are &amp;amp; it&amp;#39;s &lt;b&gt;fine&lt;/b&gt;</text><text start="4" dur="1"/><text start="5.5" dur="2">the elephants</text></transcript>';
const player = (over = {}) => ({
  playabilityStatus: { status: 'OK' },
  videoDetails: { title: 'Me at the zoo', author: 'jawed' },
  captions: { playerCaptionsTracklistRenderer: { captionTracks: [
    { baseUrl: 'https://www.youtube.com/api/timedtext?v=x&lang=en&kind=asr&fmt=srv3', name: { runs: [{ text: 'English (auto-generated)' }] }, languageCode: 'en', kind: 'asr' },
    { baseUrl: 'https://www.youtube.com/api/timedtext?v=x&lang=de', name: { runs: [{ text: 'German' }] }, languageCode: 'de' },
  ] } },
  ...over,
});

function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    for (const [match, respond] of routes) if (String(url).includes(match)) return respond(String(url), init);
    throw new Error(`unexpected request ${url}`);
  };
  fn.calls = calls;
  return fn;
}
const res = (body, status = 200, headers = {}) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
const failCode = async (promise) => { try { await promise; } catch (e) { assert.ok(e instanceof ReaderError, String(e && e.stack)); return e.code; } return null; };

// --- direct YouTube

test('YouTube: manual track preferred, XML decoded twice, empty cues skipped, cookies carried', async () => {
  const fetch = fakeFetch([
    ['/watch?v=', () => res(WATCH, 200, { 'Set-Cookie': 'YSC=abc; Path=/; Secure' })],
    ['/youtubei/v1/player', () => res(player())],
    ['/api/timedtext', () => res(XML)],
  ]);
  const doc = await fetchFromYoutube(ID, 'auto', fetch);
  assert.equal(doc.language_code, 'de');
  assert.equal(doc.is_generated, false);
  assert.equal(doc.title, 'Me at the zoo');
  assert.deepEqual(doc.segments, [
    { text: "All right, so here we are & it's fine", start: 1.2, duration: 2.5 },
    { text: 'the elephants', start: 5.5, duration: 2 },
  ]);
  const playerCall = fetch.calls.find((c) => c.url.includes('/player'));
  assert.ok(playerCall.url.endsWith('key=KEY_123'));
  assert.equal(JSON.parse(playerCall.init.body).context.client.clientName, 'ANDROID');
  assert.equal(playerCall.init.headers.Cookie, 'YSC=abc');
  assert.equal(playerCall.init.headers['User-Agent'], 'Margin-Reader/1.0');
});

test('YouTube: explicit language, generated track, srv3 removed', async () => {
  const fetch = fakeFetch([['/watch?v=', () => res(WATCH)], ['/player', () => res(player())], ['/api/timedtext', (url) => { assert.ok(!url.includes('fmt=srv3')); return res(XML); }]]);
  const doc = await fetchFromYoutube(ID, 'en', fetch);
  assert.equal(doc.language_code, 'en');
  assert.equal(doc.is_generated, true);
  assert.equal(doc.language, 'English (auto-generated)');
});

test('YouTube: unavailable language lists the available ones', async () => {
  const fetch = fakeFetch([['/watch?v=', () => res(WATCH)], ['/player', () => res(player())]]);
  try { await fetchFromYoutube(ID, 'ru', fetch); assert.fail('no error'); }
  catch (e) { assert.equal(e.code, 'language_unavailable'); assert.ok(e.message.includes('de, en')); }
});

for (const [name, routes, want] of [
  ['HTTP 429 on the watch page', [['/watch?v=', () => res('', 429)]], 'youtube_blocked'],
  ['reCAPTCHA page', [['/watch?v=', () => res('<div class="g-recaptcha"></div>')]], 'youtube_blocked'],
  ['bot check on the player', [['/watch?v=', () => res(WATCH)], ['/player', () => res({ playabilityStatus: { status: 'LOGIN_REQUIRED', reason: 'Sign in to confirm you’re not a bot' } })]], 'youtube_blocked'],
  ['age restriction', [['/watch?v=', () => res(WATCH)], ['/player', () => res({ playabilityStatus: { status: 'LOGIN_REQUIRED', reason: 'This video may be inappropriate for some users.' } })]], 'video_unavailable'],
  ['unavailable video', [['/watch?v=', () => res(WATCH)], ['/player', () => res({ playabilityStatus: { status: 'ERROR', reason: 'This video is unavailable' } })]], 'video_unavailable'],
  ['no caption tracks', [['/watch?v=', () => res(WATCH)], ['/player', () => res(player({ captions: undefined }))]], 'no_captions'],
  ['proof-of-origin token required', [['/watch?v=', () => res(WATCH)], ['/player', () => res(player({ captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ baseUrl: 'https://x/api/timedtext?v=1&exp=xpe', name: { simpleText: 'English' }, languageCode: 'en' }] } } }))]], 'youtube_error'],
  ['empty caption file', [['/watch?v=', () => res(WATCH)], ['/player', () => res(player())], ['/api/timedtext', () => res('')]], 'youtube_error'],
  ['HTTP 500 on the player', [['/watch?v=', () => res(WATCH)], ['/player', () => res('oops', 500)]], 'youtube_error'],
  ['network failure', [['/watch?v=', () => { throw new TypeError('fetch failed'); }]], 'network_error'],
]) {
  test(`YouTube error mapped: ${name} -> ${want}`, async () => assert.equal(await failCode(fetchFromYoutube(ID, 'auto', fakeFetch(routes))), want));
}

test('YouTube: consent page sets the CONSENT cookie and retries', async () => {
  let n = 0;
  const fetch = fakeFetch([
    ['/watch?v=', () => res(n++ === 0 ? '<form action="https://consent.youtube.com/s"><input name="v" value="cb.123"></form>' : WATCH)],
    ['/player', (url, init) => { assert.ok(init.headers.Cookie.includes('CONSENT=YES+cb.123')); return res(player()); }],
    ['/api/timedtext', () => res(XML)],
  ]);
  assert.equal((await fetchFromYoutube(ID, 'auto', fetch)).segments.length, 2);
});

test('track list: one per language, manual first, later duplicate wins', () => {
  const tracks = listTracks({ captions: { playerCaptionsTracklistRenderer: { captionTracks: [
    { baseUrl: 'a', languageCode: 'en', kind: 'asr', name: { simpleText: 'English (auto)' } },
    { baseUrl: 'b', languageCode: 'fr', name: { simpleText: 'French' } },
    { baseUrl: 'c', languageCode: 'fr', name: { simpleText: 'French 2' } },
  ] } } });
  assert.deepEqual(tracks.map((t) => t.url), ['c', 'a']);
  assert.equal(chooseTrack(tracks, 'auto').url, 'c');
  assert.equal(chooseTrack(tracks, 'auto', 'en').url, 'c', 'a manual track wins over a generated one in the preferred language');
  const many = listTracks({ captions: { playerCaptionsTracklistRenderer: { captionTracks: [
    { baseUrl: 'de', languageCode: 'de', name: { simpleText: 'German' } },
    { baseUrl: 'en', languageCode: 'en-GB', name: { simpleText: 'English' } },
  ] } } });
  assert.equal(chooseTrack(many, 'auto', 'en').url, 'en');
  assert.equal(chooseTrack(many, 'auto', 'ru').url, 'de');
  assert.equal(chooseTrack(many, 'auto').url, 'de');
  assert.equal(parseTimedText('<transcript></transcript>').length, 0);
});

// --- Supadata

const supadata = (handler) => fakeFetch([['api.supadata.test/v1/transcript', handler]]);
const opts = (fetchImpl) => ({ key: 'k', base: 'https://api.supadata.test/v1', fetchImpl, pollMs: 1 });

test('Supadata: native mode only, key header, milliseconds converted to seconds', async () => {
  const fetch = supadata((url, init) => {
    const q = new URL(url).searchParams;
    assert.equal(q.get('mode'), 'native');
    assert.equal(q.get('url'), `https://www.youtube.com/watch?v=${ID}`);
    assert.equal(q.get('lang'), null);
    assert.equal(init.headers['x-api-key'], 'k');
    return res({ lang: 'en', availableLangs: ['en'], content: [{ text: 'All right, so here we are', offset: 1200, duration: 2500, lang: 'en' }, { text: 'in front of the elephants', offset: 5500, duration: 2000, lang: 'en' }] });
  });
  const doc = await fetchFromSupadata(ID, 'auto', opts(fetch));
  assert.deepEqual(doc.segments, [
    { text: 'All right, so here we are', start: 1.2, duration: 2.5 },
    { text: 'in front of the elephants', start: 5.5, duration: 2 },
  ]);
  assert.equal(doc.language, 'English');
  assert.equal(doc.language_code, 'en');
  assert.equal(doc.is_generated, null);
  assert.equal(doc.provider, 'supadata');
  assert.equal(doc.id, '6cd87e239fad816e6e6e5eea');
});

test('Supadata: Automatic asks for the reader\'s language and accepts the fallback', async () => {
  const sent = [];
  const fetch = supadata((url) => { sent.push(new URL(url).searchParams.get('lang')); return res({ lang: 'de', availableLangs: ['de', 'fr'], content: [{ text: 'x', offset: 0, duration: 1 }] }); });
  const doc = await fetchFromSupadata(ID, 'auto', { ...opts(fetch), prefer: 'en' });
  assert.deepEqual(sent, ['en']);
  assert.equal(doc.language_code, 'de');
  await fetchFromSupadata(ID, 'ru', { ...opts(fetch), prefer: 'en' }).catch(() => {});
  assert.deepEqual(sent, ['en', 'ru'], 'an explicit choice wins over the browser language');
});

test('Supadata: explicit language is sent; a different language back is refused', async () => {
  const fetch = supadata((url) => { assert.equal(new URL(url).searchParams.get('lang'), 'de'); return res({ lang: 'en', availableLangs: ['en'], content: [{ text: 'x', offset: 0, duration: 1 }] }); });
  try { await fetchFromSupadata(ID, 'de', opts(fetch)); assert.fail('no error'); }
  catch (e) { assert.equal(e.code, 'language_unavailable'); assert.ok(e.message.includes('Available languages: en')); }
});

test('Supadata: asynchronous job is polled until completed', async () => {
  let polls = 0;
  const fetch = supadata((url) => {
    if (url.includes('/transcript/job%201')) return res(++polls < 3 ? { status: 'active' } : { status: 'completed', lang: 'en', content: [{ text: 'Done', offset: 0, duration: 1000 }] });
    return res({ jobId: 'job 1' }, 202);
  });
  const doc = await fetchFromSupadata(ID, 'auto', opts(fetch));
  assert.equal(polls, 3);
  assert.equal(doc.segments[0].text, 'Done');
});

for (const [status, body, want] of [
  [206, { error: 'transcript-unavailable', message: 'No transcript', details: '' }, 'no_captions'],
  [401, { error: 'unauthorized', message: 'Invalid key', details: '' }, 'provider_auth'],
  [403, { error: 'forbidden', message: 'x', details: '' }, 'provider_auth'],
  [402, { error: 'upgrade-required', message: 'x', details: '' }, 'quota_exhausted'],
  [429, { error: 'limit-exceeded', message: 'x', details: '' }, 'quota_exhausted'],
  [404, { error: 'not-found', message: 'x', details: '' }, 'video_unavailable'],
  [500, { error: 'internal-error', message: 'x', details: '' }, 'provider_error'],
  [502, 'not json', 'provider_error'],
]) {
  test(`Supadata error mapped: HTTP ${status} -> ${want}`, async () => assert.equal(await failCode(fetchFromSupadata(ID, 'auto', opts(supadata(() => res(body, status))))), want));
}

test('Supadata: missing key and network failure', async () => {
  assert.equal(await failCode(fetchFromSupadata(ID, 'auto', { key: '', fetchImpl: () => assert.fail('called') })), 'provider_unconfigured');
  assert.equal(await failCode(fetchFromSupadata(ID, 'auto', opts(supadata(() => { throw new TypeError('down'); })))), 'network_error');
  assert.equal(await failCode(fetchFromSupadata(ID, 'auto', opts(supadata(() => res({ lang: 'en', content: 'plain text' }))))), 'provider_error');
});

test('language names', () => {
  assert.equal(languageName('de'), 'German');
  assert.equal(languageName('zh-Hans'), 'Simplified Chinese');
  assert.equal(languageName('und'), 'Not specified');
});
