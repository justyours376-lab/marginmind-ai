// Supplier rules. Suppliers come ONLY from real Supplier records; nothing is generated or guessed.
export const MIN_SUPPLIERS = 5;
export const MAX_SUPPLIERS = 5;
const US = ['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'united states of america'];
const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
const isUsCountry = (s: any) => US.includes(String(s?.country || '').trim().toLowerCase());

// US group: US-based, verified wholesaler/distributor, eBay-registered, eBay-listable and NOT eBay-restricted.
// A missing eBay field means "cannot be verified" and the supplier is excluded (never guessed).
export function isVerifiedUs(s: any): boolean {
  return s?.verified === true
    && isUsCountry(s)
    && ['wholesaler', 'distributor'].includes(s.business_type)
    && s.ebay_registered === true
    && s.ebay_listable === true
    && s.ebay_restricted === false
    && filled(s.name) && filled(s.address) && filled(s.phone) && filled(s.email) && filled(s.website);
}

// Non-US group (view only): a real supplier record with a non-US country that is not flagged eBay-restricted.
export function isNonUs(s: any): boolean {
  return filled(s?.name) && filled(s?.country) && !isUsCountry(s) && s.ebay_restricted !== true;
}

const byRating = (a: any, b: any) => (b.rating || 0) - (a.rating || 0);

// Verified US suppliers for a product (matched by product name), best first.
export async function verifiedUsSuppliers(entities: any, productName: string) {
  const rows = await entities.Supplier.filter({ product_name: productName, verified: true }, '-rating', 200);
  return rows.filter(isVerifiedUs).sort(byRating);
}

// Non-US suppliers for a product (view only), best first.
export async function nonUsSuppliers(entities: any, productName: string) {
  const rows = await entities.Supplier.filter({ product_name: productName }, '-rating', 200);
  return rows.filter(isNonUs).sort(byRating);
}