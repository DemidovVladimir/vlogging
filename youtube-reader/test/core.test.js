// Pure transcript logic. Cases ported from the local version's tests (legacy/python-local/tests).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReaderError, videoIdFromUrl, parseCaptions, finalize, exportDocument, exportFilename, clockTime, cleanText,
  importTitle, youtubeDocumentId, preferredLanguage,
} from '../src/core.js';
import { encodeSegments, decodeSegments } from '../src/store.js';

const sample = () => ({
  id: 'sample', video_id: 'jNQXAC9IVRw', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  title: 'A sample video', author: 'An author', language: 'English', language_code: 'en',
  is_generated: false, source: 'youtube', has_timestamps: true,
  segments: [{ text: 'First idea.', start: 1.2, duration: 2.5 }, { text: 'Second idea.', start: 65, duration: 3 }],
});

const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof ReaderError, String(e)); return e.code; } return null; };

for (const value of [
  'jNQXAC9IVRw', 'https://www.youtube.com/watch?v=jNQXAC9IVRw&t=20s', 'https://youtu.be/jNQXAC9IVRw?si=example',
  'youtube.com/shorts/jNQXAC9IVRw', 'https://m.youtube.com/live/jNQXAC9IVRw', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw',
  'https://music.youtube.com/watch?v=jNQXAC9IVRw', 'http://www.youtube.com:443/watch?v=jNQXAC9IVRw', '  https://youtu.be/jNQXAC9IVRw  ',
]) {
  test(`video URL accepted: ${value}`, () => assert.equal(videoIdFromUrl(value), 'jNQXAC9IVRw'));
}

for (const value of [
  'https://youtube.com.attacker.test/watch?v=jNQXAC9IVRw', 'https://youtube.com@attacker.test/watch?v=jNQXAC9IVRw',
  'https://user:pass@youtube.com/watch?v=jNQXAC9IVRw', 'https://www.youtube.com/playlist?list=hello',
  'https://127.0.0.1/watch?v=jNQXAC9IVRw', 'https://youtube.com:1234/watch?v=jNQXAC9IVRw', 'file:///etc/passwd',
  'not a link', '', 'javascript:alert(1)', 'https://www.youtube.com/watch?v=short', 'https://youtu.be/a/jNQXAC9IVRw',
]) {
  test(`video URL rejected: ${JSON.stringify(value)}`, () => assert.equal(code(() => videoIdFromUrl(value)), 'invalid_url'));
}

const expected = [
  { text: 'Hello world.', start: 1.2, duration: 2.5 },
  { text: 'Another & idea.', start: 65, duration: 3 },
];

test('SRT import', () => {
  const { segments, timed } = parseCaptions('1\n00:00:01,200 --> 00:00:03,700\nHello <i>world</i>.\n\n2\n00:01:05,000 --> 00:01:08,000\nAnother &amp; idea.', 'Captions.srt');
  assert.equal(timed, true);
  assert.deepEqual(segments, expected);
});

test('VTT import with cue ids, settings, BOM and CRLF', () => {
  const content = '\ufeffWEBVTT\r\n\r\ncue-1\r\n00:01.200 --> 00:03.700 align:start\r\nHello <i>world</i>.\r\n\r\nNOTE a comment\r\n\r\n01:05.000 --> 01:08.000\r\nAnother &amp; idea.';
  const { segments, timed } = parseCaptions(content, 'Captions.vtt');
  assert.equal(timed, true);
  assert.deepEqual(segments, expected);
});

test('plain text import keeps paragraphs and invents no timing', () => {
  const { segments, timed } = parseCaptions('An idea.\n\nAnother   thought.\n', 'Notes.txt');
  assert.equal(timed, false);
  assert.deepEqual(segments, [{ text: 'An idea.', start: 0, duration: 0 }, { text: 'Another thought.', start: 0, duration: 0 }]);
  const doc = finalize({ ...sample(), has_timestamps: false, segments });
  assert.equal(doc.duration, 0);
  assert.equal(code(() => exportDocument(doc, 'srt')), 'no_timestamps');
});

for (const [content, want] of [
  ['no captions here', 'empty_transcript'],
  ['1\n00:00:05,000 --> 00:00:01,000\nBackwards', 'invalid_captions'],
  ['1\n00:99:00,000 --> 00:99:01,000\nBad timestamp', 'invalid_captions'],
  ['   \n\n  ', 'empty_transcript'],
]) {
  test(`malformed subtitle file rejected: ${want}`, () => assert.equal(code(() => parseCaptions(content, 'Invalid.srt')), want));
}

