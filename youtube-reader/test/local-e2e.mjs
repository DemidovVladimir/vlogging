// Local end-to-end run: the real Worker in `wrangler dev --local` with a local D1 database, Access
// tokens signed by a throwaway key, and a mock Supadata server. Then a restart, to show that the
// library persists. Usage: node test/local-e2e.mjs   (E2E_TMP=<dir> to choose the state folder)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { makeSigner } from './jwt.mjs';
import { runner, apiChecks, cleanup } from './checks.mjs';

const PORT = 8790;
const BASE = `http://localhost:${PORT}`;
const TEAM = 'https://e2e.cloudflareaccess.com';
const AUD = 'e2e-aud';
const dir = mkdtempSync(join(process.env.E2E_TMP || tmpdir(), 'margin-e2e-'));
const cwd = new URL('../', import.meta.url).pathname;
const wrangler = join(cwd, 'node_modules/.bin/wrangler');

// --- mock Supadata
const providerCalls = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunks = [{ text: 'All right, so here we are,', offset: 0, duration: 1200 }, { text: 'in front of the elephants.', offset: 1200, duration: 2300 }, { text: 'The cool thing about these guys', offset: 4100, duration: 2900 }];
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://mock');
  const video = (url.searchParams.get('url') || '').split('v=')[1] || '';
  providerCalls.push({ path: url.pathname, video, mode: url.searchParams.get('mode'), lang: url.searchParams.get('lang'), key: req.headers['x-api-key'] });
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (url.pathname === '/v1/transcript/job-1') return send(200, { status: 'completed', lang: 'en', content: chunks });
  if (video === 'aaaaaaaaaaa') return send(206, { error: 'transcript-unavailable', message: 'No transcript', details: '' });
  if (video === 'bbbbbbbbbbb') return send(429, { error: 'limit-exceeded', message: 'Limit', details: '' });
  if (video === 'ccccccccccc') return send(401, { error: 'unauthorized', message: 'Bad key', details: '' });
  if (video === 'ddddddddddd') return send(202, { jobId: 'job-1' });
  if (video === 'eeeeeeeeeee') { await sleep(2500); return send(200, { lang: 'en', content: chunks }); }
  if (url.searchParams.get('lang') === 'de') return send(200, { lang: 'en', availableLangs: ['en'], content: chunks });
  return send(200, { lang: 'en', availableLangs: ['en'], content: chunks });
});
await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const mockPort = mock.address().port;

// --- keys and local configuration
const signer = await makeSigner('local-kid');
const forger = await makeSigner('local-kid');
const claims = (email) => ({ iss: TEAM, aud: [AUD], email, exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) });
const envFile = join(dir, 'e2e.env');
writeFileSync(envFile, [
  `ACCESS_TEAM_DOMAIN=${TEAM}`, `ACCESS_AUD=${AUD}`, `ACCESS_TEST_JWKS='${JSON.stringify(signer.jwks)}'`,
  'OWNER_EMAILS=owner@example.com,second@example.com', 'SERVICE_TOKEN_IDS=', 'EXTRACTOR=supadata',
  'SUPADATA_API_KEY=test-key', `SUPADATA_API_BASE=http://127.0.0.1:${mockPort}/v1`, 'PROVIDER_MONTHLY_LIMIT=100', 'EXTRACT_PER_HOUR=20', '',
].join('\n'));

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(wrangler, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(out))));
  });
}

