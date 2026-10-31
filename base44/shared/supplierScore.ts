const DAYS = 90;
export const REVIEW_ABOVE = 2; // more than 2 incidents => review

// Ranks suppliers by incidents in the last 90 days and flags any supplier with more than 2 as "review".
// Defect = return or item-not-received case. Late = tracking uploaded after the handling time, or still missing after the deadline
// (only once the supplier was paid). Stock mismatch = an order or listing where the supplier ran out of stock after listing.
export async function scoreSuppliers(sr) {
  const since = new Date(Date.now() - DAYS * 864e5).toISOString();
  const [orders, cases, ful, outListings] = await Promise.all([
    sr.entities.Order.filter({ created_date: { $gte: since } }, '-created_date', 1000),
    sr.entities.ReturnCase.filter({ case_type: { $in: ['return', 'item_not_received'] }, created_date: { $gte: since } }, '-created_date', 1000),
    sr.entities.FulfillmentRecord.filter({ created_date: { $gte: since } }, '-created_date', 1000),
    sr.entities.Listing.filter({ stock_out_at: { $gte: since } }, '-created_date', 1000),
  ]);
  const supOf = Object.fromEntries(orders.map((o) => [o.id, o.supplier_name]).filter(([, s]) => s));
  const tally = {};
  const bump = (orderId, key) => { const s = supOf[orderId]; if (s) (tally[s] ||= { d: 0, l: 0, s: 0 })[key]++; };
  cases.forEach((c) => bump(c.order_ref, 'd'));
  const now = Date.now();
  ful.forEach((f) => {
    const late = f.status === 'uploaded' ? f.uploaded_within_handling_time === false : !!f.supplier_order_id && !!f.handling_deadline && Date.parse(f.handling_deadline) < now;
    if (late) bump(f.order_ref, 'l');
  });
  const mismatch = new Set([...orders.filter((o) => o.risk_reason === 'supplier_out_of_stock').map((o) => o.id), ...outListings.map((l) => l.order_id)]);
  mismatch.forEach((id) => bump(id, 's'));

  const rows = await sr.entities.Supplier.filter({ $or: [{ name: { $in: Object.keys(tally) } }, { review_status: 'review' }] }, '-created_date', 1000);
  const stamp = new Date().toISOString();
  const updates = rows.map((r) => {
    const t = tally[r.name] || { d: 0, l: 0, s: 0 }, total = t.d + t.l + t.s;
    return { id: r.id, incident_defects: t.d, incident_late: t.l, incident_stock: t.s, incident_total: total, review_status: total > REVIEW_ABOVE ? 'review' : 'ok', incidents_updated_at: stamp };
  });
  if (updates.length) await sr.entities.Supplier.bulkUpdate(updates);
  return { suppliers: updates.length, review: updates.filter((u) => u.review_status === 'review').length };
}