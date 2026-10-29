// Raw trending-product candidate pool (demo data, server-side only).
// Rows: [name, ebay_price, supplier_cost, shipping]. The pool deliberately contains items that eBay
// prohibits/restricts; they are removed by the eBay policy filter and never reach the client.
const u = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;
const cosImgs = ['photo-1556228578-8c89e6adf883', 'photo-1522335789203-aabd1fc54bc9', 'photo-1596462502278-27bfdc403348', 'photo-1571781926291-c477ebfd024b', 'photo-1512496015851-a90fb38ba796', 'photo-1586495777744-4413f21062fa', 'photo-1620916566398-39f1143ab7be'];
const homeImgs = ['photo-1513694203232-719a280e022f', 'photo-1555041469-a586c61ea9bc', 'photo-1507473885765-e6ed057f782c', 'photo-1556911220-bff31c812dba', 'photo-1484101403633-562f891dc89a', 'photo-1493663284031-b7e3aefcae8e', 'photo-1524758631624-e2822e304c36'];

type Row = [string, number, number, number];
const cosRisky: Row[] = [['Replica Designer Perfume Set', 39.99, 3.2, 3.0], ['Prescription Strength Tretinoin Acne Cream', 34.99, 4.0, 3.5], ['Slimming Herbal Supplement Gummies', 29.99, 2.5, 2.8]];
const cos: Row[] = [['Vitamin C Brightening Serum', 24.99, 3.1, 4.2], ['Jade Face Roller Set', 19.99, 2.4, 3.5], ['Hyaluronic Acid Moisturizer', 22.5, 3.6, 4.0], ['Silicone Makeup Brush Set', 17.99, 2.9, 3.8], ['Matte Liquid Lipstick 6-Pack', 21.99, 3.2, 3.2], ['Under-Eye Gold Patches (30)', 15.99, 1.8, 2.9], ['Retinol Night Cream', 27.99, 4.1, 4.5], ['Nail Gel Polish Kit', 29.99, 6.2, 5.5], ['Bamboo Charcoal Face Mask', 14.99, 1.6, 2.8], ['Heated Eyelash Curler', 18.99, 3.4, 3.6], ['Rose Water Facial Mist', 13.99, 1.9, 3.9], ['Ice Roller for Face', 12.99, 1.5, 2.6]];
const homRisky: Row[] = [['Pepper Spray Keychain 2-Pack', 24.99, 2.0, 2.2], ['Butane Lighter Fluid Refill 6-Pack', 22.99, 2.6, 3.0], ['Disposable Vape Pen Set', 31.99, 3.0, 2.5]];
const hom: Row[] = [['Sunset Projection Lamp', 26.99, 5.2, 5.8], ['Floating Wall Shelves (3)', 32.99, 7.1, 8.5], ['Motion Sensor LED Strip', 19.99, 3.3, 3.4], ['Electric Milk Frother', 16.99, 2.8, 3.6], ['Linen Throw Pillow Covers', 18.5, 2.6, 3.9], ['Ceramic Plant Pot Set', 29.99, 6.5, 8.9], ['Over-Sink Dish Rack', 34.99, 8.1, 9.2], ['Smart Mini Humidifier', 23.99, 4.0, 4.3], ['Vegetable Chopper Pro', 21.99, 4.4, 5.1], ['Blackout Curtain Pair', 31.99, 7.6, 7.4], ['Magnetic Spice Jars (12)', 27.5, 5.9, 6.0], ['Rattan Storage Basket', 24.99, 5.0, 7.2]];

export const ebayFee = (price: number) => +(price * 0.136 + 0.3).toFixed(2);
export const calcProfit = (price: number, cost: number, ship: number) => +(price - cost - ship - ebayFee(price)).toFixed(2);

const build = (rows: Row[], niche: string, imgs: string[]) => rows.map(([name, price, cost, ship], i) => {
  const profit = calcProfit(price, cost, ship);
  return { name, niche, image_url: u(imgs[i % imgs.length]), ebay_price: price, alibaba_cost: cost, shipping: ship, ebay_fee: ebayFee(price), profit, margin: +((profit / price) * 100).toFixed(1) };
});

// Candidate pool for a niche, before any eBay screening. Risky items are placed first so they would
// land in the visible top 12 if the filter were ever skipped.
export function candidatePool(niche: string) {
  const c = build([...cosRisky, ...cos], 'cosmetics', cosImgs);
  const h = build([...homRisky, ...hom], 'home', homeImgs);
  if (niche === 'profitable') return [...c, ...h].sort((a, b) => b.margin - a.margin);
  return niche === 'cosmetics' ? c : niche === 'home' ? h : [];
}