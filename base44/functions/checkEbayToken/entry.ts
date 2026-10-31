import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser, mkEvent } from '../../shared/notify.ts';
import { tr } from '../../shared/msgs.ts';

const WARN_DAYS = 7;

// Called daily by the "eBay Token Check" workflow. Notifies sellers whose saved eBay token has expired or expires within 7 days.
// Reads token_expires_at only; credentials are never decrypted or returned.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const sr = base44.asServiceRole;
    const accounts = await sr.entities.ConnectedAccount.filter({ provider: 'ebay', status: 'connected' }, '-created_date', 500);
    const now = Date.now();
    let notified = 0;
    for (const a of accounts) {
      const exp = a.token_expires_at ? Date.parse(a.token_expires_at) : NaN;
      if (Number.isNaN(exp)) continue;
      const days = (exp - now) / 864e5;
      if (days > WARN_DAYS) continue;
      const user = await sr.entities.User.get(a.created_by_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!user) continue;
      const lang = user.preferred_language || 'ne';
      const expired = exp <= now;
      const titleKey = expired ? 'tok_title_expired' : 'tok_title_soon';
      // One unread reminder per state: skip if the seller already has it.
      const open = await sr.entities.Notification.filter({ user_id: user.id, type: 'security', title_key: titleKey, read: false }, '-created_date', 1);
      if (open.length) continue;
      await notifyUser(sr, user, [mkEvent(lang, 'security', titleKey, {}, expired ? 'tok_msg_expired' : 'tok_msg_soon', { days: Math.max(1, Math.ceil(days)) }, { link: '/settings?focus=accounts' })]);
      notified++;
    }
    return Response.json({ checked: accounts.length, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}