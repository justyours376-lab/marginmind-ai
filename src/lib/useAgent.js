import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { demoQuote } from '@/lib/demoData';
import { finalProfit } from '@/lib/ceoFlow';

// Chat state machine. Every step is tap-gated:
// greeting → track → category → product → (US | non-US) → wholesaler → rough profit → RFQ → quote → approve → listing
export function useAgent() {
  const [msgs, setMsgs] = useState([{ kind: 'greet' }]);
  const [busy, setBusy] = useState(null);
  const push = (...m) => setMsgs((x) => [...x, ...m]);
  const patchLast = (kind, patch) => setMsgs((x) => x.map((m, i) => (i === x.map((y) => y.kind).lastIndexOf(kind) ? { ...m, ...patch } : m)));
  // A failed lookup removes the user's last pick (so the previous chips work again) and shows the error.
  const fail = (code) => setMsgs((x) => [...x.slice(0, x.map((y) => y.kind).lastIndexOf('user')), { kind: 'error', code }]);

  // Level 1. Track 4 (banned) is view only: a list + rules, no further choices.
  const pickTrack = async (track, label) => {
    push({ kind: 'user', text: label });
    if (track !== 'banned') return push({ kind: 'categories', track });
    setBusy('scan');
    try {
      const r = await base44.functions.invoke('scanProducts', { track });
      push({ kind: 'banned', data: r.data });
    } catch { fail('generic'); }
    setBusy(null);
  };

  // Level 2: server screens the category against the eBay list and returns up to 20 products that all have a US supplier record.
  const pickCategory = async (track, category, label) => {
    push({ kind: 'user', text: label }); setBusy('scan');
    try {
      const r = await base44.functions.invoke('scanProducts', { track, category });
      push({ kind: 'products', data: r.data });
    } catch { fail('generic'); }
    setBusy(null);
  };

  // A product is chosen: exactly two options follow (US = buyable, non-US = view only).
  const pick = (product) => push({ kind: 'user', text: product.name }, { kind: 'choice', product });

  const pickGroup = async (m, group, label) => {
    push({ kind: 'user', text: label }); setBusy('supplier');
    try {
      const r = await base44.functions.invoke('supplierReport', { product_id: m.product.id, group });
      push({ kind: 'supplier', product: m.product, group, report: r.data });
    } catch { fail('generic'); }
    setBusy(null);
  };

  // Only after a wholesaler is chosen: rough profit, then the RFQ tap. The other wholesalers stay as the backup bench.
  const selectSupplier = (m, supplier) => push({ kind: 'user', text: supplier.name }, { kind: 'rfqPrompt', product: m.product, supplier, all: m.all || m.report.suppliers });
  const rfq = (m, label) => push({ kind: 'user', text: label }, { kind: 'quote', product: m.product, supplier: m.supplier, all: m.all, quote: demoQuote(m.product) });

  const approve = async (m, confirm) => {
    setBusy('order');
    const fail2 = (code) => {
      patchLast('quote', { overCap: false });
      const bench = m.all.filter((s) => s.id !== m.supplier.id);
      push({ kind: 'error', code }, ...(bench.length ? [{ kind: 'bench', product: m.product, all: m.all, failed: m.supplier, bench }] : []));
    };
    try {
      // The server recomputes every number from stored data and from this quote; the browser total is never trusted.
      const r = await base44.functions.invoke('approveOrder', { product_id: m.product.id, supplier_id: m.supplier.id, quote: m.quote, unit_profit: finalProfit(m.product, m.quote, 0).gross, user_approved: true, confirm_over_cap: !!confirm });
      const d = r.data;
      if (d.needs_confirm) return patchLast('quote', { overCap: true });
      patchLast('quote', { overCap: false });
      if (d.code) return fail2(d.code);
      push({ kind: 'listing', listing: d.listing, demo: d.demo });
    } catch {
      fail2('generic');
    } finally { setBusy(null); }
  };

  const cancelOver = () => patchLast('quote', { overCap: false });
  // Chat-only delete: drops message i and everything after it. Never touches saved data or confirmed orders.
  const removeFrom = (i) => setMsgs((x) => x.slice(0, i));
  const reset = () => setMsgs([{ kind: 'greet' }]);
  // Opened from the Products screen: start with that product's details and the US / non-US choice (no greeting restart).
  const openProduct = (product) => setMsgs([{ kind: 'product', product }, { kind: 'choice', product }]);
  // After "no products found": go back one level instead of dead-ending.
  const anotherCategory = (track, label) => push({ kind: 'user', text: label }, { kind: 'categories', track });
  const anotherTrack = (label) => push({ kind: 'user', text: label }, { kind: 'tracks' });
  return { msgs, busy, openProduct, anotherCategory, anotherTrack, pickTrack, pickCategory, pick, pickGroup, selectSupplier, rfq, approve, cancelOver, removeFrom, reset };
}