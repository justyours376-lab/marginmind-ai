import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { tr } from '../../shared/msgs.ts';
import { isVerifiedUs } from '../../shared/suppliers.ts';
import { ebayViolations } from '../../shared/ebayPolicy.ts';
import { addBusinessDays } from '../../shared/dates.ts';
import { complianceReasons, dispatchProofs, findAgreement, logRejections, reasonText, screenListingText } from '../../shared/compliance.ts';
import { POLICY_VERSION } from '../../shared/ebayPolicy.ts';
import { buildListingTitle } from '../../shared/listingContent.ts';

const r2 = (n) => Math.round(n * 100) / 100;
const differs = (clientVal, serverVal) => !(Math.abs(Number(clientVal) - serverVal) <= 0.01);

// Runs only when the user taps "Approve and Pay". All money math is recomputed here from stored data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
    const lang = user.preferred_language || 'ne';
    const log = (action, amount, details) => base44.entities.AuditLog.create({ action, actor_email: user.email, amount, details });
    const body = await req.json();
    const { user_approved, confirm_over_cap, release_screening_id } = body;
    let { product_id, supplier_id, quote, unit_profit } = body;

    // Releasing a listing held for manual review: product, supplier and quantity come from the stored hold, and every gate below still runs.
    let held = null;
    if (release_screening_id) {
      held = await base44.entities.ProductScreening.get(release_screening_id).catch(() => null);
      if (!held || held.created_by_id !== user.id || held.status !== 'manual_review' || !held.product_id || !held.supplier_ref || !(held.quantity >= 1)) return Response.json({ code: 'invalid' });
      product_id = held.product_id; supplier_id = held.supplier_ref; quote = { quantity: held.quantity };
    }

    if (user_approved !== true) return Response.json({ code: 'invalid' });
    const qty = Number(quote?.quantity);
    if (!product_id || !supplier_id || !Number.isInteger(qty) || qty < 1 || qty > 1000) return Response.json({ code: 'invalid' });
    const [product, supplier] = await Promise.all([
      base44.entities.Product.get(product_id).catch(() => null),
      base44.entities.Supplier.get(supplier_id).catch(() => null),
    ]);
    if (!product || !supplier || product.created_by_id !== user.id || !isVerifiedUs(supplier) || supplier.product_name !== product.name || !supplier.policy_safe || ebayViolations(product.name, product.niche).length) return Response.json({ code: 'invalid' });
    const price = Number(product.ebay_price), cost = Number(product.alibaba_cost), ship = Number(product.shipping);
    if (!(price > 0) || !(cost >= 0) || !(ship >= 0)) return Response.json({ code: 'invalid' });

    // Server-side math (never trust browser totals)
    const unit = r2(cost * 0.95);
    const shippingTotal = r2(ship * qty * 0.6);
    const total = r2(unit * qty + shippingTotal);
    // Final profit per unit comes from the QUOTE the user approved (quote unit price + quote shipping), before the returns reserve.
    const grossProfit = r2(price - unit - shippingTotal / qty - r2(price * 0.136 + 0.30));
    const pct = Number(user.returns_reserve ?? 5);

    // A released hold has no browser quote: the server's own numbers are the quote.
    if (held) { quote = { quantity: qty, unit_price: unit, shipping_total: shippingTotal, total }; unit_profit = grossProfit; }
    if (differs(quote.unit_price, unit) || differs(quote.shipping_total, shippingTotal) || differs(quote.total, total) || differs(unit_profit, grossProfit)) {
      await log('order_rejected', Number(quote.total) || 0, tr(lang, 'aud_rejected', { detail: `total ${quote.total} vs ${total}, profit ${unit_profit} vs ${grossProfit}` }));
      return Response.json({ code: 'mismatch' });
    }

    // Listing rule: the supplier needs a signed, unexpired Agreement before anything can reach a Listing.
    const today = new Date().toISOString().slice(0, 10);
    const agreements = await base44.entities.Agreement.filter({ supplier_ref: supplier.id, status: 'signed' });
    const agreement = findAgreement(agreements, today);

    // Compliance gate: wholesale source + signed agreement, VeRO brand authorization, proven dispatch time vs promised handling time.
    const proof = (await dispatchProofs(base44.entities, user.id))[supplier.name];
    const reasons = complianceReasons({ product, supplier, agreement, proof });
    if (reasons.length) {
      await logRejections(base44.entities, user, lang, [{ name: product.name, reasons }], false);
      if (!held) await base44.entities.ProductScreening.create({ product_name: product.name, niche: product.niche, status: 'excluded', reasons: reasons.join(','), policy_version: POLICY_VERSION, product_id: product.id });
      return Response.json({ code: reasons[0], reasons });
    }
    // Handling time comes from the agreement and is never lowered.
    const handlingDays = Number(agreement.dispatch_time_days);
    // Listing content is English only: the title comes from one fixed English template and is never translated.
    const title = buildListingTitle(product.name);

    // Listing text scan (titles/descriptions, including any LLM-generated text): suspicious text goes to manual review, nothing is ordered.
    // A hold the seller released has had its text claims reviewed by a person; prohibited terms and non-English content still block it.
    const flaggedAll = screenListingText(title, product.name, product.niche);
    const flagged = held ? flaggedAll.filter((r) => r !== 'text_claim') : flaggedAll;
    if (flagged.length) {
      if (!held) {
        await base44.entities.ProductScreening.create({ product_name: product.name, niche: product.niche, status: 'manual_review', reasons: flagged.join(','), policy_version: POLICY_VERSION, product_id: product.id, supplier_ref: supplier.id, quantity: qty });
        await log('listing_manual_review', total, tr(lang, 'aud_review', { name: product.name, reasons: reasonText(lang, flagged) }));
        await base44.entities.Notification.create({
          user_id: user.id, type: 'security', title: tr(lang, 'review_title', { name: product.name }), message: tr(lang, 'review_msg', { ids: flagged.join(', ') }),
          title_key: 'review_title', msg_key: 'review_msg', vars: { name: product.name, ids: flagged.join(', ') }, link: '/settings?focus=pending-review',
        });
      }
      return Response.json({ code: 'manual_review', reasons: flagged });
    }

    // New listing approvals are paused while the seller's eBay account health is critical.
    const health = (await base44.asServiceRole.entities.AccountHealthSnapshot.filter({ user_id: user.id }, '-created_date', 1))[0];
    if (health?.alert_status === 'critical') {
      await log('order_rejected', total, tr(lang, 'aud_rejected', { detail: 'account health' }));
      return Response.json({ code: 'account_health' });
    }

    // Spend cap (server-side)
    const cap = Number(user.spend_cap ?? 200);
    const over = total > cap;
    if (over && confirm_over_cap !== true) return Response.json({ needs_confirm: true, cap, total });

    const demo = true;
    const order = await base44.entities.Order.create({
      product_id: product.id, product_name: product.name, image_url: product.image_url, supplier_name: supplier.name,
      quantity: qty, unit_price: unit, total, sell_price: price, unit_profit: grossProfit, returns_reserve_pct: pct,
      status: 'awaiting_approval', demo,
    });
    const now = new Date().toISOString();
    await base44.entities.Approval.create({ order_id: order.id, product_id: product.id, product_name: product.name, amount: total, approved_by_email: user.email, approved_at: now, over_cap: over, spend_cap: cap });
    await log('approve_and_pay', total, tr(lang, 'aud_approve', { name: product.name, qty, supplier: supplier.name, over: over ? tr(lang, 'aud_over') : '', demo: demo ? tr(lang, 'aud_demo') : '' }));

    // Money record (pending, owed to the supplier) and a fulfillment record that waits for the supplier's tracking number.
    // Record-only: no card or bank details are stored.
    // The payment is due now (today), not in 7 days. The fulfillment record waits for the tracking number; the eBay handling clock starts at approval.
    await base44.entities.PaymentLedger.create({ order_ref: order.id, direction: 'paid_to_supplier', amount: total, currency: 'USD', method: 'supplier_portal', supplier_ref: supplier.id, status: 'pending', due_date: today });
    await base44.entities.FulfillmentRecord.create({ order_ref: order.id, status: 'awaiting_tracking', uploaded_to_ebay: false, handling_days: handlingDays, handling_deadline: addBusinessDays(new Date(), handlingDays).toISOString() });

    const listingUrl = `https://www.ebay.com/itm/demo-${order.id}`;
    const updated = await base44.entities.Order.update(order.id, { status: 'ordered' });
    const listing = await base44.entities.Listing.create({ order_id: order.id, product_id: product.id, title, price, photos: [product.image_url], url: listingUrl, handling_days: handlingDays, status: 'live' });
    if (held) {
      await base44.entities.ProductScreening.update(held.id, { status: 'passed' });
      await log('held_approved', total, tr(lang, 'aud_held_approved', { name: product.name }));
    }
    return Response.json({ order: updated, listing, demo });
  } catch (error) {
    console.error('approveOrder failed', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}