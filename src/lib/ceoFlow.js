import { ebayFee } from '@/lib/demoData';

// Hardcoded Level 1 tracks (always these four, always in this order) and Level 2 categories.
// Each entry is [key, dictionary key of the label]; the Chat screen translates the label.
export const TRACKS = [['branded', 'trackBranded'], ['generic', 'trackGeneric'], ['seasonal', 'trackSeasonal'], ['banned', 'trackBanned']];
export const CATEGORIES = [['A', 'catA'], ['B', 'catB'], ['C', 'catC'], ['D', 'catD']];

const r2 = (n) => Math.round(n * 100) / 100;

// Rough profit per unit, before any quote: eBay price - wholesaler price - eBay fee - shipping - returns reserve.
export function roughProfit(p, pct) {
  const fee = ebayFee(p.ebay_price);
  const reserve = r2((p.ebay_price * pct) / 100);
  return { price: p.ebay_price, cost: p.alibaba_cost, fee, shipping: p.shipping, reserve, profit: r2(p.ebay_price - p.alibaba_cost - fee - p.shipping - reserve) };
}

// Final profit from the supplier's QUOTE (same formula the server re-checks): gross per unit, reserve, net per unit and in total.
export function finalProfit(p, q, pct) {
  const gross = r2(p.ebay_price - q.unit_price - q.shipping_total / q.quantity - ebayFee(p.ebay_price));
  const reserve = r2((p.ebay_price * pct) / 100);
  const net = r2(gross - reserve);
  return { gross, reserve, net, totalNet: r2(net * q.quantity) };
}