import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser, mkEvent } from '../../shared/notify.ts';
import { tr } from '../../shared/msgs.ts';

const WARN_DAYS = 14;

// Called daily by the "Agreement Expiry" workflow.
//  - A signed agreement past its expiry date is marked expired (screening already treats it as not signed), logged, and the seller is notified.
//  - A signed agreement expiring within 14 days gets one "expires soon" notification per expiry date.
// Both notifications deep-link to the agreement in Settings.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const sr = base44.asServiceRole;
    const today = new Date().toISOString().slice(0, 10);
    const signed = await sr.entities.Agreement.filter({ status: 'signed' }, '-created_date', 1000);
    const users = new Map();
    let expired = 0, warned = 0;
    for (const a of signed) {
      if (!a.expiry_date) continue;
      const isExpired = a.expiry_date < today;
      const days = Math.round((Date.parse(a.expiry_date) - Date.parse(today)) / 864e5);
      if (!isExpired && (days > WARN_DAYS || a.expiry_warned)) continue;
      if (!users.has(a.created_by_id)) users.set(a.created_by_id, await sr.entities.User.get(a.created_by_id).catch((e) => (e.status === 404 ? null : Promise.reject(e))));
      const user = users.get(a.created_by_id);
      if (!user) continue;
      const lang = user.preferred_language || 'ne';
      const sup = await sr.entities.Supplier.get(a.supplier_ref).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      const supplier = sup?.name || '-';
      const link = `/settings?focus=agreement-${a.id}`;
      if (isExpired) {
        await sr.entities.Agreement.update(a.id, { status: 'expired' });
        // Written as the signed-in admin when they own the agreement, so it shows in their Audit log card (which lists their own entries).
        const audit = a.created_by_id === me.id ? base44.entities : sr.entities;
        await audit.AuditLog.create({ action: 'agreement_expired', actor_email: user.email, amount: 0, details: tr(lang, 'aud_agr_expired', { supplier, expiry: a.expiry_date }) + (a.is_test ? tr(lang, 'aud_agr_test') : '') });
        await notifyUser(sr, user, [mkEvent(lang, 'agreement', 'agr_exp_title', { supplier }, 'agr_exp_msg', { expiry: a.expiry_date }, { severity: 'critical', link })]);
        expired++;
      } else {
        await sr.entities.Agreement.update(a.id, { expiry_warned: true });
        await notifyUser(sr, user, [mkEvent(lang, 'agreement', 'agr_soon_title', { supplier }, 'agr_soon_msg', { expiry: a.expiry_date, days }, { link })]);
        warned++;
      }
    }
    return Response.json({ checked: signed.length, expired, warned });
  } catch (error) {
    console.error('agreementExpiry failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}