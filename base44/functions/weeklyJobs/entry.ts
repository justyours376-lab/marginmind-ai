import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser } from '../../shared/notify.ts';

// job: 'report' (Mon 7:30) | 'scan' (Mon 8:00). Called by workflows.
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
      if (job === 'scan') {
        await sr.entities.Notification.create({ user_id: u.id, type: 'scan', title: 'Weekly trend scan ready', message: 'Open Chat and pick a niche to see this week\'s 12 products.', read: false });
      } else {
        const orders = await sr.entities.Order.filter({ created_by_id: u.id }, '-created_date', 100);
        if (!orders.length) continue;
        const profit = orders.reduce((s, o) => s + (o.realized_profit || 0), 0).toFixed(2);
        const stock = orders.filter((o) => o.status !== 'sold').map((o) => `${o.product_name}: ${(o.quantity || 0) - (o.units_sold || 0)} left`).join('; ');
        await notifyUser(sr, u, [{ type: 'report', title: 'Weekly stock & profit report', message: `Total profit so far: $${profit}. Stock: ${stock || 'all sold'}.` }]);
      }
      count++;
    }
    return Response.json({ job, users: count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}