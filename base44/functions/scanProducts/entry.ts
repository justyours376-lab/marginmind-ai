import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ebayViolations, EXCLUDED_CATEGORIES, POLICY_VERSION } from '../../shared/ebayPolicy.ts';
import { candidatePool, riskyPool, CATEGORIES, TRACKS } from '../../shared/catalog.ts';
import { isVerifiedUs } from '../../shared/suppliers.ts';

const MAX_PRODUCTS = 20; // the most products one category list can show

// track 'banned': view-only list of banned items + the eBay rule categories this app enforces. No order path.
// track 'branded' | 'generic' | 'seasonal' + category A-D: every candidate is screened against the eBay exclusion list,
// then must have at least one qualifying US supplier RECORD. Ranked by profit (computed here), top 20 at most.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { track, category } = await req.json().catch(() => ({}));

    if (track === 'banned') {
      const restricted = riskyPool().map((p) => ({ name: p.name, niche: p.niche, image_url: p.image_url, reasons: ebayViolations(p.name, p.niche) })).filter((x) => x.reasons.length);
      return Response.json({ track, restricted, rules: EXCLUDED_CATEGORIES.map((c) => c.id), policy_version: POLICY_VERSION });
    }
    if (!TRACKS.includes(track) || !CATEGORIES[category]) return Response.json({ error: 'Invalid track or category' }, { status: 400 });

    const pct = Number(user.returns_reserve ?? 5);
    const supRows = await base44.entities.Supplier.filter({}, '-rating', 1000);
    const byName = new Map();
    for (const s of supRows) byName.set(s.product_name, [...(byName.get(s.product_name) || []), s]);

    const pool = candidatePool(track, category);
    const qualified = [], screening = [];
    let excluded = 0;
    for (const p of pool) {
      const reasons = ebayViolations(p.name, p.niche);
      if (reasons.length) {
        excluded++;
        screening.push({ product_name: p.name, niche: p.niche, status: 'excluded', reasons: reasons.join(','), policy_version: POLICY_VERSION });
        continue;
      }
      if ((byName.get(p.name) || []).some(isVerifiedUs)) qualified.push(p);
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

    const net = (p) => p.profit - (p.ebay_price * pct) / 100;
    const ranked = qualified.map((p) => ({ ...have.get(p.name), margin: margin(p) })).sort((a, b) => net(b) - net(a));
    const products = ranked.slice(0, MAX_PRODUCTS);
    return Response.json({ track, category, scanned: pool.length, excluded, qualified_total: ranked.length, products, max: MAX_PRODUCTS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}