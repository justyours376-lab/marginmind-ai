import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser } from '../../shared/notify.ts';
import { tr } from '../../shared/msgs.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const lang = user.language || 'ne';
    const pct = Number(user.returns_reserve ?? 5);
    const events = [];
    {
      // Demo simulation: ONLY demo orders may be touched, never real ones.
      const orders = await base44.entities.Order.filter({ created_by_id: user.id, demo: true, status: { $in: ['ordered', 'shipped', 'delivered'] } }, '-created_date', 5);
      const o = orders[0];
      if (o) {
        const units = Math.min(3, (o.quantity || 1) - (o.units_sold || 0));
        if (units > 0) {
          const gross = +(units * (o.unit_profit || 0)).toFixed(2);
          const reserve = +(units * (o.sell_price || 0) * pct / 100).toFixed(2);
          const sold = (o.units_sold || 0) + units;
          await base44.entities.Order.update(o.id, { units_sold: sold, realized_profit: +((o.realized_profit || 0) + gross).toFixed(2), realized_reserve: +((o.realized_reserve || 0) + reserve).toFixed(2), status: sold >= o.quantity ? 'sold' : 'delivered' });
          events.push({ type: 'sale', title: tr(lang, 'sale_title', { units, name: o.product_name }), message: tr(lang, 'sale_msg', { gross, net: +(gross - reserve).toFixed(2), pct }) });
          if (o.quantity - sold <= 5) events.push({ type: 'low_stock', title: tr(lang, 'low_title', { name: o.product_name }), message: tr(lang, 'low_msg', { n: o.quantity - sold }) });
        }
        if (orders[1]) events.push({ type: 'marketing', title: tr(lang, 'mkt_title', { name: orders[1].product_name }), message: tr(lang, 'mkt_msg') });
      }
    }
    if (events.length) await notifyUser(base44.asServiceRole, user, events);
    return Response.json({ events, demo: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}