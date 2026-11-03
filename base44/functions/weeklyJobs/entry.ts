import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { notifyUser } from '../../shared/notify.ts';
import { tr } from '../../shared/msgs.ts';
import { runSslStep } from '../../shared/sslCheck.ts';

const SSL_DOMAIN_URL = 'https://marginmindai.goodluckinnovations.com';

// job: 'report' (Mon 7:30), America/Phoenix. Called by the Weekly Report workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { job } = await req.json();
    const sr = base44.asServiceRole;
    // SSL certificate expiry step: started now (the lookup takes a minute or two), awaited after the reports are sent.
    const sslRun = runSslStep(sr, new URL(SSL_DOMAIN_URL).hostname).catch((err) => {
      console.log('weeklyJobs ssl: step failed', String(err.message || err).slice(0, 120));
      return { cert_days_remaining: null, cert_check_failed: true, error: 'step_failed' };
    });
    const users = await sr.entities.User.list();
    let count = 0;
    for (const u of users) {
      const lang = u.preferred_language || 'ne';
      {
        const orders = await sr.entities.Order.filter({ created_by_id: u.id, status: { $in: ['ordered', 'shipped', 'delivered', 'sold', 'at_risk'] } }, '-created_date', 100);
        if (!orders.length) continue;
        const gross = orders.reduce((s, o) => s + (o.realized_profit || 0), 0);
        const reserve = orders.reduce((s, o) => s + (o.realized_reserve || 0), 0);
        const stock = orders.filter((o) => o.status !== 'sold').map((o) => tr(lang, 'stock_item', { name: o.product_name, n: (o.quantity || 0) - (o.units_sold || 0) })).join('; ');
        await notifyUser(sr, u, [{ type: 'report', title: tr(lang, 'report_title'), message: tr(lang, 'report_msg', { gross: gross.toFixed(2), net: (gross - reserve).toFixed(2), pct: u.returns_reserve ?? 5, stock: stock || tr(lang, 'all_sold') }), link: '/stock' }]);
      }
      count++;
    }
    const ssl = await sslRun;
    return Response.json({ job, users: count, ssl });
  } catch (error) {
    console.error('weeklyJobs failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}