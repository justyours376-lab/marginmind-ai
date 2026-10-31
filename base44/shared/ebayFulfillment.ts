import { secrets } from 'base44:runtime';
import { ebayHost } from './ebayEnv.ts';

const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Credentials are decrypted only here, in memory, to call eBay. They are never returned or logged.
export async function readCreds(stored) {
  const [iv, ct] = String(stored).split(':');
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secrets.get('ENCRYPTION_KEY')));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(iv) }, key, b64d(ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

// Uploads a tracking number to eBay's Fulfillment API. Demo orders are simulated (no real call).
// Returns { ok, note } where note is a short result code the UI translates.
export async function uploadTracking(sr, userId, order, f, tracking, carrier) {
  if (order?.demo) return { ok: true, note: 'demo' };
  if (!f.ebay_order_id) return { ok: false, note: 'no_ebay_order' };
  const acct = (await sr.entities.ConnectedAccount.filter({ created_by_id: userId, provider: 'ebay', status: 'connected' }, '-created_date', 1))[0];
  if (!acct?.encrypted_credentials) return { ok: false, note: 'ebay_not_connected' };
  try {
    const token = (await readCreds(acct.encrypted_credentials)).oauth_token;
    if (!token) return { ok: false, note: 'ebay_not_connected' };
    const base = `${ebayHost(acct.environment)}/sell/fulfillment/v1/order/${encodeURIComponent(f.ebay_order_id)}`;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const got = await fetch(base, { headers, signal: AbortSignal.timeout(10000) });
    if (got.status === 401 || got.status === 403) return { ok: false, note: 'ebay_auth_failed' };
    if (!got.ok) return { ok: false, note: `ebay_http_${got.status}` };
    const lineItems = ((await got.json()).lineItems || []).map((li) => ({ lineItemId: li.lineItemId, quantity: li.quantity }));
    if (!lineItems.length) return { ok: false, note: 'no_ebay_order' };
    const res = await fetch(`${base}/shipping_fulfillment`, {
      method: 'POST', headers, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ lineItems, shippedDate: new Date().toISOString(), shippingCarrierCode: carrier || 'Other', trackingNumber: tracking }),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, note: 'ebay_auth_failed' };
    if (!res.ok) return { ok: false, note: `ebay_http_${res.status}` };
    await sr.entities.ConnectedAccount.update(acct.id, { connection_verified: true, last_verified_at: new Date().toISOString() });
    return { ok: true, note: 'uploaded' };
  } catch (err) {
    console.log('ebay upload failed', err.message);
    return { ok: false, note: 'ebay_unreachable' };
  }
}