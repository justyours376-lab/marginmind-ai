import { tr } from './msgs.ts';
import { notifyUser } from './notify.ts';
import { setEbayPrice, endEbayListing } from './ebayTrading.ts';

const r2 = (n) => Math.round(n * 100) / 100;
const MAX_RAISE = 0.2; // the guard may raise a price by at most 20%; beyond that the listing is delisted

// Same cost model as approveOrder: quote price = cost x 0.95, shipping x 0.6 per unit, eBay fee 13.6% + $0.30.
function model(cost, ship) {
  const base = r2(cost * 0.95) + ship * 0.6 + 0.3;
  return {
    margin: (price) => (price > 0 ? ((price - base - price * 0.136) / price) * 100 : 0),
    floorPrice: (floor) => (0.864 - floor / 100 > 0 ? Math.ceil((base / (0.864 - floor / 100)) * 100) / 100 : Infinity),
  };
}

// Recomputes the margin of every live listing from the current supplier cost. Below the floor: raise the price (<= +20%) or delist.
// Every cost change, price change and delist is logged to PriceHistory.
export async function repriceListings(sr, user, floor) {
  const lang = user.language || 'ne';
  const listings = await sr.entities.Listing.filter({ created_by_id: user.id, status: 'live' }, '-created_date', 200);
  const events = [];
  let adjusted = 0, delisted = 0;
  for (const l of listings) {
    const product = await sr.entities.Product.get(l.product_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    const cost = Number(product?.alibaba_cost);
    if (!(l.price > 0)) continue;
    if (!product || !(cost >= 0)) {
      // No current supplier cost to recompute from: keep showing the margin that was approved on the order. No price action.
      const o = await sr.entities.Order.get(l.order_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (o?.sell_price > 0 && typeof o.unit_profit === 'number') await sr.entities.Listing.update(l.id, { margin: +((o.unit_profit / o.sell_price) * 100).toFixed(1) });
      continue;
    }
    const m = model(cost, Number(product.shipping) || 0);
    const margin = +m.margin(l.price).toFixed(1);
    const last = (await sr.entities.PriceHistory.filter({ user_id: user.id, product_ref: product.id }, '-recorded_at', 1))[0];
    const log = (action, price, mg, prev) => sr.entities.PriceHistory.create({ user_id: user.id, product_ref: product.id, listing_id: l.id, supplier_cost: cost, ebay_price: price, previous_price: prev, margin_estimate: mg, action, recorded_at: new Date().toISOString() });
    const costChanged = !last || Math.abs(Number(last.supplier_cost) - cost) > 0.005;

    if (margin >= floor) {
      await sr.entities.Listing.update(l.id, { margin, supplier_cost: cost });
      if (costChanged) await log(last ? 'cost_change' : 'baseline', l.price, margin, l.price);
      continue;
    }
    const newPrice = m.floorPrice(floor);
    const order = await sr.entities.Order.get(l.order_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (newPrice <= l.price * (1 + MAX_RAISE)) {
      const res = await setEbayPrice(sr, user.id, l, order, newPrice);
      if (!res.ok) { await sr.entities.Listing.update(l.id, { margin, supplier_cost: cost, ebay_note: res.note }); continue; }
      const mg = +m.margin(newPrice).toFixed(1);
      await sr.entities.Listing.update(l.id, { price: newPrice, margin: mg, supplier_cost: cost, ebay_note: res.note });
      await log('price_adjusted', newPrice, mg, l.price);
      events.push({ type: 'report', title: tr(lang, 'rep_title_price', { name: l.title }), message: tr(lang, 'rep_msg_price', { from: l.price, to: newPrice, margin, floor }) });
      adjusted++;
    } else {
      const res = await endEbayListing(sr, user.id, l, order);
      if (!res.ok) { await sr.entities.Listing.update(l.id, { margin, supplier_cost: cost, ebay_note: res.note }); continue; }
      await sr.entities.Listing.update(l.id, { status: 'ended', end_reason: 'margin_below_floor', margin, supplier_cost: cost, ebay_note: res.note });
      await log('delisted', l.price, margin, l.price);
      events.push({ type: 'report', title: tr(lang, 'rep_title_delist', { name: l.title }), message: tr(lang, 'rep_msg_delist', { margin, floor }) });
      delisted++;
    }
  }
  if (events.length) await notifyUser(sr, user, events);
  return { checked: listings.length, adjusted, delisted };
}