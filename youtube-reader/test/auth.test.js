// Access token verification with a real RSA key pair and a fake certs endpoint.
import test from 'node:test';
import assert from 'node:assert/strict';
import { identify, resetKeyCache } from '../src/auth.js';
import { ReaderError } from '../src/core.js';
import { makeSigner } from './jwt.mjs';

const TEAM = 'https://tengu-test.cloudflareaccess.com';
const AUD = 'aud-tag-1';
const env = { ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD, OWNER_EMAILS: 'Owner@Example.com, second@example.com', SERVICE_TOKEN_IDS: 'client-1.access' };

const signer = await makeSigner('kid-1');
const other = await makeSigner('kid-1');
const certs = (jwks = signer.jwks) => {
  const fn = async (url) => { fn.calls++; assert.equal(url, `${TEAM}/cdn-cgi/access/certs`); return Response.json(jwks); };
  fn.calls = 0;
  return fn;
};
const now = () => Math.floor(Date.now() / 1000);
const claims = (over = {}) => ({ iss: TEAM, aud: [AUD], email: 'owner@example.com', exp: now() + 600, iat: now(), nbf: now() - 1, ...over });
const req = (token, url = 'https://reader.tengucluster.com/api/library') => new Request(url, { headers: token ? { 'Cf-Access-Jwt-Assertion': token } : {} });
const fails = async (promise) => { try { await promise; } catch (e) { assert.ok(e instanceof ReaderError, String(e && e.stack)); return e.code; } return null; };

test('a valid owner token is accepted and maps to the owner library', async () => {
  resetKeyCache();
  const fetch = certs();
  const who = await identify(req(await signer.sign(claims())), env, fetch);
  assert.deepEqual(who, { owner: 'email:owner@example.com', email: 'owner@example.com', kind: 'person' });
  await identify(req(await signer.sign(claims({ email: 'second@example.com' }))), env, fetch);
  assert.equal(fetch.calls, 1, 'signing keys are cached');
});

test('a listed service token gets its own library', async () => {
  resetKeyCache();
  const who = await identify(req(await signer.sign(claims({ email: undefined, common_name: 'client-1.access', sub: '' }))), env, certs());
  assert.deepEqual(who, { owner: 'service:client-1.access', email: null, kind: 'service' });
});

for (const [name, make, want] of [
  ['no token', async () => null, 'signed_out'],
  ['garbage', async () => 'abc.def', 'signed_out'],
  ['wrong audience', async () => signer.sign(claims({ aud: ['other-app'] })), 'signed_out'],
  ['wrong issuer', async () => signer.sign(claims({ iss: 'https://evil.cloudflareaccess.com' })), 'signed_out'],
  ['expired', async () => signer.sign(claims({ exp: now() - 120 })), 'session_expired'],
  ['not yet valid', async () => signer.sign(claims({ nbf: now() + 600 })), 'signed_out'],
  ['signed by another key with the same kid', async () => other.sign(claims()), 'signed_out'],
  ['unknown kid', async () => (await makeSigner('kid-9')).sign(claims()), 'signed_out'],
  ['alg none', async () => { const t = await signer.sign(claims()); const [, p] = t.split('.'); return `${Buffer.from('{"alg":"none","kid":"kid-1"}').toString('base64url')}.${p}.`; }, 'signed_out'],
  ['tampered payload', async () => { const [h, , s] = (await signer.sign(claims())).split('.'); return `${h}.${Buffer.from(JSON.stringify(claims({ email: 'second@example.com' }))).toString('base64url')}.${s}`; }, 'signed_out'],
  ['email not on the list', async () => signer.sign(claims({ email: 'stranger@example.com' })), 'not_allowed'],
  ['service token not on the list', async () => signer.sign(claims({ email: undefined, common_name: 'client-2.access' })), 'not_allowed'],
]) {
  test(`refused: ${name} -> ${want}`, async () => {
    resetKeyCache();
    assert.equal(await fails(identify(req(await make()), env, certs())), want);
  });
}

test('closed when Access is not configured', async () => {
  resetKeyCache();
  assert.equal(await fails(identify(req(await signer.sign(claims())), { ...env, ACCESS_AUD: '' }, certs())), 'auth_unconfigured');
  assert.equal(await fails(identify(req(await signer.sign(claims())), { ...env, ACCESS_TEAM_DOMAIN: '' }, certs())), 'auth_unconfigured');
});

test('the local test key set is ignored for non-local hosts', async () => {
  resetKeyCache();
  const token = await signer.sign(claims());
  const local = { ...env, ACCESS_TEST_JWKS: JSON.stringify(signer.jwks) };
  const noFetch = async () => Response.json({ keys: [] });
  assert.equal(await fails(identify(req(token), local, noFetch)), 'signed_out');
  resetKeyCache();
  const who = await identify(req(token, 'http://localhost:8787/api/library'), local, noFetch);
  assert.equal(who.owner, 'email:owner@example.com');
});

test('certs endpoint failure is a 503, not a sign-in error', async () => {
  resetKeyCache();
  assert.equal(await fails(identify(req(await signer.sign(claims())), env, async () => new Response('down', { status: 500 }))), 'auth_unavailable');
});
