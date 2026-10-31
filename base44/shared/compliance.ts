// Compliance gate (server-side only). Hard reject rules applied before anything can be listed or ordered:
//  1. The source must be a wholesaler/distributor with a signed, unexpired Agreement (never a retailer or marketplace).
//  2. Brands that need eBay VeRO authorization must be listed in Agreement.authorized_brands.
//  3. The listing handling time comes FROM Agreement.dispatch_time_days (never lower), and the supplier's proven
//     dispatch time (real tracking uploads) must not exceed it.
//  4. Listing titles/descriptions (including any LLM-generated text) are scanned; suspicious text goes to manual review.
// Every rejection is written to the AuditLog.
import { ebayViolations } from './ebayPolicy.ts';
import { businessDaysBetween } from './dates.ts';
import { tr } from './msgs.ts';

const RETAIL = ['amazon', 'walmart', 'target', 'temu', 'aliexpress', 'ebay'];
const RETAIL_NAME = new RegExp(`(^|[^a-z0-9])(${RETAIL.join('|')})($|[^a-z0-9])`, 'i');
const RETAIL_HOST = new RegExp(`(^|\\.)(${RETAIL.join('|')})\\.`, 'i');

function hostOf(url: unknown): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try { return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname; } catch { return raw; }
}

// A retailer or marketplace: named like one, hosted on one, or not recorded as a wholesaler/distributor.
export function isRetailSource(s: any): boolean {
  return !['wholesaler', 'distributor'].includes(String(s?.business_type || '').toLowerCase())
    || RETAIL_NAME.test(String(s?.name || ''))
    || RETAIL_HOST.test(hostOf(s?.website));
}

// Hardcoded, best-effort list of brands that need eBay VeRO authorization. Extend it as new brands are sold.
const VERO_BRANDS = [
  'nike', 'adidas', 'under armour', 'champion', 'levi', 'hanes', 'carhartt', 'fruit of the loom', 'wilson', 'hydro flask', 'yeti',
  'neutrogena', 'cerave', 'maybelline', 'l oreal', 'olay', 'yankee candle', 'rubbermaid', 'pyrex', 'oxo', 'command',
  'apple', 'samsung', 'sony', 'bose', 'beats', 'gopro', 'canon', 'nintendo', 'fitbit', 'garmin', 'dyson', 'dewalt',
  'disney', 'lego', 'chanel', 'gucci', 'louis vuitton', 'rolex', 'pandora', 'ray ban', 'oakley', 'coach', 'prada', 'hermes',
];
const words = (s: unknown) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;

export function veroBrand(name: string): string | null {
  const hay = words(name);
  return VERO_BRANDS.find((b) => hay.includes(words(b))) || null;
}

function brandAuthorized(agreement: any, brand: string): boolean {
  return (agreement?.authorized_brands || []).some((b: string) => words(b).includes(words(brand)));
}

// The signed, unexpired Agreement for a supplier (or undefined).
export function findAgreement(agreements: any[], today: string) {
  return agreements.find((a) => a.status === 'signed' && (!a.expiry_date || a.expiry_date >= today));
}

// Average business days between ordering and the tracking upload, per supplier name, from real fulfillment records.
export async function dispatchProofs(entities: any, userId: string): Promise<Record<string, { n: number; avg: number }>> {
  const [ful, orders] = await Promise.all([
    entities.FulfillmentRecord.filter({ status: 'uploaded' }, '-created_date', 500),
    entities.Order.filter({ created_by_id: userId }, '-created_date', 500),
  ]);
  const byOrder = Object.fromEntries(orders.map((o: any) => [o.id, o]));
  const acc: Record<string, number[]> = {};
  for (const f of ful) {
    const o = byOrder[f.order_ref];
    if (!o?.supplier_name || !f.uploaded_at) continue;
    (acc[o.supplier_name] ||= []).push(businessDaysBetween(o.created_date, f.uploaded_at));
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { n: v.length, avg: v.reduce((a, b) => a + b, 0) / v.length }]));
}

// Hard reject reasons for one product + supplier + agreement. Empty = passes. Order = priority.
export function complianceReasons({ product, supplier, agreement, proof }: { product: any; supplier: any; agreement: any; proof?: { n: number; avg: number } }): string[] {
  const out: string[] = [];
  if (isRetailSource(supplier)) out.push('source_retail');
  if (!agreement) { out.push('no_agreement'); return out; }
  const brand = veroBrand(product?.name);
  if (brand && !brandAuthorized(agreement, brand)) out.push('vero_unauthorized');
  const promised = Number(agreement.dispatch_time_days);
  if (!(promised > 0)) out.push('dispatch_missing');
  else if (proof && proof.n > 0 && Math.round(proof.avg * 100) / 100 > promised) out.push('dispatch_slow');
  return out;
}

const SUSPICIOUS = [
  /(^|[^a-z])(fda[ -]approved|clinically proven|cures?|miracle|guaranteed results?|doctor recommended|no prescription)($|[^a-z])/i,
  /(^|[^a-z])(authentic|genuine|original)[^|]*(brand|designer)/i,
  /(^|[^a-z])(oem|factory (second|reject)|grey market|gray market|unbranded copy)($|[^a-z])/i,
];

// Scans listing titles/descriptions (including LLM-generated text). Non-empty = hold for manual review.
export function screenListingText(...texts: (string | undefined)[]): string[] {
  const hay = texts.filter(Boolean).join(' | ');
  const out = ebayViolations(hay).map((id) => `ebay:${id}`);
  if (SUSPICIOUS.some((rx) => rx.test(hay))) out.push('text_claim');
  return out;
}

export function reasonText(lang: string, reasons: string[]): string {
  return reasons.map((r) => (r.startsWith('ebay:') ? tr(lang, 'rej_ebay', { ids: r.slice(5) }) : tr(lang, `rej_${r}`))).join('; ');
}

// Writes one AuditLog row per rejected product. With dedupe, a rejection already logged in the last 24 hours is skipped.
export async function logRejections(entities: any, user: any, lang: string, items: { name: string; reasons: string[] }[], dedupe = true) {
  let seen = new Set<string>();
  if (dedupe) {
    const since = new Date(Date.now() - 864e5).toISOString();
    const recent = await entities.AuditLog.filter({ action: 'screening_rejected', created_date: { $gte: since } }, '-created_date', 500);
    seen = new Set(recent.map((r: any) => r.details));
  }
  const rows = items
    .map((i) => ({ action: 'screening_rejected', actor_email: user.email, details: tr(lang, 'aud_screen', { name: i.name, reasons: reasonText(lang, i.reasons) }) }))
    .filter((r) => !seen.has(r.details));
  if (rows.length) await entities.AuditLog.bulkCreate(rows);
  return rows.length;
}