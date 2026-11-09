// End-to-end checks over HTTP, shared by the local run (test/local-e2e.mjs) and the production
// run (test/remote-check.mjs). Each check prints one line; the run fails if any check fails.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const ROOT = new URL('../', import.meta.url);
const file = (path) => readFileSync(new URL(path, ROOT), 'utf8');

export function runner() {
  const results = [];
  async function check(name, fn) {
    const started = Date.now();
    try {
      const detail = await fn();
      results.push({ name, ok: true, detail: detail ?? null, ms: Date.now() - started });
      console.log(`PASS ${name}${detail ? ` - ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`);
    } catch (e) {
      results.push({ name, ok: false, error: String(e && e.message), ms: Date.now() - started });
      console.log(`FAIL ${name} - ${e && e.message}`);
    }
  }
  return { check, results };
}

// ctx: { base, mode: 'local'|'remote', auth: () => headers, extractUrl, live: boolean }
export async function apiChecks(ctx, { check }) {
  const origin = new URL(ctx.base).origin;
  const call = async (method, path, { body, headers = {}, auth = true, raw = false } = {}) => {
    const h = { ...(auth ? await ctx.auth() : {}), ...headers };
    if (body !== undefined) { h['Content-Type'] = 'application/json'; h.Origin = h.Origin ?? origin; }
    const response = await fetch(new URL(path, ctx.base), { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    if (raw) return response;
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* not JSON */ }
    return { status: response.status, type: response.headers.get('content-type') || '', headers: response.headers, text, data };
  };
  const created = [];

  // --- static files: right bytes and content types
  await check('GET / serves the app HTML', async () => {
    const r = await call('GET', '/');
    assert.equal(r.status, 200);
    assert.match(r.type, /^text\/html/);
    assert.ok(r.text.includes('id="extract-form"'));
    assert.equal(r.text, file('public/index.html'));
    assert.ok((r.headers.get('content-security-policy') || '').includes("frame-ancestors 'none'"));
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
  for (const [path, type] of [['/style.css', /^text\/css/], ['/app.js', /javascript/], ['/favicon.svg', /^image\/svg\+xml/]]) {
    await check(`GET ${path} is ${type.source} with the exact bytes`, async () => {
      const r = await call('GET', path);
      assert.equal(r.status, 200);
      assert.match(r.type, type);
      assert.equal(r.text, file(`public${path}`));
      return r.type;
    });
  }
  await check('/index.html reaches the same page', async () => {
    let r = await call('GET', '/index.html');
    if (r.status >= 300 && r.status < 400) { assert.equal(new URL(r.headers.get('location'), ctx.base).pathname, '/'); r = await call('GET', '/'); }
    assert.equal(r.status, 200);
    assert.ok(r.text.includes('id="extract-form"'));
  });
  await check('an unknown file is a 404, not the app', async () => {
    const r = await call('GET', '/no-such-file.js');
    assert.equal(r.status, 404);
    assert.ok(!r.text.includes('id="extract-form"'));
  });

  // --- access
  const anonymous = [['GET', '/api/library'], ['GET', '/api/me'], ['POST', '/api/extract', { url: 'jNQXAC9IVRw' }], ['POST', '/api/import', { name: 'x.txt', content: 'x' }], ['DELETE', '/api/library/abc'], ['GET', '/api/library/abc/export/txt'], ['GET', '/']];
  for (const [method, path, body] of anonymous) {
    if (ctx.mode === 'local' && path === '/') continue; // locally there is no Access in front of the files
    await check(`anonymous ${method} ${path} is refused`, async () => {
      const r = await call(method, path, { body, auth: false });
      assert.ok(r.status === 401 || r.status === 403 || (r.status >= 300 && r.status < 400), `status ${r.status}`);
      if (ctx.mode === 'remote') {
        if (r.status >= 300) assert.match(r.headers.get('location') || '', /cloudflareaccess\.com/);
      } else {
        assert.equal(r.data.code, 'signed_out');
      }
      return `HTTP ${r.status}`;
    });
  }
  if (ctx.badAuth) {
    await check('a forged token is refused', async () => {
      const r = await call('GET', '/api/library', { auth: false, headers: await ctx.badAuth() });
      assert.ok(r.status === 401 || r.status === 403 || (r.status >= 300 && r.status < 400), `status ${r.status}`);
      return `HTTP ${r.status}`;
    });
  }

  await check('health and identity', async () => {
    const health = await call('GET', '/api/health');
    assert.deepEqual(health.data, { status: 'ok', storage: 'd1' });
    const me = await call('GET', '/api/me');
    assert.equal(me.status, 200);
    assert.ok(me.data.kind);
    return { kind: me.data.kind, extractor: me.data.extractor, used: me.data.provider_used, limit: me.data.provider_limit };
  });
  await check('an unknown API path is JSON 404, not HTML', async () => {
    for (const path of ['/api/nope', '/api', '/api/library/abc/export', '/api/library/a/b/c/d']) {
      const r = await call('GET', path);
      assert.equal(r.status, 404, path);
      assert.match(r.type, /^application\/json/, path);
      assert.equal(r.data.code, 'not_found', path);
    }
  });
  await check('other websites cannot change or read the library', async () => {
    const a = await call('POST', '/api/import', { body: { name: 'x.txt', content: 'x' }, headers: { Origin: 'https://other.test' } });
    assert.equal(a.status, 403); assert.equal(a.data.code, 'foreign_origin');
    const b = await call('GET', '/api/library', { headers: { 'Sec-Fetch-Site': 'cross-site' } });
    assert.equal(b.status, 403); assert.equal(b.data.code, 'foreign_origin');
  });
  await check('invalid links are rejected before any provider request', async () => {
    for (const url of ['https://youtube.com.attacker.test/watch?v=jNQXAC9IVRw', 'https://youtube.com@attacker.test/watch?v=jNQXAC9IVRw', 'https://www.youtube.com/playlist?list=hello', 'https://127.0.0.1/watch?v=jNQXAC9IVRw', 'https://youtube.com:1234/watch?v=jNQXAC9IVRw', 'file:///etc/passwd', 'not a link']) {
      const r = await call('POST', '/api/extract', { body: { url } });
      assert.equal(r.status, 400, url); assert.equal(r.data.code, 'invalid_url', url);
    }
    const lang = await call('POST', '/api/extract', { body: { url: 'jNQXAC9IVRw', language: 'not a code!' } });
    assert.equal(lang.data.code, 'invalid_language');
  });

  // --- imports
  const srt = '1\n00:00:01,200 --> 00:00:03,700\nHello <i>world</i>.\n\n2\n00:01:05,000 --> 00:01:08,000\nAnother &amp; idea.';
  const vtt = 'WEBVTT\n\ncue-1\n00:01.200 --> 00:03.700 align:start\nHello <i>world</i>.\n\n01:05.000 --> 01:08.000\nAnother &amp; idea.';
  const expected = [{ text: 'Hello world.', start: 1.2, duration: 2.5 }, { text: 'Another & idea.', start: 65, duration: 3 }];
  let imported;
  await check('SRT and VTT imports keep text and timing', async () => {
    for (const [name, content] of [['E2E Captions.srt', srt], ['E2E Captions.vtt', vtt]]) {
      const r = await call('POST', '/api/import', { body: { name, content } });
      assert.equal(r.status, 200, r.text);
      assert.equal(r.data.has_timestamps, true);
      assert.deepEqual(r.data.segments, expected);
      assert.equal(r.data.title, 'E2E Captions');
      created.push(r.data.id);
      imported = r.data;
    }
  });
  let plain;
  await check('plain text import invents no timing; SRT export refused', async () => {
    const r = await call('POST', '/api/import', { body: { name: 'E2E Notes.txt', content: 'An idea.\n\nAnother thought.' } });
    assert.equal(r.status, 200);
    assert.equal(r.data.has_timestamps, false);
    assert.equal(r.data.segments.length, 2);
    plain = r.data; created.push(plain.id);
    const e = await call('GET', `/api/library/${plain.id}/export/srt`);
    assert.equal(e.status, 400); assert.equal(e.data.code, 'no_timestamps');
  });
  await check('malformed caption files are rejected and not saved', async () => {
    const before = (await call('GET', '/api/library')).data.length;
    for (const content of ['no captions here', '1\n00:00:05,000 --> 00:00:01,000\nBackwards', '1\n00:99:00,000 --> 00:99:01,000\nBad timestamp']) {
      const r = await call('POST', '/api/import', { body: { name: 'Invalid.srt', content } });
      assert.equal(r.status, 400, content);
    }
    assert.equal((await call('GET', '/api/library')).data.length, before);
  });
  await check('a file over 2 MB is refused by the server', async () => {
    const r = await call('POST', '/api/import', { body: { name: 'big.txt', content: 'x'.repeat(2_000_001) } });
    assert.equal(r.status, 413); assert.equal(r.data.code, 'too_large');
  });
  await check('a 1.6 MB subtitle file round-trips (compressed storage)', async () => {
    const lines = [];
    for (let i = 0; lines.join('\n\n').length < 1_600_000; i++) {
      const s = i * 2;
      const t = (x) => `${String(Math.floor(x / 3600)).padStart(2, '0')}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${String(x % 60).padStart(2, '0')},000`;
      lines.push(`${i + 1}\n${t(s)} --> ${t(s + 2)}\nLine ${i} of a very long recorded lecture about caption storage.`);
    }
    const r = await call('POST', '/api/import', { body: { name: 'E2E Long lecture.srt', content: lines.join('\n\n') } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    created.push(r.data.id);
    const back = await call('GET', `/api/library/${r.data.id}`);
    assert.equal(back.data.segments.length, lines.length);
    assert.deepEqual(back.data.segments.at(-1), r.data.segments.at(-1));
    return `${lines.length} captions`;
  });

  // --- library, exports, deletion
  await check('library lists saved documents without segments, newest first', async () => {
    const r = await call('GET', '/api/library');
    assert.equal(r.status, 200);
    const ids = r.data.map((d) => d.id);
    for (const id of created) assert.ok(ids.includes(id), id);
    assert.ok(r.data.every((d) => !('segments' in d)));
    for (let i = 1; i < r.data.length; i++) assert.ok(r.data[i - 1].created_at >= r.data[i].created_at);
  });
  await check('exports: TXT, Markdown and SRT attachments', async () => {
    const t = await call('GET', `/api/library/${imported.id}/export/txt`);
    assert.equal(t.status, 200); assert.match(t.type, /^text\/plain; charset=utf-8/);
    assert.ok(t.text.includes('Hello world.\n\nAnother & idea.'));
    assert.match(t.headers.get('content-disposition'), /^attachment; filename="transcript-[0-9a-f]+\.txt"; filename\*=UTF-8''E2E%20Captions\.txt$/);
    const m = await call('GET', `/api/library/${imported.id}/export/md`);
    assert.match(m.type, /^text\/markdown/); assert.ok(m.text.includes('**1:05** Another & idea.'));
    const s = await call('GET', `/api/library/${imported.id}/export/srt`);
    assert.match(s.type, /^application\/x-subrip/);
    assert.equal(s.text, '1\n00:00:01,200 --> 00:00:03,700\nHello world.\n\n2\n00:01:05,000 --> 00:01:08,000\nAnother & idea.\n');
    const bad = await call('GET', `/api/library/${imported.id}/export/exe`);
    assert.equal(bad.status, 400); assert.equal(bad.data.code, 'invalid_format');
  });

  // --- extraction (mock provider locally, Supadata in production)
  let extracted;
  if (ctx.extractUrl) {
    await check(`extraction returns real text and timestamps (${ctx.extractUrl})`, async () => {
      const r = await call('POST', '/api/extract', { body: { url: ctx.extractUrl, language: 'auto' } });
      assert.equal(r.status, 200, r.text.slice(0, 300));
      extracted = r.data;
      assert.ok(r.data.segments.length > 0);
      assert.ok(r.data.segments.every((s) => typeof s.text === 'string' && s.text && Number.isFinite(s.start) && s.start >= 0));
      assert.ok(r.data.segments.some((s) => s.start > 0));
      assert.equal(r.data.has_timestamps, true);
      created.push(r.data.id);
      return { cached: r.data.cached, title: r.data.title, author: r.data.author, language: r.data.language_code, segments: r.data.segments.length, first: r.data.segments[0], words: r.data.word_count };
    });
    await check('the same video again is served from the library (no provider call)', async () => {
      const before = (await call('GET', '/api/me')).data.provider_used;
      const r = await call('POST', '/api/extract', { body: { url: ctx.extractUrl } });
      assert.equal(r.status, 200);
      assert.equal(r.data.cached, true);
      assert.equal(r.data.id, extracted.id);
      assert.equal((await call('GET', '/api/me')).data.provider_used, before);
    });
    await check('timestamp links and SRT timing of the extracted transcript', async () => {
      const md = await call('GET', `/api/library/${extracted.id}/export/md`);
      const seg = extracted.segments.find((s) => s.start >= 1) || extracted.segments[0];
      assert.ok(md.text.includes(`(https://www.youtube.com/watch?v=${extracted.video_id}&t=${Math.floor(seg.start)}s)`));
      const srtText = (await call('GET', `/api/library/${extracted.id}/export/srt`)).text;
      assert.match(srtText, /^1\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/);
      return srtText.split('\n').slice(0, 3).join(' | ');
    });
  }

  return { call, created, extracted };
}

export async function cleanup(ctx, call, ids, { check }) {
  const origin = new URL(ctx.base).origin;
  await check('delete requires this origin; deleted documents are gone', async () => {
    const noOrigin = await call('DELETE', `/api/library/${ids[0]}`);
    assert.equal(noOrigin.status, 403);
    assert.equal(noOrigin.data.code, 'foreign_origin');
    for (const id of ids) {
      const r = await call('DELETE', `/api/library/${id}`, { headers: { Origin: origin } });
      assert.equal(r.status, 200, id);
      assert.deepEqual(r.data, { deleted: true });
      const g = await call('GET', `/api/library/${id}`);
      assert.equal(g.status, 404);
      assert.equal(g.data.code, 'not_found');
    }
    const again = await call('DELETE', `/api/library/${ids[0]}`, { headers: { Origin: origin } });
    assert.equal(again.status, 404);
    return `${ids.length} deleted`;
  });
}
