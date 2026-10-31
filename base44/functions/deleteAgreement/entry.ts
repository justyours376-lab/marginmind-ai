import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';

// Deletes one Agreement (admin only) and writes the deletion to the AuditLog with the supplier name and status.
// Uses the caller's own access, so the Agreement ownership rules still apply.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await req.json().catch(() => ({}));
    if (!id || typeof id !== 'string') return Response.json({ error: 'id is required' }, { status: 400 });
    const agreement = await base44.entities.Agreement.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!agreement) return Response.json({ error: 'Not found' }, { status: 404 });
    const supplier = agreement.supplier_ref
      ? await base44.entities.Supplier.get(agreement.supplier_ref).catch((e) => (e.status === 404 ? null : Promise.reject(e)))
      : null;
    const lang = user.preferred_language || 'ne';
    const today = new Date().toISOString().slice(0, 10);
    const status = agreement.status === 'signed' && agreement.expiry_date && agreement.expiry_date < today ? 'expired' : agreement.status || 'draft';
    await base44.entities.Agreement.delete(id);
    await base44.entities.AuditLog.create({
      action: 'agreement_deleted', actor_email: user.email, amount: 0,
      details: tr(lang, 'aud_agr_deleted', { supplier: supplier?.name || agreement.supplier_ref || '-', status }) + (agreement.is_test ? tr(lang, 'aud_agr_test') : ''),
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}