import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v, max) => String(v ?? '').trim().slice(0, max);

// Comma separated text or an array -> clean, de-duplicated brand list.
function brandList(v) {
  const raw = Array.isArray(v) ? v : String(v ?? '').split(',');
  const seen = new Set();
  return raw.map((b) => str(b, 60)).filter((b) => b && !seen.has(b.toLowerCase()) && seen.add(b.toLowerCase())).slice(0, 50);
}

// Creates or edits an Agreement (admin only). Validates, asks for confirmation when screening-critical details are missing,
// and writes every create / edit / sign to the AuditLog. Existing screening rules read the saved record unchanged.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const lang = user.preferred_language || 'ne';
    const { id, data = {}, sign, confirmed } = await req.json().catch(() => ({}));

    let prev = null;
    if (id) {
      prev = await base44.entities.Agreement.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!prev || prev.created_by_id !== user.id) return Response.json({ error: 'Not found' }, { status: 404 });
    }
    const pick = (k, clean) => (k in data ? clean(data[k]) : prev?.[k]);
    const today = new Date().toISOString().slice(0, 10);
    const next = {
      supplier_ref: pick('supplier_ref', (v) => str(v, 64)),
      status: sign ? 'signed' : pick('status', (v) => (v === 'signed' ? 'signed' : 'draft')) || 'draft',
      signed_date: pick('signed_date', (v) => str(v, 10)),
      expiry_date: pick('expiry_date', (v) => str(v, 10)),
      dispatch_time_days: pick('dispatch_time_days', (v) => (v === '' || v == null ? null : Number(v))),
      authorized_brands: pick('authorized_brands', brandList) || [],
      payment_terms: pick('payment_terms', (v) => str(v, 1000)),
      document_ref: pick('document_ref', (v) => str(v, 500)),
      resale_certificate_uri: pick('resale_certificate_uri', (v) => str(v, 500)),
      agreement_document_uri: pick('agreement_document_uri', (v) => str(v, 500)),
      is_test: pick('is_test', (v) => v === true),
    };

    const supplier = next.supplier_ref ? await base44.entities.Supplier.get(next.supplier_ref).catch((e) => (e.status === 404 ? null : Promise.reject(e))) : null;
    if (!supplier) return Response.json({ code: 'supplier_required' });
    if ([next.signed_date, next.expiry_date].some((d) => d && !DATE.test(d))) return Response.json({ code: 'bad_date' });
    const dd = next.dispatch_time_days;
    if (dd != null && !(Number.isInteger(dd) && dd >= 1 && dd <= 60)) return Response.json({ code: 'bad_dispatch' });
    if (next.status === 'signed') {
      next.signed_date = next.signed_date || today;
      if (next.expiry_date && next.expiry_date < today) return Response.json({ code: 'expiry_past' });
      if (next.expiry_date && next.expiry_date < next.signed_date) return Response.json({ code: 'expiry_before_signed' });
    }

    // Warn before saving details that products need in order to pass screening.
    const warnings = [];
    if (dd == null) warnings.push('dispatch');
    if (!next.authorized_brands.length) warnings.push('brands');
    if (warnings.length && confirmed !== true) return Response.json({ needs_confirm: true, warnings });

    const wasSigned = prev?.status === 'signed';
    const expiryChanged = (prev?.expiry_date || '') !== (next.expiry_date || '');
    const saved = prev
      ? await base44.entities.Agreement.update(prev.id, { ...next, ...(expiryChanged || !wasSigned ? { expiry_warned: false } : {}) })
      : await base44.entities.Agreement.create({ ...next, status: next.status, expiry_warned: false });

    const tag = next.is_test ? tr(lang, 'aud_agr_test') : '';
    const log = (action, details) => base44.entities.AuditLog.create({ action, actor_email: user.email, amount: 0, details: details + tag });
    const brands = next.authorized_brands.join(', ') || '-';
    const becameSigned = next.status === 'signed' && !wasSigned;
    if (!prev) await log('agreement_created', tr(lang, 'aud_agr_created', { supplier: supplier.name }));
    if (becameSigned) await log('agreement_signed', tr(lang, 'aud_agr_signed', { supplier: supplier.name, expiry: next.expiry_date || '-', dispatch: dd ?? '-', brands }));
    if (prev && !becameSigned) {
      const changes = Object.keys(next).filter((k) => JSON.stringify(next[k] ?? null) !== JSON.stringify(prev[k] ?? null)).map((k) => tr(lang, `fl_${k}`));
      await log('agreement_updated', tr(lang, 'aud_agr_updated', { supplier: supplier.name, changes: changes.join(', ') || '-' }));
    }
    return Response.json({ agreement: saved, warnings });
  } catch (error) {
    console.error('saveAgreement failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}