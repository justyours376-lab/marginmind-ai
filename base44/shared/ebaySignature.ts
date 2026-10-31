import { readCreds } from './ebayFulfillment.ts';
import { ebayHost } from './ebayEnv.ts';

// eBay Notification API signature check (X-EBAY-SIGNATURE).
// The header is base64 JSON { alg, kid, signature, digest }. The public key for `kid` comes from
// GET /commerce/notification/v1/public_key/{kid} (application token) and is cached in memory for ~1 hour.
// verifyEbaySignature never throws: any problem returns { ok: false, reason } and the caller answers 412.
const KEY_TTL_MS = 60 * 60 * 1000;
const CURVES = [['P-256', 32], ['P-384', 48], ['P-521', 66]];
const HASHES = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA384: 'SHA-384', SHA512: 'SHA-512' };
const keyCache = new Map(); // kid -> { cryptoKey, size, hash, exp }

const b64d = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// Web Crypto wants the raw r||s form; eBay sends the ASN.1 DER form (SEQUENCE { INTEGER r, INTEGER s }).
function derToRaw(sig, size) {
  if (sig[0] !== 0x30) return sig; // already raw
  let i = 2 + (sig[1] & 0x80 ? sig[1] & 0x7f : 0);
  const part = () => {
    if (sig[i] !== 0x02) throw new Error('bad_der');
    const len = sig[i + 1];
    let int = sig.slice(i + 2, i + 2 + len);
    i += 2 + len;
    while (int.length > size && int[0] === 0) int = int.slice(1);
    if (int.length > size) throw new Error('bad_der');
    const out = new Uint8Array(size);
    out.set(int, size - int.length);
    return out;
  };
  const r = part(), s = part();
  const raw = new Uint8Array(size * 2);
  raw.set(r, 0); raw.set(s, size);
  return raw;
}

async function importKey(pem) {
  const der = b64d(String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  for (const [namedCurve, size] of CURVES) {
    try { return { cryptoKey: await crypto.subtle.importKey('spki', der, { name: 'ECDSA', namedCurve }, false, ['verify']), size }; } catch { /* try next curve */ }
  }
  throw new Error('key_import_failed');
}

// Fetches the public key with an application token made from a connected eBay account's App ID + Cert ID.
async function fetchPublicKey(sr, kid) {
  const accounts = await sr.entities.ConnectedAccount.filter({ provider: 'ebay', status: 'connected' }, '-created_date', 5);
  for (const acct of accounts) {
    try {
      if (!acct.encrypted_credentials) continue;
      const creds = await readCreds(acct.encrypted_credentials);
      const appId = String(creds?.app_id || '').trim(), cert = String(creds?.cert_id || '').trim();
      if (!appId || !cert) continue;
      const host = ebayHost(acct.environment);
      const tok = await fetch(`${host}/identity/v1/oauth2/token`, {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Basic ${btoa(`${appId}:${cert}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      });
      if (!tok.ok) continue;
      const appToken = (await tok.json()).access_token;
      if (!appToken) continue;
      const res = await fetch(`${host}/commerce/notification/v1/public_key/${encodeURIComponent(kid)}`, {
        headers: { Authorization: `Bearer ${appToken}` }, signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      return await res.json();
    } catch (err) {
      console.log('ebay public key attempt failed', err.message);
    }
  }
  return null;
}

async function getPublicKey(sr, kid) {
  const hit = keyCache.get(kid);
  if (hit && hit.exp > Date.now()) return hit;
  const body = await fetchPublicKey(sr, kid);
  if (!body?.key) return null;
  const hash = HASHES[String(body.digest || '').toUpperCase().replace(/-/g, '')];
  const entry = { ...(await importKey(body.key)), hash, exp: Date.now() + KEY_TTL_MS };
  keyCache.set(kid, entry);
  return entry;
}

// headerValue: the X-EBAY-SIGNATURE header. rawBody: the request body bytes exactly as received.
export async function verifyEbaySignature(sr, headerValue, rawBody) {
  try {
    if (!headerValue) return { ok: false, reason: 'signature_header_missing' };
    const head = JSON.parse(new TextDecoder().decode(b64d(headerValue)));
    const kid = String(head?.kid || '');
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(kid)) return { ok: false, reason: 'kid_invalid' };
    if (String(head?.alg || '').toUpperCase() !== 'ECDSA' || !head?.signature) return { ok: false, reason: 'alg_or_signature_invalid' };
    const key = await getPublicKey(sr, kid);
    if (!key) return { ok: false, reason: 'public_key_unavailable' };
    const hash = key.hash || HASHES[String(head.digest || '').toUpperCase().replace(/-/g, '')];
    if (!hash) return { ok: false, reason: 'digest_unsupported' };
    const sig = derToRaw(b64d(head.signature), key.size);
    const valid = await crypto.subtle.verify({ name: 'ECDSA', hash }, key.cryptoKey, sig, rawBody);
    return valid ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
  } catch (err) {
    return { ok: false, reason: `verify_error: ${err.message}` };
  }
}