test('finalize computes words, reading time and duration', () => {
  const doc = finalize(sample(), 1_793_876_400_000);
  assert.equal(doc.word_count, 4);
  assert.equal(doc.reading_minutes, 1);
  assert.equal(doc.duration, 68);
  assert.equal(doc.created_at, 1_793_876_400);
  const long = finalize({ ...sample(), segments: [{ text: Array(231).fill('w').join(' '), start: 0, duration: 1 }] });
  assert.equal(long.reading_minutes, 2);
});

test('exports match the local version', () => {
  const doc = finalize(sample());
  const txt = exportDocument(doc, 'txt');
  assert.equal(txt.type, 'text/plain');
  assert.equal(txt.body, 'A sample video\nhttps://www.youtube.com/watch?v=jNQXAC9IVRw\n\nFirst idea.\n\nSecond idea.\n');
  const md = exportDocument(doc, 'md').body;
  assert.ok(md.startsWith('# A sample video\n\nSource: https://www.youtube.com/watch?v=jNQXAC9IVRw\n\nLanguage: English\n'));
  assert.ok(md.includes('[1:05](https://www.youtube.com/watch?v=jNQXAC9IVRw&t=65s) Second idea.'));
  assert.ok(md.includes('[0:01](https://www.youtube.com/watch?v=jNQXAC9IVRw&t=1s) First idea.'));
  const srt = exportDocument(doc, 'srt').body;
  assert.equal(srt, '1\n00:00:01,200 --> 00:00:03,700\nFirst idea.\n\n2\n00:01:05,000 --> 00:01:08,000\nSecond idea.\n');
  assert.equal(code(() => exportDocument(doc, 'exe')), 'invalid_format');
  const imported = finalize({ ...sample(), url: null, video_id: null, source: 'import' });
  assert.ok(exportDocument(imported, 'md').body.includes('**1:05** Second idea.'));
  assert.ok(exportDocument(imported, 'txt').body.startsWith('A sample video\nImported transcript\n\n'));
});

test('clock times', () => {
  assert.equal(clockTime(3723.4), '1:02:03');
  assert.equal(clockTime(65), '1:05');
  assert.equal(clockTime(3723.4567, true), '01:02:03,457');
});

test('download names are safe', () => {
  const header = exportFilename({ id: 'abc', title: 'Bad/"name"\r\n: ok' }, 'md');
  assert.ok(header.startsWith('attachment; filename="transcript-abc.md"; filename*=UTF-8\'\''));
  assert.ok(!/[\r\n]/.test(header));
  assert.equal(decodeURIComponent(header.split("UTF-8''")[1]), 'Bad name ok.md');
});

test('text cleaning removes markup and decodes entities', () => {
  assert.equal(cleanText('<b>Rock</b> &amp; roll&#39;s&nbsp;<i>age</i>  &#x1F600; &bogus;'), 'Rock & roll\'s age 😀 &bogus;');
  assert.equal(importTitle('C:\\files\\My talk.SRT'), 'My talk');
  assert.equal(importTitle('.srt'), 'Imported transcript');
});

test('YouTube document IDs are the same as the local version', async () => {
  // Python: hashlib.sha256(b"jNQXAC9IVRw:en").hexdigest()[:24]
  assert.equal(await youtubeDocumentId('jNQXAC9IVRw', 'en'), '6cd87e239fad816e6e6e5eea');
});

test('segment storage round-trips, compressed above the threshold', async () => {
  const small = sample().segments;
  const a = await encodeSegments(small);
  assert.equal(a.encoding, 'json');
  assert.deepEqual(await decodeSegments(a.body, a.encoding), small);
  const big = Array.from({ length: 12000 }, (_, i) => ({ text: `Caption number ${i} with some repeated words in it.`, start: i * 2, duration: 2 }));
  const b = await encodeSegments(big);
  assert.equal(b.encoding, 'gzip');
  assert.ok(b.body.length < JSON.stringify(big).length / 3);
  assert.deepEqual(await decodeSegments(b.body, b.encoding), big);
});

test('preferred language comes from the first usable Accept-Language entry', () => {
  assert.equal(preferredLanguage('en-US,en;q=0.9,ru;q=0.8'), 'en');
  assert.equal(preferredLanguage('ru'), 'ru');
  assert.equal(preferredLanguage('*, de-DE;q=0.5'), 'de');
  assert.equal(preferredLanguage('zh-Hans-CN'), 'zh');
  assert.equal(preferredLanguage(''), null);
  assert.equal(preferredLanguage(null), null);
  assert.equal(preferredLanguage('12, x'), null);
});
