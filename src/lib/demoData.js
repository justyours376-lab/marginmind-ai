// Client-side helpers. The product candidate catalog and its eBay screening live on the server (scanProducts).
export const ebayFee = (price) => +(price * 0.136 + 0.3).toFixed(2);
// Gross profit, returns reserve, profit after reserve, and margin % (margin uses after-reserve profit).
export const withReserve = (profit, price, pct = 5) => {
  const reserve = +((price * pct) / 100).toFixed(2);
  const net = +(profit - reserve).toFixed(2);
  return { gross: profit, reserve, net, margin: price ? +((net / price) * 100).toFixed(1) : 0 };
};
export const calcProfit = (price, cost, ship) => +(price - cost - ship - ebayFee(price)).toFixed(2);

export function demoQuote(product) {
  const qty = 20;
  const unit = +(product.alibaba_cost * 0.95).toFixed(2);
  return { quantity: qty, unit_price: unit, shipping_total: +(product.shipping * qty * 0.6).toFixed(2), total: +(unit * qty + product.shipping * qty * 0.6).toFixed(2), lead_days: 7 };
}