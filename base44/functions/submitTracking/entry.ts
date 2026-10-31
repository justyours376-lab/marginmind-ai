import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';
import { uploadTracking } from '../../shared/ebayFulfillment.ts';

// The user pastes the supplier's tracking number. We save it, try the eBay fulfillment upload, and record
// whether it reached eBay and whether that happened within the handling time.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { fulfillment_id, tracking_number, carrier } = await req.json().catch(() => ({}));
    const tn = String(tracking_number || '').replace(/\s+/g, '');
    const car = String(carrier || '').trim().slice(0, 40);
    if (!fulfillment_id || !/^[A-Za-z0-9-]{6,40}$/.test(tn)) return Response.json({ error: 'Invalid input' }, { status: 400 });
    const f = await base44.entities.FulfillmentRecord.get(fulfillment_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!f || f.created_by_id !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });
    if (f.status === 'uploaded') return Response.json({ code: 'already_uploaded' });
    const ledger = (await base44.entities.PaymentLedger.filter({ order_ref: f.order_ref, created_by_id: user.id, direction: 'paid_to_supplier' }, '-created_date', 1))[0];
    if (!ledger || ledger.status !== 'paid') return Response.json({ code: 'not_paid' });
    const order = await base44.entities.Order.get(f.order_ref).catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    const now = new Date();
    const up = await uploadTracking(base44.asServiceRole, user.id, order, f, tn, car);
    const withinTime = up.ok && (!f.handling_deadline || now.getTime() <= Date.parse(f.handling_deadline));
    const fulfillment = await base44.entities.FulfillmentRecord.update(f.id, {
      tracking_number: tn, carrier: car, shipped_date: now.toISOString().slice(0, 10),
      uploaded_to_ebay: up.ok, ...(up.ok ? { uploaded_at: now.toISOString() } : {}), uploaded_within_handling_time: withinTime,
      upload_note: up.note, status: up.ok ? 'uploaded' : 'upload_failed',
    });
    if (order) await base44.entities.Order.update(order.id, { tracking_uploaded: up.ok, ...(order.status === 'ordered' ? { status: 'shipped' } : {}) });
    await base44.entities.AuditLog.create({ action: 'tracking_added', actor_email: user.email, amount: 0, details: tr(user.language || 'ne', 'aud_tracking', { id: f.order_ref, result: up.note }) });
    return Response.json({ fulfillment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}