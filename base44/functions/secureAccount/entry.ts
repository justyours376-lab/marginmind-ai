import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { tr } from '../../shared/msgs.ts';
import { verifyEbay } from '../../shared/ebayEnv.ts';

const allowed = ['ebay', 'shopify', 'alibaba', '1688', 'dhgate', 'made_in_china', 'payment'];
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const { provider, credentials, environment } = await req.json();
    if (!allowed.includes(provider) || !credentials || typeof credentials !== 'object') return Response.json({ error: 'Invalid input' }, { status: 400 });
    if (Object.keys(credentials).some((k) => /pass/i.test(k))) return Response.json({ error: 'Passwords are not accepted' }, { status: 400 });

    const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secrets.get('ENCRYPTION_KEY')));
    const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(credentials)));

    const first = String(Object.values(credentials).find((v) => v) || '');
    const hint = provider === 'payment' ? `${credentials.type} ••${credentials.last4 || ''}` : `••••${first.slice(-4)}`;
    // eBay: a real call to the chosen environment (sandbox or live) decides whether the connection counts as verified.
    const isEbay = provider === 'ebay';
    const env = isEbay && environment === 'sandbox' ? 'sandbox' : 'production';
    const check = isEbay ? await verifyEbay(credentials, env) : null;
    // Nothing usable was entered: do not save an empty connection.
    if (check?.note === 'ebay_creds_missing') return Response.json({ ok: false, verified: false, note: check.note, environment: env });
    const existing = await base44.entities.ConnectedAccount.filter({ created_by_id: user.id, provider });
    const data = {
      provider, encrypted_credentials: `${b64(iv)}:${b64(enc)}`, hint, status: 'connected', connection_verified: check?.ok === true,
      ...(isEbay ? { environment: env } : {}), ...(check?.ok ? { last_verified_at: new Date().toISOString() } : {}),
    };
    if (existing[0]) await base44.entities.ConnectedAccount.update(existing[0].id, data);
    else await base44.entities.ConnectedAccount.create(data);
    const label = isEbay ? `${provider} ${env}, ${check.ok ? 'verified' : `not verified (${check.note})`}` : provider;
    await base44.entities.AuditLog.create({ action: 'account_connected', actor_email: user.email, amount: 0, details: tr(user.preferred_language || 'ne', 'aud_account', { provider: label }) });
    return Response.json({ ok: true, hint, ...(check ? { verified: check.ok, note: check.note, environment: env } : {}) });
  } catch (error) {
    console.error('secureAccount failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}