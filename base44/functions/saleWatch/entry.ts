import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser, mkEvent } from '../../shared/notify.ts';
import { applySale } from '../../shared/saleFlow.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const lang = user.preferred_language || 'ne';
    const sr = base44.asServiceRole;
    const events = [];
    // Demo simulation: ONLY demo orders may be touched, never real ones. Real sales arrive through ebayNotifications.
    const orders = await base44.entities.Order.filter({ created_by_id: user.id, demo: true, status: { $in: ['ordered', 'shipped', 'delivered'] } }, '-created_date', 5);
    const o = orders[0];
    if (o) {
      const units = Math.min(3, (o.quantity || 1) - (o.units_sold || 0));
      if (units > 0) events.push(...await applySale(sr, user, o, units, true));
      if (orders[1]) events.push(mkEvent(lang, 'marketing', 'mkt_title', { name: orders[1].product_name }, 'mkt_msg', {}, { link: `/orders?focus=order-${orders[1].id}` }));
    }
    if (events.length) await notifyUser(sr, user, events);
    return Response.json({ events, demo: true });
  } catch (error) {
    console.error('saleWatch failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}