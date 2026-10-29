// Raw trending-product candidate pool (demo data, server-side only).
// Rows: [name, ebay_price, supplier_cost, shipping]. The pool deliberately contains items that eBay
// prohibits/restricts; they are removed by the eBay policy filter and never reach a buyable list.
// Whether an item is actually offered is decided later by real Supplier records, never by this file.
const u = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

type Row = [string, number, number, number];
export type Track = 'branded' | 'generic' | 'seasonal';
export const TRACKS: Track[] = ['branded', 'generic', 'seasonal'];
// Category letter -> Product.niche value.
export const CATEGORIES: Record<string, string> = { A: 'cosmetics', B: 'home', C: 'sporting', D: 'apparel' };

const IMGS: Record<string, string[]> = {
  cosmetics: ['photo-1556228578-8c89e6adf883', 'photo-1522335789203-aabd1fc54bc9', 'photo-1596462502278-27bfdc403348', 'photo-1571781926291-c477ebfd024b', 'photo-1512496015851-a90fb38ba796', 'photo-1586495777744-4413f21062fa', 'photo-1620916566398-39f1143ab7be'],
  home: ['photo-1513694203232-719a280e022f', 'photo-1555041469-a586c61ea9bc', 'photo-1507473885765-e6ed057f782c', 'photo-1556911220-bff31c812dba', 'photo-1484101403633-562f891dc89a', 'photo-1493663284031-b7e3aefcae8e', 'photo-1524758631624-e2822e304c36'],
  sporting: ['photo-1517836357463-d25dfeac3438', 'photo-1571019613454-1cb2f99b2d8b', 'photo-1518611012118-696072aa579a', 'photo-1534438327276-14e5300c3a48'],
  apparel: ['photo-1521572163474-6864f9cf17ab', 'photo-1489987707025-afc232f7ea0f', 'photo-1512436991641-6745cdb1723f', 'photo-1523381210434-271e8be1f52b', 'photo-1542291026-7eec264c27ff'],
};

