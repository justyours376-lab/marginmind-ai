import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { demoQuote } from '@/lib/demoData';

const MAX_SHOWN = 12;

// Chat state machine. Every step is tap-gated:
// greeting → group → niche → product → supplier → RFQ → quote → approve → listing
export function useAgent() {
  const [msgs, setMsgs] = useState([{ kind: 'greet' }]);
  const [busy, setBusy] = useState(null);
  const push = (...m) => setMsgs((x) => [...x, ...m]);
  const patchLast = (kind, patch) => setMsgs((x) => x.map((m, i) => (i === x.map((y) => y.kind).lastIndexOf(kind) ? { ...m, ...patch } : m)));
  // A failed lookup removes the user's last pick (so the previous chips work again) and shows the error.
  const fail = (code) => setMsgs((x) => [...x.slice(0, x.map((y) => y.kind).lastIndexOf('user')), { kind: 'error', code }]);

  const pickGroup = async (group, label) => {
    push({ kind: 'user', text: label }); setBusy('scan');
    try {
      // Server scans the group (capped) and screens every item against the eBay exclusion list.
      const r = await base44.functions.invoke('scanProducts', { group });
      const d = r.data;
      push({ kind: 'groupResult', group, data: d }, ...(d.restricted.length ? [{ kind: 'restricted', items: d.restricted }] : []));
    } catch { fail('generic'); }
    setBusy(null);
  };

  // The group was already scanned: filter its qualified products by niche, most profitable first, up to 12.
  const pickNiche = (m, niche, label) => {
    const products = m.data.products.filter((p) => niche === 'profitable' || p.niche === niche).sort((a, b) => b.profit - a.profit).slice(0, MAX_SHOWN);
    push({ kind: 'user', text: label }, { kind: 'products', products, group: m.group });
  };

  const pick = async (product, group) => {
    push({ kind: 'user', text: product.name }); setBusy('supplier');
    try {
      const r = await base44.functions.invoke('supplierReport', { product_id: product.id, group });
      // The quote is always computed from stored product data; the server recomputes and verifies it.
      push({ kind: 'supplier', product, group, report: r.data, quote: demoQuote(product) });
    } catch { fail('generic'); }
    setBusy(null);
  };

  const selectSupplier = (m, supplier) => push({ kind: 'user', text: supplier.name }, { kind: 'rfqPrompt', product: m.product, supplier, quote: m.quote });
  const rfq = (m, label) => push({ kind: 'user', text: label }, { kind: 'quote', product: m.product, supplier: m.supplier, quote: m.quote });

  const approve = async (m, confirm) => {
    setBusy('order');
    try {
      const r = await base44.functions.invoke('approveOrder', { product_id: m.product.id, supplier_id: m.supplier.id, quote: m.quote, unit_profit: m.product.profit, user_approved: true, confirm_over_cap: !!confirm });
      const d = r.data;
      if (d.needs_confirm) return patchLast('quote', { overCap: true });
      patchLast('quote', { overCap: false });
      if (d.code) return push({ kind: 'error', code: d.code });
      push({ kind: 'listing', listing: d.listing, demo: d.demo });
    } catch {
      patchLast('quote', { overCap: false });
      push({ kind: 'error', code: 'generic' });
    } finally { setBusy(null); }
  };

  const cancelOver = () => patchLast('quote', { overCap: false });
  // Chat-only delete: drops message i and everything after it. Never touches saved data or confirmed orders.
  const removeFrom = (i) => setMsgs((x) => x.slice(0, i));
  const reset = () => setMsgs([{ kind: 'greet' }]);
  return { msgs, busy, pickGroup, pickNiche, pick, selectSupplier, rfq, approve, cancelOver, removeFrom, reset };
}