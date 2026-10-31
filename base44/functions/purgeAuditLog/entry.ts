import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';

const DAYS = 90;

// Admin only. Deletes the caller's audit entries older than 90 days (the cutoff is always computed here, never taken from the
// client) and then writes ONE new entry saying how many were purged and by whom. Recent entries can never be deleted.
// Send { preview: true } to get the count and oldest date without deleting anything.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { preview } = await req.json().catch(() => ({}));

    const cutoff = new Date(Date.now() - DAYS * 86400000).toISOString();
    const query = { created_by_id: user.id, created_date: { $lt: cutoff } };
    const log = base44.asServiceRole.entities.AuditLog;
    const count = await log.count(query);
    const oldestPage = count ? await log.filter(query, { sort: 'created_date', limit: 1 }) : { items: [] };
    const oldest = oldestPage.items[0]?.created_date || null;
    if (preview || count === 0) return Response.json({ count, oldest, purged: 0 });

    let left = count;
    for (let i = 0; i < 40 && left > 0; i++) {
      await log.deleteMany(query);
      left = await log.count(query);
    }
    const purged = count - left;
    await base44.entities.AuditLog.create({
      action: 'audit_purged', actor_email: user.email, amount: purged,
      details: tr(user.preferred_language || 'ne', 'aud_purged', { n: purged, oldest: String(oldest).slice(0, 10), by: user.email }),
    });
    return Response.json({ count, oldest, purged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}