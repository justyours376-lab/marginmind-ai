import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';

// The user marks a supplier payment as paid (they paid in the supplier's own portal) and enters the supplier order id.
// Record-only: this function never moves money.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { ledger_id, supplier_order_id } = await req.json().catch(() => ({}));
    const sid = String(supplier_order_id || '').trim();
    if (!ledger_id || !/^[A-Za-z0-9._# -]{2,60}$/.test(sid)) return Response.json({ error: 'Invalid input' }, { status: 400 });
    const ledger = await base44.entities.PaymentLedger.get(ledger_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!ledger || ledger.created_by_id !== user.id || ledger.direction !== 'paid_to_supplier') return Response.json({ error: 'Not found' }, { status: 404 });
    if (ledger.status !== 'pending') return Response.json({ code: 'already_paid' });

    const today = new Date().toISOString().slice(0, 10);
    const updated = await base44.entities.PaymentLedger.update(ledger.id, { status: 'paid', paid_date: today });
    const f = (await base44.entities.FulfillmentRecord.filter({ order_ref: ledger.order_ref, created_by_id: user.id }, '-created_date', 1))[0];
    const fulfillment = f
      ? await base44.entities.FulfillmentRecord.update(f.id, { supplier_order_id: sid })
      : await base44.entities.FulfillmentRecord.create({ order_ref: ledger.order_ref, status: 'awaiting_tracking', supplier_order_id: sid });
    await base44.entities.Order.update(ledger.order_ref, { supplier_paid: true, cash_flow_status: 'float_out' });
    await base44.entities.AuditLog.create({ action: 'payment_marked_paid', actor_email: user.email, amount: ledger.amount, details: tr(user.preferred_language || 'ne', 'aud_marked_paid', { id: ledger.order_ref, sid }) });
    return Response.json({ ledger: updated, fulfillment });
  } catch (error) {
    console.error('recordPayment failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}