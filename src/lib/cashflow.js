import { base44 } from '@/api/base44Client';

// Card float exposure = supplier payments marked paid minus eBay payouts received (from the PaymentLedger).
export async function loadCashflow(userId) {
  const [out, back] = await Promise.all([
    base44.entities.PaymentLedger.aggregate({ query: { created_by_id: userId, direction: 'paid_to_supplier', status: 'paid' }, sum: ['amount'] }),
    base44.entities.PaymentLedger.aggregate({ query: { created_by_id: userId, direction: 'payout_received', status: { $in: ['paid', 'settled'] } }, sum: ['amount'] }),
  ]);
  const paid = out.rows?.[0]?.sum_amount || 0, payouts = back.rows?.[0]?.sum_amount || 0;
  return { paid, payouts, exposure: paid - payouts };
}