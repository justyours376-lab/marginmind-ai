import { mkEvent } from './notify.ts';

// Fresh read of the supplier record for this order's product. Unknown stock (field empty) never triggers the risk flow.
export async function checkSupplierStock(sr, order) {
  const rows = await sr.entities.Supplier.filter({ name: order.supplier_name, product_name: order.product_name }, '-rating', 1);
  const s = rows[0];
  if (!s || typeof s.stock_available !== 'number') return { state: 'unknown' };
  return { state: s.stock_available > 0 ? 'in_stock' : 'out', available: s.stock_available };
}

// Out of stock: mark the order at_risk, pause the user's other live listings of the same product, return a critical event.
async function stockRisk(sr, user, order, status) {
  const chk = await checkSupplierStock(sr, order);
  if (chk.state !== 'out') return [];
  const lang = user.preferred_language || 'ne';
  await sr.entities.Order.update(order.id, { status: 'at_risk', previous_status: status, risk_reason: 'supplier_out_of_stock' });
  const live = await sr.entities.Listing.filter({ created_by_id: user.id, product_id: order.product_id, status: 'live' }, '-created_date', 200);
  const others = live.filter((l) => l.order_id !== order.id);
  if (others.length) await sr.entities.Listing.bulkUpdate(others.map((l) => ({ id: l.id, status: 'paused', paused_reason: 'supplier_out_of_stock' })));
  return [mkEvent(lang, 'stock_risk', 'risk_title', { name: order.product_name }, 'risk_msg', { supplier: order.supplier_name, n: others.length }, { severity: 'critical', link: `/orders?focus=order-${order.id}` })];
}

// Records units sold on an order, then immediately re-checks the supplier's stock. Returns the notification events to send.
export async function applySale(sr, user, order, units, demo) {
  const lang = user.preferred_language || 'ne';
  const pct = Number(user.returns_reserve ?? 5);
  const gross = +(units * (order.unit_profit || 0)).toFixed(2);
  const reserve = +(units * (order.sell_price || 0) * pct / 100).toFixed(2);
  const sold = (order.units_sold || 0) + units;
  const wasRisk = order.status === 'at_risk';
  const status = wasRisk ? 'at_risk' : sold >= order.quantity ? 'sold' : 'delivered';
  await sr.entities.Order.update(order.id, { units_sold: sold, realized_profit: +((order.realized_profit || 0) + gross).toFixed(2), realized_reserve: +((order.realized_reserve || 0) + reserve).toFixed(2), status });
  const sfx = demo ? '' : '_r';
  const net = +(gross - reserve).toFixed(2);
  const events = [mkEvent(lang, 'sale', `sale_title${sfx}`, { units, name: order.product_name }, `sale_msg${sfx}`, { gross, net, pct }, { link: `/orders?focus=order-${order.id}` })];
  if ((order.quantity || 0) - sold <= 5) events.push(mkEvent(lang, 'low_stock', `low_title${sfx}`, { name: order.product_name }, `low_msg${sfx}`, { n: order.quantity - sold }, { link: `/stock?focus=stock-${order.id}` }));
  if (!wasRisk) events.push(...await stockRisk(sr, user, order, status));
  return events;
}