// eBay environments. Sandbox (test) and production (live) use different hosts; the account's saved environment decides which one is called.
export const ebayHost = (env) => (env === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com');

// Verifies saved eBay credentials with REAL calls to the chosen environment. Returns { ok, note } (short result code, never a secret).
// 1) the App ID + Cert ID must get an application token; 2) the OAuth user token must be accepted by a seller endpoint.
export async function verifyEbay(creds, env) {
  const appId = String(creds?.app_id || '').trim(), cert = String(creds?.cert_id || '').trim(), token = String(creds?.oauth_token || '').trim();
  if (!appId || !cert) return { ok: false, note: 'ebay_creds_missing' };
  const host = ebayHost(env);
  try {
    const app = await fetch(`${host}/identity/v1/oauth2/token`, {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Basic ${btoa(`${appId}:${cert}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });
    if (app.status === 400 || app.status === 401) return { ok: false, note: 'ebay_app_rejected' };
    if (!app.ok) return { ok: false, note: `ebay_http_${app.status}` };
    if (!token) return { ok: false, note: 'ebay_token_missing' };
    const seller = await fetch(`${host}/sell/account/v1/privilege`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (seller.status === 401 || seller.status === 403) return { ok: false, note: 'ebay_token_rejected' };
    if (!seller.ok) return { ok: false, note: `ebay_http_${seller.status}` };
    return { ok: true, note: 'verified' };
  } catch (err) {
    console.log('ebay verify failed', err.message);
    return { ok: false, note: 'ebay_unreachable' };
  }
}