import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const r2 = (n) => Math.round(n * 100) / 100;
const dayMs = 86400000;

// Sales + stock overview built ONLY from the signed-in user's own Order, Listing and Supplier records.
// It creates/reads notification records in its own StockAlert table (service role, always scoped to this user).
// It never orders, re-prices, pauses or changes any existing record: information and alerts only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const alertsDb = base44.asServiceRole.entities.StockAlert;

    if (body.action === 'markRead') {
      const a = body.alert_id ? await alertsDb.get(body.alert_id).catch(() => null) : null;
      if (!a || a.user_id !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });
      await alertsDb.update(a.id, { read: true });
      return Response.json({ ok: true });
    }

    const [orders, listings] = await Promise.all([
      base44.entities.Order.filter({ created_by_id: user.id, status: { $in: ['ordered', 'shipped', 'delivered', 'sold', 'at_risk'] } }, '-created_date', 100),
      base44.entities.Listing.filter({ created_by_id: user.id, status: 'live' }, '-created_date', 200),
    ]);
    const live = new Set(listings.map((l) => l.order_id));
    const names = [...new Set(orders.map((o) => o.supplier_name).filter(Boolean))];
    const sups = names.length ? await base44.entities.Supplier.filter({ name: { $in: names } }, '-rating', 500) : [];

    const items = orders.map((o) => {
      const qty = Number(o.quantity) || 0, sold = Number(o.units_sold) || 0;
      // An at_risk order keeps counting as whatever it was before it was flagged.
      const st = o.status === 'at_risk' ? (o.previous_status || 'delivered') : o.status;
      const incoming = ['ordered', 'shipped'].includes(st) ? qty : 0;
      const onHand = ['delivered', 'sold'].includes(st) ? Math.max(0, qty - sold) : 0;
      const sup = sups.find((s) => s.name === o.supplier_name && s.product_name === o.product_name);
      const days = typeof sup?.delivery_days_us === 'number' ? sup.delivery_days_us : null;
      const eta = incoming && days !== null && o.created_date ? new Date(new Date(o.created_date).getTime() + days * dayMs).toISOString().slice(0, 10) : null;
      const lowAt = Math.max(3, Math.ceil(qty * 0.2));
      const state = incoming > 0 ? 'upcoming' : onHand === 0 ? 'out' : onHand <= lowAt ? 'low' : 'ok';
      const net = r2((Number(o.realized_profit) || 0) - (Number(o.realized_reserve) || 0));
      return {
        order_id: o.id, product_name: o.product_name, image_url: o.image_url, supplier_name: o.supplier_name, status: o.status,
        listing_live: live.has(o.id), ordered_qty: qty, units_sold: sold, revenue: r2(sold * (Number(o.sell_price) || 0)),
        net_profit: net, on_hand: onHand, incoming, eta, state,
      };
    });

    // Notifications only: one alert per (order, kind). Nothing else happens automatically.
    const existing = await alertsDb.filter({ user_id: user.id }, '-created_date', 500);
    const have = new Set(existing.map((a) => `${a.order_id}:${a.kind}`));
    const fresh = items.filter((i) => i.state !== 'ok' && !have.has(`${i.order_id}:${i.state}`))
      .map((i) => ({ user_id: user.id, order_id: i.order_id, product_name: i.product_name, kind: i.state, remaining: i.on_hand, incoming: i.incoming, eta: i.eta || '', read: false }));
    const created = fresh.length ? await alertsDb.bulkCreate(fresh) : [];
    const alerts = [...created, ...existing].sort((a, b) => String(b.created_date).localeCompare(String(a.created_date))).slice(0, 20)
      .map((a) => ({ id: a.id, kind: a.kind, product_name: a.product_name, remaining: a.remaining, incoming: a.incoming, eta: a.eta || null, read: !!a.read, created_date: a.created_date }));

    const totals = { units_sold: items.reduce((s, i) => s + i.units_sold, 0), revenue: r2(items.reduce((s, i) => s + i.revenue, 0)), net_profit: r2(items.reduce((s, i) => s + i.net_profit, 0)) };
    return Response.json({ items, alerts, totals, source: 'records' });
  } catch (error) {
    console.error('stockSales failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}