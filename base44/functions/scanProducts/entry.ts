import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ebayViolations, POLICY_VERSION } from '../../shared/ebayPolicy.ts';
import { candidatePool } from '../../shared/catalog.ts';
import { isVerifiedUs, isNonUs } from '../../shared/suppliers.ts';

const NICHES = ['cosmetics', 'home'];
const SCAN_CAP = 200; // never scan more than this many candidates in one group scan

// Scans one supplier group ('us' or 'nonus'). Every candidate is first checked against the eBay exclusion list
// (those go to the separate Restricted list, never into a buyable list), then must have a qualifying supplier record.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { group } = await req.json();
    if (!['us', 'nonus'].includes(group)) return Response.json({ error: 'Invalid group' }, { status: 400 });

    const pct = Number(user.returns_reserve ?? 5);
    const supRows = await base44.entities.Supplier.filter({}, '-rating', 1000);
    const byName = new Map();
    for (const s of supRows) byName.set(s.product_name, [...(byName.get(s.product_name) || []), s]);
    const qualifies = group === 'us' ? isVerifiedUs : isNonUs;

    const pool = candidatePool('profitable');
    const stats = Object.fromEntries(NICHES.map((n) => [n, { niche: n, scanned: 0, qualified: 0 }]));
    const qualified = [], restricted = [], screening = [];
    let scanned = 0;
    for (const p of pool) {
      if (scanned >= SCAN_CAP) break;
      scanned++; stats[p.niche].scanned++;
      const reasons = ebayViolations(p.name, p.niche);
      if (reasons.length) {
        restricted.push({ name: p.name, niche: p.niche, image_url: p.image_url, reasons });
        screening.push({ product_name: p.name, niche: p.niche, status: 'excluded', reasons: reasons.join(','), policy_version: POLICY_VERSION });
        continue;
      }
      if ((byName.get(p.name) || []).some(qualifies)) { qualified.push(p); stats[p.niche].qualified++; }
    }

    // Reuse this user's stored Product rows; create only the missing ones.
    const names = qualified.map((p) => p.name);
    const existing = names.length ? (await base44.entities.Product.filter({ name: { $in: names } }, '-created_date', 1000)).filter((x) => x.created_by_id === user.id) : [];
    const have = new Map(existing.map((x) => [x.name, x]));
    const margin = (p) => (p.ebay_price ? +(((p.profit - (p.ebay_price * pct) / 100) / p.ebay_price) * 100).toFixed(1) : 0);
    const toCreate = qualified.filter((p) => !have.has(p.name)).map((p) => ({ ...p, margin: margin(p), source: 'demo' }));
    const created = toCreate.length ? await base44.entities.Product.bulkCreate(toCreate) : [];
    for (const s of created) { have.set(s.name, s); screening.push({ product_name: s.name, niche: s.niche, status: 'passed', reasons: '', policy_version: POLICY_VERSION, product_id: s.id }); }
    if (screening.length) await base44.entities.ProductScreening.bulkCreate(screening);

    const products = qualified.map((p) => ({ ...have.get(p.name), margin: margin(p) })).sort((a, b) => b.profit - a.profit);
    return Response.json({ group, scanned, exhausted: scanned >= pool.length, products, restricted, niches: Object.values(stats) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}