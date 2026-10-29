import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ebayViolations, POLICY_VERSION } from '../../shared/ebayPolicy.ts';
import { candidatePool } from '../../shared/catalog.ts';
import { isVerifiedUs } from '../../shared/suppliers.ts';

const NICHES = ['cosmetics', 'home', 'profitable'];

// Builds the candidate list (up to 12, only products with a verified US supplier). Every item is screened against the eBay exclusion list first;
// excluded items are dropped silently and replaced by the next eligible one (never sent to the client).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { niche } = await req.json();
    if (!NICHES.includes(niche)) return Response.json({ error: 'Invalid niche' }, { status: 400 });

    const pct = Number(user.returns_reserve ?? 5);
    const eligible = [];
    const screening = [];
    // Products qualify only with at least one verified US wholesaler/distributor record.
    const supRows = await base44.entities.Supplier.filter({ verified: true }, '-rating', 1000);
    const qualified = new Set(supRows.filter(isVerifiedUs).map((s) => s.product_name));
    for (const p of candidatePool(niche)) {
      const reasons = ebayViolations(p.name, p.niche);
      if (reasons.length) { screening.push({ product_name: p.name, niche, status: 'excluded', reasons: reasons.join(','), policy_version: POLICY_VERSION }); continue; }
      if (qualified.has(p.name)) eligible.push(p);
    }
    // Rank qualified products by profit, keep up to 12 (honest count, never padded).
    // Second pass on the final list (defense in depth).
    const final = eligible.sort((a, b) => b.profit - a.profit).slice(0, 12).filter((p) => ebayViolations(p.name, p.niche).length === 0);

    const rows = final.map((p) => {
      const reserve = +((p.ebay_price * pct) / 100).toFixed(2);
      const net = +(p.profit - reserve).toFixed(2);
      return { ...p, margin: p.ebay_price ? +((net / p.ebay_price) * 100).toFixed(1) : 0, source: 'demo' };
    });
    const saved = rows.length ? await base44.entities.Product.bulkCreate(rows) : [];
    for (const s of saved) screening.push({ product_name: s.name, niche, status: 'passed', reasons: '', policy_version: POLICY_VERSION, product_id: s.id });
    if (screening.length) await base44.entities.ProductScreening.bulkCreate(screening);
    return Response.json({ products: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}