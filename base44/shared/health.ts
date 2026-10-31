import { readCreds } from './ebayFulfillment.ts';
import { notifyUser, mkEvent } from './notify.ts';

export const WATCH_AT = 1.5, CRITICAL_AT = 1.8; // TDR % thresholds
const pct = (m) => (m?.numerator != null && m?.denominator > 0 ? +((m.numerator / m.denominator) * 100).toFixed(2) : typeof m?.value?.value === 'number' ? +(m.value.value * 100).toFixed(2) : null);

// Pulls the seller standards profile from eBay's Analytics API. Returns null when eBay is not connected.
async function fetchEbayMetrics(sr, userId) {
  const acct = (await sr.entities.ConnectedAccount.filter({ created_by_id: userId, provider: 'ebay', status: 'connected' }, '-created_date', 1))[0];
  if (!acct?.encrypted_credentials) return null;
  const token = (await readCreds(acct.encrypted_credentials)).oauth_token;
  if (!token) return null;
  const res = await fetch('https://api.ebay.com/sell/analytics/v1/seller_standards_profile/PROGRAM_US/CURRENT', {
    headers: { Authorization: `Bearer ${token}`, 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' }, signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`eBay answered ${res.status}`);
  const body = await res.json();
  const find = (re) => (body.metrics || []).find((m) => re.test(m.metricKey || ''));
  await sr.entities.ConnectedAccount.update(acct.id, { connection_verified: true, last_verified_at: new Date().toISOString() });
  return {
    tdr_percent: pct(find(/TRANSACTION_DEFECT/)), late_shipment_percent: pct(find(/SHIPPING_MISS|LATE_SHIP/)), tracking_uploaded_percent: pct(find(/TRACKING/)),
    cases_closed_without_resolution: find(/CASES_CLOSED/)?.numerator ?? null, seller_level: body.standardsLevel || '', source: 'ebay',
  };
}

export const statusFor = (tdr) => (tdr >= CRITICAL_AT ? 'critical' : tdr >= WATCH_AT ? 'watch' : 'healthy');
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Math.min(100, Math.max(0, Number(v))));

// One health snapshot for one seller. `manual` = metrics typed in by the seller (used when they read them from Seller Hub).
export async function takeSnapshot(sr, user, manual) {
  const m = manual
    ? { tdr_percent: num(manual.tdr_percent), late_shipment_percent: num(manual.late_shipment_percent), tracking_uploaded_percent: num(manual.tracking_uploaded_percent), seller_level: String(manual.seller_level || '').slice(0, 40), source: 'manual' }
    : await fetchEbayMetrics(sr, user.id);
  if (!m) return { skipped: 'ebay_not_connected' };
  if (m.tdr_percent == null) return { skipped: 'no_tdr' };
  const status = statusFor(m.tdr_percent);
  const prev = (await sr.entities.AccountHealthSnapshot.filter({ user_id: user.id }, '-created_date', 1))[0];
  const today = new Date().toISOString().slice(0, 10);
  await sr.entities.AccountHealthSnapshot.create({ ...Object.fromEntries(Object.entries(m).filter(([, v]) => v != null)), user_id: user.id, snapshot_date: today, alert_status: status });

  let paused = 0;
  if (status === 'critical') {
    const pending = await sr.entities.Order.filter({ created_by_id: user.id, status: 'awaiting_approval', paused: { $ne: true } }, '-created_date', 200);
    if (pending.length) await sr.entities.Order.bulkUpdate(pending.map((o) => ({ id: o.id, paused: true, paused_reason: 'account health' })));
    paused = pending.length;
    if (prev?.alert_status !== 'critical') {
      const lang = user.preferred_language || 'ne';
      await notifyUser(sr, user, [mkEvent(lang, 'security', 'health_title', {}, 'health_msg', { tdr: m.tdr_percent }, { severity: 'critical', link: '/?focus=tile-health' })]);
    }
  } else {
    const held = await sr.entities.Order.filter({ created_by_id: user.id, paused: true, paused_reason: 'account health' }, '-created_date', 200);
    if (held.length) await sr.entities.Order.bulkUpdate(held.map((o) => ({ id: o.id, paused: false, paused_reason: '' })));
  }
  return { status, tdr: m.tdr_percent, paused };
}