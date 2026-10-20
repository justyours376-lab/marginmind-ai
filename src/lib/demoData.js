// Built-in DEMO data used until n8n webhooks are connected.
const u = (id) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;
const cosImgs = ['photo-1556228578-8c89e6adf883', 'photo-1522335789203-aabd1fc54bc9', 'photo-1596462502278-27bfdc403348', 'photo-1571781926291-c477ebfd024b', 'photo-1512496015851-a90fb38ba796', 'photo-1586495777744-4413f21062fa', 'photo-1620916566398-39f1143ab7be'];
const homeImgs = ['photo-1513694203232-719a280e022f', 'photo-1555041469-a586c61ea9bc', 'photo-1507473885765-e6ed057f782c', 'photo-1556911220-bff31c812dba', 'photo-1484101403633-562f891dc89a', 'photo-1493663284031-b7e3aefcae8e', 'photo-1524758631624-e2822e304c36'];

const cos = [['Vitamin C Brightening Serum', 24.99, 3.1, 4.2], ['Jade Face Roller Set', 19.99, 2.4, 3.5], ['Hyaluronic Acid Moisturizer', 22.5, 3.6, 4.0], ['Silicone Makeup Brush Set', 17.99, 2.9, 3.8], ['Matte Liquid Lipstick 6-Pack', 21.99, 3.2, 3.2], ['Under-Eye Gold Patches (30)', 15.99, 1.8, 2.9], ['Retinol Night Cream', 27.99, 4.1, 4.5], ['Nail Gel Polish Kit', 29.99, 6.2, 5.5], ['Bamboo Charcoal Face Mask', 14.99, 1.6, 2.8], ['Heated Eyelash Curler', 18.99, 3.4, 3.6], ['Rose Water Facial Mist', 13.99, 1.9, 3.9], ['Ice Roller for Face', 12.99, 1.5, 2.6]];
const hom = [['Sunset Projection Lamp', 26.99, 5.2, 5.8], ['Floating Wall Shelves (3)', 32.99, 7.1, 8.5], ['Motion Sensor LED Strip', 19.99, 3.3, 3.4], ['Electric Milk Frother', 16.99, 2.8, 3.6], ['Linen Throw Pillow Covers', 18.5, 2.6, 3.9], ['Ceramic Plant Pot Set', 29.99, 6.5, 8.9], ['Over-Sink Dish Rack', 34.99, 8.1, 9.2], ['Smart Mini Humidifier', 23.99, 4.0, 4.3], ['Vegetable Chopper Pro', 21.99, 4.4, 5.1], ['Blackout Curtain Pair', 31.99, 7.6, 7.4], ['Magnetic Spice Jars (12)', 27.5, 5.9, 6.0], ['Rattan Storage Basket', 24.99, 5.0, 7.2]];

export const ebayFee = (price) => +(price * 0.136 + 0.3).toFixed(2);
// Gross profit, returns reserve, profit after reserve, and margin % (margin uses after-reserve profit).
export const withReserve = (profit, price, pct = 5) => {
  const reserve = +((price * pct) / 100).toFixed(2);
  const net = +(profit - reserve).toFixed(2);
  return { gross: profit, reserve, net, margin: price ? +((net / price) * 100).toFixed(1) : 0 };
};
export const calcProfit = (price, cost, ship) => +(price - cost - ship - ebayFee(price)).toFixed(2);

const build = (rows, niche, imgs) => rows.map(([name, price, cost, ship], i) => {
  const profit = calcProfit(price, cost, ship);
  return { demo_id: `${niche}-${i}`, name, niche, image_url: u(imgs[i % imgs.length]), ebay_price: price, alibaba_cost: cost, shipping: ship, ebay_fee: ebayFee(price), profit, margin: +((profit / price) * 100).toFixed(1) };
});

const ALL = [...build(cos, 'cosmetics', cosImgs), ...build(hom, 'home', homeImgs)];

export function demoProducts(niche) {
  if (niche === 'profitable') return [...ALL].sort((a, b) => b.margin - a.margin).slice(0, 12);
  return ALL.filter((p) => p.niche === niche);
}

const names = ['Guangzhou Bloom Cosmetics Mfg.', 'Yiwu Homestar Trading Co.', 'Shenzhen Lumi Industrial', 'Ningbo Everclean Wholesale', 'Hangzhou Pure Beauty Factory', 'Dongguan Nest Home Mfg.'];
export function demoSupplier(product) {
  const h = [...product.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const years = 3 + (h % 12), rating = +(4.2 + (h % 8) / 10).toFixed(1), response = 85 + (h % 15), ontime = 88 + (h % 12);
  const business_type = h % 7 === 0 ? 'trading_retail' : h % 2 ? 'manufacturer' : 'wholesaler';
  const reliability = Math.min(100, Math.round(years * 2 + rating * 8 + response * 0.2 + ontime * 0.25));
  return { name: names[h % names.length], years_in_business: years, rating, response_rate: response, ontime_rate: ontime, reliability_score: reliability, business_type, policy_safe: business_type !== 'trading_retail' };
}

export function demoQuote(product) {
  const qty = 20;
  const unit = +(product.alibaba_cost * 0.95).toFixed(2);
  return { quantity: qty, unit_price: unit, shipping_total: +(product.shipping * qty * 0.6).toFixed(2), total: +(unit * qty + product.shipping * qty * 0.6).toFixed(2), lead_days: 7 };
}