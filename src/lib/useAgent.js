import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMe } from '@/lib/useMe';
import { demoProducts, demoSupplier, demoQuote, ebayFee, calcProfit, withReserve } from '@/lib/demoData';

const normalize = (p, niche, pct) => {
  const profit = calcProfit(p.ebay_price, p.alibaba_cost, p.shipping);
  return { name: p.name, niche, image_url: p.image_url, ebay_price: p.ebay_price, alibaba_cost: p.alibaba_cost, shipping: p.shipping, ebay_fee: ebayFee(p.ebay_price), profit, margin: withReserve(profit, p.ebay_price, pct).margin };
};

// Chat agent state machine: niche → products → supplier → quote → approval → listing
export function useAgent() {
  const { me } = useMe();
  const [msgs, setMsgs] = useState([{ kind: 'greet' }]);
  const [busy, setBusy] = useState(null);
  const push = (m) => setMsgs((x) => [...x, m]);
  const patchLast = (kind, patch) => setMsgs((x) => x.map((m, i) => (i === x.map((y) => y.kind).lastIndexOf(kind) ? { ...m, ...patch } : m)));

  const scan = async (niche, label) => {
    push({ kind: 'user', text: label }); setBusy('scan');
    const rows = demoProducts(niche).slice(0, 12).map((p) => ({ ...normalize(p, niche, me?.returns_reserve ?? 5), source: 'demo' }));
    const saved = await base44.entities.Product.bulkCreate(rows);
    push({ kind: 'products', products: saved }); setBusy(null);
  };

  const pick = async (product) => {
    push({ kind: 'user', text: product.name }); setBusy('supplier');
    const s = demoSupplier(product);
    // The quote is always computed from stored product data; the server recomputes and verifies it.
    const quote = demoQuote(product);
    const supplier = await base44.entities.Supplier.create({ ...s, product_id: product.id });
    push({ kind: 'supplier', product, supplier, quote }); setBusy(null);
  };

  const rfq = (m) => { patchLast('supplier', { done: true }); push({ kind: 'quote', product: m.product, supplier: m.supplier, quote: m.quote }); };

  const approve = async (m, confirm) => {
    setBusy('order');
    try {
      const r = await base44.functions.invoke('approveOrder', { product_id: m.product.id, supplier_id: m.supplier.id, quote: m.quote, unit_profit: m.product.profit, user_approved: true, confirm_over_cap: !!confirm });
      const d = r.data;
      if (d.needs_confirm) return patchLast('quote', { overCap: true });
      patchLast('quote', { overCap: false });
      if (d.code) return push({ kind: 'error', code: d.code });
      patchLast('quote', { done: true });
      push({ kind: 'listing', listing: d.listing, demo: d.demo });
    } catch {
      patchLast('quote', { overCap: false });
      push({ kind: 'error', code: 'generic' });
    } finally { setBusy(null); }
  };

  const cancelOver = () => patchLast('quote', { overCap: false });
  const reset = () => setMsgs([{ kind: 'greet' }]);
  return { msgs, busy, scan, pick, rfq, approve, cancelOver, reset };
}