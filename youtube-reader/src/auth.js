// Who is calling. Cloudflare Access signs every request it lets through with a JWT in the
// Cf-Access-Jwt-Assertion header (RS256, keys at <team domain>/cdn-cgi/access/certs). Access runs
// before this Worker, but the Worker checks the token itself as well, so the library stays closed
// if Access is ever misconfigured or removed. (ctx.access is not available here: Workers with
// static assets run behind a router that does not pass it on.)
//
// Allowed callers:
//   - a person whose email is listed in OWNER_EMAILS          -> owner "email:<address>"
//   - an Access service token whose client ID is in SERVICE_TOKEN_IDS -> owner "service:<id>"
// A service token therefore has its own, separate library: automated checks never see or change
// the owner's transcripts.

import { ReaderError } from './core.js';

const CLOCK_SKEW_S = 60;
const KEYS_TTL_MS = 10 * 60_000;
const REFETCH_GAP_MS = 30_000;

// Public signing keys only, cached per isolate. No request data is kept here.
const keyCache = { source: '', fetched: 0, keys: new Map() };

const list = (value) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean);

function b64urlBytes(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4);
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

const b64urlJson = (text) => JSON.parse(new TextDecoder().decode(b64urlBytes(text)));

const refused = (message = 'Sign in to use this library. Reload the page.', code = 'signed_out', status = 401) =>
  new ReaderError(message, code, status);

async function importKeys(jwks) {
  const keys = new Map();
  for (const jwk of (jwks && jwks.keys) || []) {
    if (!jwk || jwk.kty !== 'RSA' || !jwk.kid) continue;
    try {
      const key = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      keys.set(jwk.kid, key);
    } catch { /* skip a key this runtime cannot use */ }
  }
  return keys;
}

async function signingKey(kid, env, local, fetchImpl) {
  // Local development only: a fixed key set in .dev.vars, honoured only for requests to localhost.
  if (local && env.ACCESS_TEST_JWKS) {
    if (keyCache.source !== 'test') Object.assign(keyCache, { source: 'test', fetched: Date.now(), keys: await importKeys(JSON.parse(env.ACCESS_TEST_JWKS)) });
    return keyCache.keys.get(kid);
  }
  const source = `${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
  const now = Date.now();
  const stale = keyCache.source !== source || now - keyCache.fetched > KEYS_TTL_MS;
  const unknown = !keyCache.keys.has(kid) && now - keyCache.fetched > REFETCH_GAP_MS;
  if (stale || unknown) {
    const response = await fetchImpl(source, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new ReaderError('The sign-in service is unavailable. Try again in a minute.', 'auth_unavailable', 503);
    Object.assign(keyCache, { source, fetched: now, keys: await importKeys(await response.json()) });
  }
  return keyCache.keys.get(kid);
}

export function isLocalRequest(url) {
  const host = new URL(url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

// Returns {owner, email, kind}; throws ReaderError when the caller is not allowed.
export async function identify(request, env, fetchImpl = fetch) {
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/+$/, '');
  const audiences = list(env.ACCESS_AUD);
  if (!team || !audiences.length) {
    throw new ReaderError('Sign-in is not configured on this server yet, so the library is closed.', 'auth_unconfigured', 503);
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw refused();
  const parts = token.split('.');
  if (parts.length !== 3) throw refused();
  let header, payload;
  try { header = b64urlJson(parts[0]); payload = b64urlJson(parts[1]); } catch { throw refused(); }
  if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string') throw refused();

  const key = await signingKey(header.kid, { ...env, ACCESS_TEAM_DOMAIN: team }, isLocalRequest(request.url), fetchImpl);
  if (!key) throw refused();
  let valid = false;
  try {
    valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch { valid = false; }
  if (!valid) throw refused();

  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (payload.iss !== team) throw refused();
  if (!aud.some((a) => audiences.includes(a))) throw refused();
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_S < now) throw refused('Your sign-in has expired. Reload the page to sign in again.', 'session_expired');
  if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_S > now) throw refused();

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (email) {
    if (!list(env.OWNER_EMAILS).map((e) => e.toLowerCase()).includes(email)) {
      throw new ReaderError('This account is not allowed to use this library.', 'not_allowed', 403);
    }
    return { owner: `email:${email}`, email, kind: 'person' };
  }
  const client = typeof payload.common_name === 'string' ? payload.common_name : '';
  if (client && list(env.SERVICE_TOKEN_IDS).includes(client)) return { owner: `service:${client}`, email: null, kind: 'service' };
  throw new ReaderError('This account is not allowed to use this library.', 'not_allowed', 403);
}

export function resetKeyCache() {
  Object.assign(keyCache, { source: '', fetched: 0, keys: new Map() });
}