async function startWorker() {
  const child = spawn(wrangler, ['dev', '--local', '--port', String(PORT), '--local-upstream', `localhost:${PORT}`, '--persist-to', dir, '--env-file', envFile, '--log-level', 'warn', '--show-interactive-dev-session=false'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${BASE}/favicon.svg`)).ok) return child; } catch { /* not up yet */ }
    await sleep(500);
  }
  child.kill();
  throw new Error(`wrangler dev did not start:\n${log}`);
}
const stopWorker = (child) => new Promise((r) => { child.on('exit', r); child.kill('SIGTERM'); });

const { check, results } = runner();
let worker;
try {
  console.log(await run(['d1', 'migrations', 'apply', 'DB', '--local', '--persist-to', dir]).then((o) => o.split('\n').filter((l) => /0001|applied|✅/i.test(l)).join('\n')));
  worker = await startWorker();
  const ctx = {
    base: BASE, mode: 'local', extractUrl: 'https://youtu.be/jNQXAC9IVRw',
    auth: async () => ({ 'Cf-Access-Jwt-Assertion': await signer.sign(claims('owner@example.com')) }),
    badAuth: async () => ({ 'Cf-Access-Jwt-Assertion': await forger.sign(claims('owner@example.com')) }),
  };
  const { call, created } = await apiChecks(ctx, { check });
  const origin = new URL(BASE).origin;
  const as = async (email) => ({ 'Cf-Access-Jwt-Assertion': await signer.sign(claims(email)) });

  await check('the mock provider only ever saw native mode and the API key', async () => {
    assert.ok(providerCalls.length >= 1);
    assert.ok(providerCalls.every((c) => c.mode === 'native' || c.path.startsWith('/v1/transcript/')), JSON.stringify(providerCalls));
    assert.ok(providerCalls.every((c) => c.key === 'test-key'));
    return `${providerCalls.length} call(s)`;
  });
  for (const [video, code, status] of [['aaaaaaaaaaa', 'no_captions', 422], ['bbbbbbbbbbb', 'quota_exhausted', 429], ['ccccccccccc', 'provider_auth', 503]]) {
    await check(`provider failure is a clear JSON error: ${code}`, async () => {
      const r = await call('POST', '/api/extract', { body: { url: video } });
      assert.equal(r.status, status); assert.equal(r.data.code, code); assert.ok(r.data.error.length > 20);
      return r.data.error;
    });
  }
  await check('an asynchronous provider job is polled to completion', async () => {
    const r = await call('POST', '/api/extract', { body: { url: 'ddddddddddd' } });
    assert.equal(r.status, 200, r.text); created.push(r.data.id);
  });
  await check('a language the provider does not have is reported with the alternatives', async () => {
    const r = await call('POST', '/api/extract', { body: { url: 'fffffffffff', language: 'de' } });
    assert.equal(r.status, 422); assert.equal(r.data.code, 'language_unavailable'); assert.ok(r.data.error.includes('en'));
  });
  await check('one extraction at a time per person: the second gets busy, then the lock is released', async () => {
    const [a, b] = await Promise.all([
      call('POST', '/api/extract', { body: { url: 'eeeeeeeeeee' } }),
      sleep(300).then(() => call('POST', '/api/extract', { body: { url: 'ggggggggggg' } })),
    ]);
    assert.equal(a.status, 200, a.text); created.push(a.data.id);
    assert.equal(b.status, 409); assert.equal(b.data.code, 'busy');
    const c = await call('POST', '/api/extract', { body: { url: 'ggggggggggg' } });
    assert.equal(c.status, 200, c.text); created.push(c.data.id);
  });
  await check('provider requests are counted for the month', async () => {
    const me = await call('GET', '/api/me');
    assert.equal(me.data.provider_used, providerCalls.filter((c) => c.path === '/v1/transcript').length);
    return `${me.data.provider_used} of ${me.data.provider_limit}`;
  });
  await check('each person has a separate library', async () => {
    const other = await as('second@example.com');
    const list = await fetch(`${BASE}/api/library`, { headers: other }).then((r) => r.json());
    assert.deepEqual(list, []);
    const doc = await fetch(`${BASE}/api/library/${created[0]}`, { headers: other });
    assert.equal(doc.status, 404);
    const del = await fetch(`${BASE}/api/library/${created[0]}`, { method: 'DELETE', headers: { ...other, Origin: origin } });
    assert.equal(del.status, 404);
    const stranger = await fetch(`${BASE}/api/library`, { headers: await as('stranger@example.com') });
    assert.equal(stranger.status, 403); assert.equal((await stranger.json()).code, 'not_allowed');
  });

  // --- restart: the library is still there
  await stopWorker(worker);
  worker = await startWorker();
  await check('the library survives a Worker restart', async () => {
    const r = await call('GET', '/api/library');
    for (const id of created) assert.ok(r.data.some((d) => d.id === id), id);
    const doc = await call('GET', `/api/library/${created[0]}`);
    assert.equal(doc.status, 200); assert.ok(doc.data.segments.length > 0);
    return `${r.data.length} documents after restart`;
  });
  await cleanup(ctx, call, created, { check });

  if (process.argv.includes('--browser')) {
    const headersFile = join(dir, 'headers.json');
    writeFileSync(headersFile, JSON.stringify(await ctx.auth()));
    const shots = process.env.E2E_SHOTS || join(dir, 'shots');
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [join(cwd, 'test/browser-check.mjs'), BASE, headersFile, 'https://www.youtube.com/watch?v=jNQXAC9IVRw', shots], { cwd, stdio: 'inherit' });
      child.on('exit', resolve);
    });
    results.push({ name: 'browser check (local)', ok: code === 0 });
    console.log(`${code === 0 ? 'PASS' : 'FAIL'} browser check (local) - screenshots in ${shots}`);
  }
} catch (e) {
  results.push({ name: 'harness', ok: false, error: String(e && e.stack) });
  console.log(`FAIL harness - ${e && e.stack}`);
} finally {
  if (worker) await stopWorker(worker);
  mock.close();
  rmSync(dir, { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
