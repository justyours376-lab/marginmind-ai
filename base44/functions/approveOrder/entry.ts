import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';

const r2 = (n) => Math.round(n * 100) / 100;
const differs = (clientVal, serverVal) => !(Math.abs(Number(clientVal) - serverVal) <= 0.01);

// Runs only when the user taps "Approve and Pay". All money math is recomputed here from stored data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const lang = user.language || 'ne';
    const log = (action, amount, details) => base44.entities.AuditLog.create({ action, actor_email: user.email, amount, details });
    const { product_id, supplier_id, quote, unit_profit, user_approved, confirm_over_cap } = await req.json();

    if (user_approved !== true) return Response.json({ code: 'invalid' });
    const qty = Number(quote?.quantity);
    if (!product_id || !supplier_id || !Number.isInteger(qty) || qty < 1 || qty > 1000) return Response.json({ code: 'invalid' });
    const [product, supplier] = await Promise.all([
      base44.entities.Product.get(product_id).catch(() => null),
      base44.entities.Supplier.get(supplier_id).catch(() => null),
    ]);
    if (!product || !supplier || product.created_by_id !== user.id || supplier.created_by_id !== user.id || supplier.product_id !== product.id || !supplier.policy_safe) return Response.json({ code: 'invalid' });
    const price = Number(product.ebay_price), cost = Number(product.alibaba_cost), ship = Number(product.shipping);
    if (!(price > 0) || !(cost >= 0) || !(ship >= 0)) return Response.json({ code: 'invalid' });

    // Server-side math (never trust browser totals)
    const unit = r2(cost * 0.95);
    const shippingTotal = r2(ship * qty * 0.6);
    const total = r2(unit * qty + shippingTotal);
    const grossProfit = r2(price - cost - ship - (price * 0.136 + 0.30));
    const pct = Number(user.returns_reserve ?? 5);

    if (differs(quote.unit_price, unit) || differs(quote.shipping_total, shippingTotal) || differs(quote.total, total) || differs(unit_profit, grossProfit)) {
      await log('order_rejected', Number(quote.total) || 0, tr(lang, 'aud_rejected', { detail: `total ${quote.total} vs ${total}, profit ${unit_profit} vs ${grossProfit}` }));
      return Response.json({ code: 'mismatch' });
    }

    // Spend cap (server-side)
    const cap = Number(user.spend_cap ?? 200);
    const over = total > cap;
    if (over && confirm_over_cap !== true) return Response.json({ needs_confirm: true, cap, total });

    const url = user.webhooks?.order;
    const demo = !url;
    const order = await base44.entities.Order.create({
      product_id: product.id, product_name: product.name, image_url: product.image_url, supplier_name: supplier.name,
      quantity: qty, unit_price: unit, total, sell_price: price, unit_profit: grossProfit, returns_reserve_pct: pct,
      status: 'awaiting_approval', demo,
    });
    const now = new Date().toISOString();
    await base44.entities.Approval.create({ order_id: order.id, product_id: product.id, product_name: product.name, amount: total, approved_by_email: user.email, approved_at: now, over_cap: over, spend_cap: cap });
    await log('approve_and_pay', total, tr(lang, 'aud_approve', { name: product.name, qty, supplier: supplier.name, over: over ? tr(lang, 'aud_over') : '', demo: demo ? tr(lang, 'aud_demo') : '' }));

    let listingUrl = `https://www.ebay.com/itm/demo-${order.id}`;
    let title = `${product.name} - Fast Shipping, New`;
    if (!demo) {
      const fail = async (reasonKey, vars = {}) => {
        await base44.entities.Order.update(order.id, { status: 'payment_failed' });
        await log('order_failed', total, tr(lang, 'aud_failed', { id: order.id, reason: tr(lang, reasonKey, vars) }));
        return Response.json({ code: 'payment_failed', order_id: order.id });
      };
      let res;
      try {
        res = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(90000),
          body: JSON.stringify({ order_id: order.id, product, supplier, quote: { quantity: qty, unit_price: unit, shipping_total: shippingTotal, total }, approved_by: user.email, approved_at: now }),
        });
      } catch (e) {
        return fail(e?.name === 'TimeoutError' ? 'reason_timeout' : 'reason_network');
      }
      if (!res.ok) return fail('reason_http', { status: res.status });
      const data = await res.json().catch(() => ({}));
      if (data.success === false) return fail('reason_notsuccess');
      listingUrl = data.listing_url || listingUrl;
      title = data.title || title;
      await log('payment_submitted', total, tr(lang, 'aud_paid', { id: order.id }));
    }
    const updated = await base44.entities.Order.update(order.id, { status: 'ordered' });
    const listing = await base44.entities.Listing.create({ order_id: order.id, product_id: product.id, title, price, photos: [product.image_url], url: listingUrl, status: 'live' });
    return Response.json({ order: updated, listing, demo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}