type Cat = { risky: Row[]; generic: Row[]; branded: Row[]; seasonal: Row[] };
const DATA: Record<string, Cat> = {
  cosmetics: {
    risky: [['Replica Designer Perfume Set', 39.99, 3.2, 3.0], ['Prescription Strength Tretinoin Acne Cream', 34.99, 4.0, 3.5], ['Slimming Herbal Supplement Gummies', 29.99, 2.5, 2.8]],
    generic: [['Vitamin C Brightening Serum', 24.99, 3.1, 4.2], ['Jade Face Roller Set', 19.99, 2.4, 3.5], ['Hyaluronic Acid Moisturizer', 22.5, 3.6, 4.0], ['Silicone Makeup Brush Set', 17.99, 2.9, 3.8], ['Matte Liquid Lipstick 6-Pack', 21.99, 3.2, 3.2], ['Under-Eye Gold Patches (30)', 15.99, 1.8, 2.9], ['Retinol Night Cream', 27.99, 4.1, 4.5], ['Nail Gel Polish Kit', 29.99, 6.2, 5.5], ['Bamboo Charcoal Face Mask', 14.99, 1.6, 2.8], ['Heated Eyelash Curler', 18.99, 3.4, 3.6], ['Rose Water Facial Mist', 13.99, 1.9, 3.9], ['Ice Roller for Face', 12.99, 1.5, 2.6]],
    branded: [['Neutrogena Hydro Boost Water Gel', 24.99, 11.5, 4.0], ['CeraVe Moisturizing Cream 16oz', 27.99, 13.0, 4.5], ['Maybelline Lash Sensational Mascara', 14.99, 6.2, 3.0], ["L'Oreal Revitalift Eye Cream", 26.99, 12.4, 3.5], ['Olay Regenerist Micro-Sculpting Cream', 32.99, 16.0, 4.0]],
    seasonal: [['Winter Shea Butter Lip Balm Set', 13.99, 2.6, 2.4], ['SPF 50 Sunscreen Stick', 15.99, 3.8, 3.0], ['Holiday Gift Bath Bomb Set', 19.99, 4.4, 4.6], ['Cold-Weather Hand Cream Trio', 17.99, 3.5, 3.4], ['Summer Cooling Body Mist', 14.99, 2.9, 3.2]],
  },
  home: {
    risky: [['Pepper Spray Keychain 2-Pack', 24.99, 2.0, 2.2], ['Butane Lighter Fluid Refill 6-Pack', 22.99, 2.6, 3.0], ['Disposable Vape Pen Set', 31.99, 3.0, 2.5]],
    generic: [['Sunset Projection Lamp', 26.99, 5.2, 5.8], ['Floating Wall Shelves (3)', 32.99, 7.1, 8.5], ['Motion Sensor LED Strip', 19.99, 3.3, 3.4], ['Electric Milk Frother', 16.99, 2.8, 3.6], ['Linen Throw Pillow Covers', 18.5, 2.6, 3.9], ['Ceramic Plant Pot Set', 29.99, 6.5, 8.9], ['Over-Sink Dish Rack', 34.99, 8.1, 9.2], ['Smart Mini Humidifier', 23.99, 4.0, 4.3], ['Vegetable Chopper Pro', 21.99, 4.4, 5.1], ['Blackout Curtain Pair', 31.99, 7.6, 7.4], ['Magnetic Spice Jars (12)', 27.5, 5.9, 6.0], ['Rattan Storage Basket', 24.99, 5.0, 7.2]],
    branded: [['Yankee Candle Large Jar Candle', 24.99, 11.0, 5.5], ['Rubbermaid Brilliance Storage Set', 29.99, 14.5, 7.0], ['Pyrex Glass Baking Dish Set', 31.99, 15.5, 8.0], ['OXO Good Grips Salad Spinner', 27.99, 13.0, 6.5], ['Command Adhesive Hooks 24-Pack', 12.99, 5.2, 2.5]],
    seasonal: [['Christmas Tree LED Light String', 21.99, 4.2, 4.5], ['Halloween Pumpkin Door Wreath', 24.99, 5.6, 6.2], ['Garden Solar Pathway Lights (8)', 29.99, 7.0, 7.5], ['Winter Fleece Throw Blanket', 26.99, 6.2, 6.6], ['Patio Citronella Candle Set', 18.99, 3.9, 4.8]],
  },
  sporting: {
    risky: [['Airsoft Spring Pistol Kit', 34.99, 6.0, 5.0], ['Pre-Workout Protein Powder Tub', 39.99, 9.0, 6.0], ['Hunting Slingshot Kit', 16.99, 3.0, 3.0]],
    generic: [['Resistance Bands Set (5)', 19.99, 3.2, 3.0], ['Yoga Mat Non-Slip 6mm', 24.99, 5.8, 6.5], ['Adjustable Jump Rope', 12.99, 1.9, 2.4], ['Foam Roller Deep Tissue', 22.99, 4.6, 6.8], ['Stainless Steel Water Bottle 32oz', 21.99, 4.9, 5.2], ['Ab Wheel Roller with Knee Pad', 18.99, 3.5, 4.8], ['Gym Gloves Padded Pair', 14.99, 2.4, 2.6], ['Cycling Phone Handlebar Mount', 15.99, 2.7, 3.0], ['Hand Grip Strengthener Set', 11.99, 1.7, 2.2], ['Shaker Bottle with Mixer Ball', 13.99, 2.2, 3.4]],
    branded: [['Nike Dri-FIT Training Headband', 17.99, 8.0, 2.8], ['Adidas Performance Gym Sack', 21.99, 10.5, 4.0], ['Wilson Pro Staff Tennis Overgrip 12-Pack', 22.99, 10.0, 3.2], ['Under Armour Compression Sleeve', 24.99, 11.5, 3.0], ['Hydro Flask 24oz Water Bottle', 34.99, 17.5, 6.0]],
    seasonal: [['Winter Ski Goggles Anti-Fog', 29.99, 7.2, 5.6], ['Thermal Running Gloves Touchscreen', 16.99, 3.0, 2.8], ['Inflatable Pool Float Lounger', 22.99, 4.8, 6.0], ['Camping Hammock with Straps', 26.99, 6.0, 5.4], ['Beach Flying Disc Set (3)', 14.99, 2.4, 3.0]],
  },
  apparel: {
    risky: [['Replica Designer Handbag', 49.99, 8.0, 5.0], ['Real Fur Pom Beanie', 29.99, 6.0, 3.5], ['Carved Ivory Bracelet', 39.99, 7.0, 2.5]],
    generic: [['Cotton Crew Neck T-Shirt 3-Pack', 24.99, 7.5, 4.5], ['Silk Satin Scrunchies (6)', 11.99, 1.6, 2.0], ['Polarized Sport Sunglasses', 18.99, 3.4, 3.0], ['Minimalist Leather Wallet', 21.99, 4.8, 3.2], ['Crossbody Phone Bag', 19.99, 4.2, 3.6], ['Cotton Ankle Socks 10-Pack', 15.99, 3.4, 3.6], ['Stainless Steel Chain Necklace', 16.99, 2.4, 2.4], ['Waterproof Baseball Cap', 14.99, 2.8, 3.0], ['Women Seamless Leggings', 22.99, 6.2, 4.4], ['Men Quick-Dry Shorts', 20.99, 5.4, 4.2], ['Canvas Tote Bag', 12.99, 2.1, 3.0]],
    branded: [["Levi's 501 Original Jeans", 59.99, 32.0, 7.0], ['Hanes ComfortSoft Tees 6-Pack', 29.99, 14.5, 5.5], ['Carhartt Knit Watch Hat', 21.99, 10.0, 3.0], ['Fruit of the Loom Boxer Briefs 5-Pack', 24.99, 11.5, 4.6], ['Champion Reverse Weave Hoodie', 49.99, 26.0, 7.5]],
    seasonal: [['Winter Thermal Fleece Gloves', 17.99, 3.2, 3.0], ['Waterproof Rain Poncho Adult', 12.99, 2.0, 2.8], ['Wool Blend Scarf', 19.99, 4.4, 3.4], ['Summer Straw Sun Hat', 18.99, 3.6, 4.2], ['Holiday Ugly Sweater Unisex', 29.99, 8.2, 6.4]],
  },
};

export const ebayFee = (price: number) => +(price * 0.136 + 0.3).toFixed(2);
export const calcProfit = (price: number, cost: number, ship: number) => +(price - cost - ship - ebayFee(price)).toFixed(2);

const build = (rows: Row[], niche: string) => rows.map(([name, price, cost, ship], i) => {
  const profit = calcProfit(price, cost, ship);
  const imgs = IMGS[niche];
  return { name, niche, image_url: u(imgs[i % imgs.length]), ebay_price: price, alibaba_cost: cost, shipping: ship, ebay_fee: ebayFee(price), profit, margin: +((profit / price) * 100).toFixed(1) };
});

// Candidate pool for one track + category letter, before any eBay screening.
// The category's risky items are included so the eBay policy filter is always exercised.
export function candidatePool(track: Track, letter: string) {
  const niche = CATEGORIES[letter];
  const cat = DATA[niche];
  if (!cat || !TRACKS.includes(track)) return [];
  return build([...cat.risky, ...cat[track]], niche);
}

// Every risky candidate across all categories (used only for the view-only "Banned at eBay" track).
export function riskyPool() {
  return Object.entries(DATA).flatMap(([niche, c]) => build(c.risky, niche));
}