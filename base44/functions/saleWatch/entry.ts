import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser } from '../../shared/notify.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const url = user.webhooks?.sale;
    let events = [];
    if (url) {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: user.email }), signal: AbortSignal.timeout(60000) });
      if (!res.ok) return Response.json({ error: `Sale Watch returned ${res.status}` }, { status: 502 });
      const data = await res.json();
      events = (data.events || []).filter((e) => ['sale', 'low_stock', 'marketing'].includes(e.type));
    } else {
      const orders = await base44.entities.Order.filter({ created_by_id: user.id, status: { $in: ['ordered', 'shipped', 'delivered'] } }, '-created_date', 5);
      const o = orders[0];
      if (o) {
        const units = Math.min(3, (o.quantity || 1) - (o.units_sold || 0));
        const profit = +(units * (o.unit_profit || 0)).toFixed(2);
        const sold = (o.units_sold || 0) + units;
        await base44.entities.Order.update(o.id, { units_sold: sold, realized_profit: +((o.realized_profit || 0) + profit).toFixed(2), status: sold >= o.quantity ? 'sold' : 'delivered' });
        events.push({ type: 'sale', title: `Sold ${units} × ${o.product_name}`, message: `You made $${profit} profit (demo).` });
        if (o.quantity - sold <= 5) events.push({ type: 'low_stock', title: `Low stock: ${o.product_name}`, message: `Only ${o.quantity - sold} units left. Consider reordering.` });
        if (orders[1]) events.push({ type: 'marketing', title: `Marketing push: ${orders[1].product_name}`, message: 'Views are down this week. Try a 10% promotion or better photos.' });
      }
    }
    if (events.length) await notifyUser(base44.asServiceRole, user, events);
    return Response.json({ events, demo: !url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}