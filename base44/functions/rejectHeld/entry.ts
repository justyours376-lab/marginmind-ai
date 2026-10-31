import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';
import { reasonText } from '../../shared/compliance.ts';

// Rejects a listing held for manual review: logs the rejection (with the hold reason) to the append-only audit log,
// then removes the held record permanently.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const lang = user.preferred_language || 'ne';
    const { screening_id } = await req.json();
    const held = screening_id ? await base44.entities.ProductScreening.get(screening_id).catch(() => null) : null;
    if (!held || held.created_by_id !== user.id || held.status !== 'manual_review') return Response.json({ code: 'invalid' });
    const reasons = String(held.reasons || '').split(',').filter(Boolean);
    await base44.entities.AuditLog.create({
      action: 'held_rejected', actor_email: user.email, amount: 0,
      details: tr(lang, 'aud_held_rejected', { name: held.product_name, reasons: reasonText(lang, reasons) }),
    });
    await base44.entities.ProductScreening.delete(held.id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('rejectHeld failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}