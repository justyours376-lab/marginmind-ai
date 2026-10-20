import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Only runs when the user explicitly taps "Approve and Pay". Enforces spend cap server-side.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { product, supplier, quote, user_approved, confirm_over_cap } = await req.json();
    if (user_approved !== true) return Response.json({ error: 'User approval required' }, { status: 400 });
    const total = Number(quote?.total);
    if (!product?.id || !(total > 0)) return Response.json({ error: 'Invalid order' }, { status: 400 });
    const cap = Number(user.spend_cap ?? 200);
    const over = total > cap;
    if (over && confirm_over_cap !== true) return Response.json({ needs_confirm: true, cap, total });

    const url = user.webhooks?.order;
    const demo = !url;
    const unitProfit = +(product.profit).toFixed(2);
    const order = await base44.entities.Order.create({
      product_id: product.id, product_name: product.name, image_url: product.image_url, supplier_name: supplier?.name,
      quantity: quote.quantity, unit_price: quote.unit_price, total, sell_price: product.ebay_price, unit_profit: unitProfit, status: 'ordered', demo,
    });
    const now = new Date().toISOString();
    await base44.entities.Approval.create({ order_id: order.id, product_id: product.id, product_name: product.name, amount: total, approved_by_email: user.email, approved_at: now, over_cap: over, spend_cap: cap });
    await base44.entities.AuditLog.create({ action: 'approve_and_pay', actor_email: user.email, amount: total, details: `${product.name} x${quote.quantity} from ${supplier?.name || 'supplier'}${over ? ' (over spend cap, re-confirmed)' : ''}${demo ? ' [demo, no real charge]' : ''}` });

    let listingUrl = `https://www.ebay.com/itm/demo-${order.id}`;
    let title = `${product.name} - Fast Shipping, New`;
    if (!demo) {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(90000),
        body: JSON.stringify({ order_id: order.id, product, supplier, quote, approved_by: user.email, approved_at: now }) });
      if (!res.ok) {
        await base44.entities.AuditLog.create({ action: 'order_webhook_failed', actor_email: user.email, amount: total, details: `n8n ${res.status}` });
        return Response.json({ error: `Order + List webhook returned ${res.status}` }, { status: 502 });
      }
      const data = await res.json();
      listingUrl = data.listing_url || listingUrl;
      title = data.title || title;
      await base44.entities.AuditLog.create({ action: 'payment_submitted', actor_email: user.email, amount: total, details: `Sent to n8n for supplier payment, order ${order.id}` });
    }
    const listing = await base44.entities.Listing.create({ order_id: order.id, product_id: product.id, title, price: product.ebay_price, photos: [product.image_url], url: listingUrl, status: 'live' });
    return Response.json({ order, listing, demo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}