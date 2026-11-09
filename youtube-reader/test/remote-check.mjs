// Production checks for https://reader.tengucluster.com, run with an Access service token:
//   MARGIN_E2E_CLIENT_ID=... MARGIN_E2E_CLIENT_SECRET=... node test/remote-check.mjs [video-url]
// The service token has its own library (src/auth.js), so the owner's transcripts are untouched.
// One live extraction uses one Supadata credit.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { runner, apiChecks, cleanup } from './checks.mjs';

const BASE = process.env.MARGIN_BASE || 'https://reader.tengucluster.com';
const id = process.env.MARGIN_E2E_CLIENT_ID, secret = process.env.MARGIN_E2E_CLIENT_SECRET;
if (!id || !secret) { console.error('Set MARGIN_E2E_CLIENT_ID and MARGIN_E2E_CLIENT_SECRET.'); process.exit(2); }
const videoUrl = process.argv[2] || 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
const alternates = (process.env.MARGIN_ALTERNATE_URLS || '').split(',').filter(Boolean);

const { check, results } = runner();
const ctx = {
  base: BASE, mode: 'remote', extractUrl: videoUrl,
  auth: async () => ({ 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret }),
  badAuth: async () => ({ 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': 'wrong-secret', 'Cf-Access-Jwt-Assertion': 'eyJhbGciOiJSUzI1NiJ9.eyJlbWFpbCI6InVuY29qZXRAZ21haWwuY29tIn0.AAAA' }),
};
try {
  const { call, created } = await apiChecks(ctx, { check });
  await check('a forged Cf-Access-Jwt-Assertion header alone does not open the library', async () => {
    const r = await fetch(new URL('/api/library', BASE), { headers: { 'Cf-Access-Jwt-Assertion': 'eyJhbGciOiJSUzI1NiJ9.eyJlbWFpbCI6InVuY29qZXRAZ21haWwuY29tIn0.AAAA' }, redirect: 'manual' });
    assert.notEqual(r.status, 200);
    return `HTTP ${r.status}`;
  });
  for (const url of alternates) {
    await check(`alternate hostname does not serve the app or API: ${url}`, async () => {
      for (const path of ['/', '/api/library']) {
        let status;
        try { status = (await fetch(new URL(path, url), { redirect: 'manual', headers: ctx.auth ? await ctx.auth() : {} })).status; }
        catch (e) { status = `no connection (${e.cause && e.cause.code || e.message})`; }
        assert.ok(status !== 200, `${path}: ${status}`);
      }
      return 'refused';
    });
  }
  await cleanup(ctx, call, created, { check });
} catch (e) {
  results.push({ name: 'harness', ok: false, error: String(e && e.stack) });
  console.log(`FAIL harness - ${e && e.stack}`);
}
if (process.env.MARGIN_RESULTS) writeFileSync(process.env.MARGIN_RESULTS, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
