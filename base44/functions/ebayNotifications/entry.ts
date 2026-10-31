import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { notifyUser } from '../../shared/notify.ts';
import { applySale } from '../../shared/saleFlow.ts';
import { createReturnCase } from '../../shared/returns.ts';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256Hex = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const sameText = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
const SALE_STATUSES = ['ordered', 'shipped', 'delivered', 'at_risk'];

// Turns an eBay notification into { kind, itemId, ... }. Unknown topics are ignored (kind: null).
function normalize(body) {
  const topic = String(body?.metadata?.topic || body?.topic || body?.eventType || '').toUpperCase();
  const n = body?.notification || {};
  const d = n.data || body?.data || {};
  const li = d.lineItems?.[0] || {};
  let kind = null;
  if (/INR|NOT_RECEIVED/.test(topic)) kind = 'item_not_received';
  else if (/RETURN/.test(topic)) kind = 'return';
  else if (/MESSAGE|INQUIRY|CASE|CONTACT/.test(topic)) kind = 'buyer_message';
  else if (/SOLD|ORDER|SALE|PAID/.test(topic)) kind = 'sale';
  return {
    kind, topic, notificationId: String(n.notificationId || body?.notificationId || ''),
    itemId: String(d.itemId || d.legacyItemId || li.legacyItemId || li.itemId || ''),
    quantity: Math.max(1, Math.min(100, Math.floor(Number(d.quantity || li.quantity || 1)) || 1)),
    ebayOrderId: String(d.orderId || d.ebayOrderId || ''),
    caseId: String(d.returnId || d.caseId || d.inquiryId || d.messageId || n.notificationId || ''),
    message: String(d.message || d.messageText || d.comments || d.reason || d.text || ''),
  };
}

// eBay marketplace notification intake. Public endpoint: every call must carry the shared key (?k=) or come from the signed-in seller.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;
    const url = new URL(req.url);
    let token = '';
    try { token = secrets.get('EBAY_VERIFICATION_TOKEN') || ''; } catch { token = ''; }
    const k = url.searchParams.get('k') || '';
    const keyOk = token.length >= 32 && sameText(k, token);
    const session = keyOk ? null : await base44.auth.me().catch(() => null);

    // eBay's endpoint check: answer with sha256(challengeCode + verificationToken + endpoint).
    const challenge = url.searchParams.get('challenge_code');
    if (req.method === 'GET' && challenge) {
      if (!keyOk) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const origin = req.headers.get('x-base44-app-url') || url.origin;
      return Response.json({ challengeResponse: await sha256Hex(`${challenge}${token}${origin}/functions/ebayNotifications?k=${k}`) });
    }
    if (!keyOk && !session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const ev = normalize(await req.json().catch(() => ({})));
    if (!ev.kind) return Response.json({ ok: true, ignored: 'topic' });
    if (!/^[A-Za-z0-9-]{3,40}$/.test(ev.itemId)) return Response.json({ ok: true, ignored: 'item' });

    // Duplicate deliveries (eBay retries) are acknowledged without doing the work twice.
    const tag = ev.notificationId ? `${ev.kind}:${ev.notificationId}` : '';
    if (tag && (await sr.entities.AuditLog.filter({ action: 'ebay_event', details: tag }, '-created_date', 1)).length) return Response.json({ ok: true, duplicate: true });

    const listing = (await sr.entities.Listing.filter({ url: { $regex: `/itm/${ev.itemId}$` } }, '-created_date', 1))[0];
    if (!listing || (session && listing.created_by_id !== session.id)) return Response.json({ ok: true, ignored: 'unknown_item' });
    const user = session || await sr.entities.User.get(listing.created_by_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    const order = await sr.entities.Order.get(listing.order_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!user || !order) return Response.json({ ok: true, ignored: 'unknown_order' });

    let events = [];
    if (ev.kind === 'sale') {
      if (!SALE_STATUSES.includes(order.status) || (order.units_sold || 0) >= order.quantity) return Response.json({ ok: true, ignored: 'order_state' });
      const units = Math.min(ev.quantity, order.quantity - (order.units_sold || 0));
      events = await applySale(sr, user, order, units, false);
      if (ev.ebayOrderId) {
        const f = (await sr.entities.FulfillmentRecord.filter({ order_ref: order.id }, '-created_date', 1))[0];
        if (f && f.status !== 'uploaded') await sr.entities.FulfillmentRecord.update(f.id, { ebay_order_id: ev.ebayOrderId });
      }
    } else {
      if (ev.caseId && (await sr.entities.ReturnCase.filter({ user_id: user.id, ebay_case_id: ev.caseId, case_type: ev.kind }, '-created_date', 1)).length) return Response.json({ ok: true, duplicate: true });
      const r = await createReturnCase(sr, user, { caseType: ev.kind, orderRef: order.id, productName: order.product_name, itemId: ev.itemId, caseId: ev.caseId, message: ev.message });
      events = [r.event];
    }
    if (events.length) await notifyUser(sr, user, events);
    if (tag) await sr.entities.AuditLog.create({ action: 'ebay_event', actor_email: user.email, amount: 0, details: tag });
    return Response.json({ ok: true, kind: ev.kind, events: events.length });
  } catch (error) {
    console.error('ebayNotifications failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}