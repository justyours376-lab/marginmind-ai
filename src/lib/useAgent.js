import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { demoProducts, demoSupplier, demoQuote, ebayFee, calcProfit } from '@/lib/demoData';

const normalize = (p, niche) => {
  const profit = calcProfit(p.ebay_price, p.alibaba_cost, p.shipping);
  return { name: p.name, niche, image_url: p.image_url, ebay_price: p.ebay_price, alibaba_cost: p.alibaba_cost, shipping: p.shipping, ebay_fee: ebayFee(p.ebay_price), profit, margin: +((profit / p.ebay_price) * 100).toFixed(1) };
};

// Chat agent state machine: niche → products → supplier → quote → approval → listing
export function useAgent() {
  const [msgs, setMsgs] = useState([{ kind: 'greet' }]);
  const [busy, setBusy] = useState(null);
  const push = (m) => setMsgs((x) => [...x, m]);
  const patchLast = (kind, patch) => setMsgs((x) => x.map((m, i) => (i === x.map((y) => y.kind).lastIndexOf(kind) ? { ...m, ...patch } : m)));

  const scan = async (niche, label) => {
    push({ kind: 'user', text: label }); setBusy('scan');
    const r = await base44.functions.invoke('n8nRelay', { stage: 'trend', payload: { niche } });
    const raw = r.data.demo ? demoProducts(niche) : (r.data.data.products || []);
    const rows = raw.slice(0, 12).map((p) => ({ ...normalize(p, niche), source: r.data.demo ? 'demo' : 'n8n' }));
    const saved = await base44.entities.Product.bulkCreate(rows);
    push({ kind: 'products', products: saved }); setBusy(null);
  };

  const pick = async (product) => {
    push({ kind: 'user', text: product.name }); setBusy('supplier');
    const r = await base44.functions.invoke('n8nRelay', { stage: 'supplier', payload: { product } });
    const s = r.data.demo ? demoSupplier(product) : r.data.data.supplier;
    const quote = r.data.demo ? demoQuote(product) : (r.data.data.quote || demoQuote(product));
    const supplier = await base44.entities.Supplier.create({ ...s, product_id: product.id });
    push({ kind: 'supplier', product, supplier, quote }); setBusy(null);
  };

  const rfq = (m) => { patchLast('supplier', { done: true }); push({ kind: 'quote', product: m.product, supplier: m.supplier, quote: m.quote }); };

  const approve = async (m, confirm) => {
    setBusy('order');
    const r = await base44.functions.invoke('approveOrder', { product: m.product, supplier: m.supplier, quote: m.quote, user_approved: true, confirm_over_cap: !!confirm });
    setBusy(null);
    if (r.data.needs_confirm) return patchLast('quote', { overCap: true });
    patchLast('quote', { done: true, overCap: false });
    push({ kind: 'listing', listing: r.data.listing, demo: r.data.demo });
  };

  const cancelOver = () => patchLast('quote', { overCap: false });
  const reset = () => setMsgs([{ kind: 'greet' }]);
  return { msgs, busy, scan, pick, rfq, approve, cancelOver, reset };
}