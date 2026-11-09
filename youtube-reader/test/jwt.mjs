// Test helper: an RS256 key pair that signs Access-style JWTs, and its public JWKS.
export async function makeSigner(kid) {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const enc = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
  return {
    jwks: { keys: [{ kty: 'RSA', kid, alg: 'RS256', use: 'sig', n: pub.n, e: pub.e }] },
    async sign(payload) {
      const body = `${enc({ alg: 'RS256', kid, typ: 'JWT' })}.${enc(payload)}`;
      const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(body));
      return `${body}.${Buffer.from(sig).toString('base64url')}`;
    },
  };
}
