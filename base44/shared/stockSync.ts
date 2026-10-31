import { checkSupplierStock } from './saleFlow.ts';
import { setEbayQuantityZero } from './ebayTrading.ts';

const OUT = 'supplier_out_of_stock';

// For every active listing: read the supplier's stock (Supplier.stock_available, kept fresh by the supplier feed).
// At zero: set the eBay quantity to zero right away, pause the listing, and log a StockAlert (once per listing).
// A listing whose eBay update failed stays paused and is retried on the next run.
export async function syncStock(sr, user) {
  const listings = await sr.entities.Listing.filter({
    created_by_id: user.id,
    $or: [{ status: 'live' }, { status: 'paused', paused_reason: OUT, ebay_zeroed: { $ne: true } }],
  }, '-created_date', 200);
  let zeroed = 0, failed = 0;
  for (const l of listings) {
    const order = await sr.entities.Order.get(l.order_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!order) continue;
    const chk = await checkSupplierStock(sr, order);
    if (chk.state !== 'out') continue;
    const res = await setEbayQuantityZero(sr, user.id, l, order);
    const first = !l.stock_out_at;
    await sr.entities.Listing.update(l.id, { status: 'paused', paused_reason: OUT, ebay_zeroed: res.ok, ebay_note: res.note, stock_out_at: l.stock_out_at || new Date().toISOString() });
    if (first) await sr.entities.StockAlert.create({ user_id: user.id, order_id: order.id, product_name: order.product_name, kind: 'out', remaining: 0, incoming: 0, eta: '', read: false });
    if (res.ok) zeroed++; else failed++;
  }
  return { checked: listings.length, zeroed, failed };
}