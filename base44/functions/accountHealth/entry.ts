import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { takeSnapshot } from '../../shared/health.ts';

// Daily seller-health snapshot (the "Account Health" workflow passes all:true, which needs an admin).
// A signed-in seller can also run it for themselves, optionally with metrics read from Seller Hub (metrics: { tdr_percent, ... }).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { all, metrics } = await req.json().catch(() => ({}));
    if (all === true && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const sr = base44.asServiceRole;
    if (all !== true) return Response.json(await takeSnapshot(sr, user, metrics && typeof metrics === 'object' ? metrics : null));
    const users = await sr.entities.User.filter({}, '-created_date', 500);
    const results = [];
    for (const u of users) {
      try { results.push(await takeSnapshot(sr, u, null)); } catch (e) { console.log('health failed', u.id, e.message); results.push({ error: true }); }
    }
    return Response.json({ users: users.length, snapshots: results.filter((r) => r.status).length, critical: results.filter((r) => r.status === 'critical').length });
  } catch (error) {
    console.error('accountHealth failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}