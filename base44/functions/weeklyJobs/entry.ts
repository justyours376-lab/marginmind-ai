import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser } from '../../shared/notify.ts';
import { tr } from '../../shared/msgs.ts';

// job: 'report' (Mon 7:30), America/Phoenix. Called by the Weekly Report workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { job } = await req.json();
    const sr = base44.asServiceRole;
    const users = await sr.entities.User.list();
    let count = 0;
    for (const u of users) {
      const lang = u.language || 'ne';
      {
        const orders = await sr.entities.Order.filter({ created_by_id: u.id, status: { $in: ['ordered', 'shipped', 'delivered', 'sold'] } }, '-created_date', 100);
        if (!orders.length) continue;
        const gross = orders.reduce((s, o) => s + (o.realized_profit || 0), 0);
        const reserve = orders.reduce((s, o) => s + (o.realized_reserve || 0), 0);
        const stock = orders.filter((o) => o.status !== 'sold').map((o) => tr(lang, 'stock_item', { name: o.product_name, n: (o.quantity || 0) - (o.units_sold || 0) })).join('; ');
        await notifyUser(sr, u, [{ type: 'report', title: tr(lang, 'report_title'), message: tr(lang, 'report_msg', { gross: gross.toFixed(2), net: (gross - reserve).toFixed(2), pct: u.returns_reserve ?? 5, stock: stock || tr(lang, 'all_sold') }) }]);
      }
      count++;
    }
    return Response.json({ job, users: count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}