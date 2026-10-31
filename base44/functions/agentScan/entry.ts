import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { syncStock } from '../../shared/stockSync.ts';
import { repriceListings } from '../../shared/repricing.ts';
import { scoreSuppliers } from '../../shared/supplierScore.ts';

// The agent scan: stock sync -> repricing guard -> supplier incident ranking.
// "Run now" (any signed-in seller) scans only that seller and never touches shared Supplier records.
// The "Agent Scan" workflow (every 2 hours) passes all:true, which needs an admin, and also re-scores suppliers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { all } = await req.json().catch(() => ({}));
    if (all === true && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const sr = base44.asServiceRole;
    const users = all === true ? await sr.entities.User.filter({}, '-created_date', 500) : [user];
    const out = [];
    for (const u of users) {
      const floor = Number(u.margin_floor ?? 12);
      const stock = await syncStock(sr, u);
      const price = await repriceListings(sr, u, floor);
      await sr.entities.AgentRun.create({ user_id: u.id, trigger: all === true ? 'scheduled' : 'manual', ran_at: new Date().toISOString(), stock_checked: stock.checked, stock_zeroed: stock.zeroed, repriced: price.adjusted, delisted: price.delisted });
      out.push({ stock, price });
    }
    // Shared Supplier records are only re-scored by the admin/scheduled run, never by a seller's "Run now".
    if (all === true) {
      const suppliers = await scoreSuppliers(sr);
      return Response.json({ users: out.length, suppliers });
    }
    return Response.json({ users: out.length, ...out[0] });
  } catch (error) {
    console.error('agentScan failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}