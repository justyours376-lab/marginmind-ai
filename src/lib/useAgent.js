import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { demoQuote } from '@/lib/demoData';

// Chat agent state machine: (user starts) → niche → products → supplier → quote → approval → listing
export function useAgent() {
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(null);
  const push = (m) => setMsgs((x) => [...x, m]);
  const patchLast = (kind, patch) => setMsgs((x) => x.map((m, i) => (i === x.map((y) => y.kind).lastIndexOf(kind) ? { ...m, ...patch } : m)));

  const start = () => setMsgs([{ kind: 'greet' }]);

  const scan = async (niche, label) => {
    push({ kind: 'user', text: label }); setBusy('scan');
    try {
      // Server builds the list and screens every item against the eBay exclusion list.
      const r = await base44.functions.invoke('scanProducts', { niche });
      push({ kind: 'products', products: r.data.products });
    } catch { push({ kind: 'error', code: 'generic' }); }
    setBusy(null);
  };

  const pick = async (product) => {
    push({ kind: 'user', text: product.name }); setBusy('supplier');
    try {
      // Only real, verified US suppliers come back from the server.
      const r = await base44.functions.invoke('supplierReport', { product_id: product.id });
      // The quote is always computed from stored product data; the server recomputes and verifies it.
      push({ kind: 'supplier', product, report: r.data, quote: demoQuote(product) });
    } catch { push({ kind: 'error', code: 'generic' }); }
    setBusy(null);
  };

  const rfq = (m, supplier) => { patchLast('supplier', { done: true }); push({ kind: 'quote', product: m.product, supplier, quote: m.quote }); };

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
  return { msgs, busy, start, scan, pick, rfq, approve, cancelOver, reset };
}