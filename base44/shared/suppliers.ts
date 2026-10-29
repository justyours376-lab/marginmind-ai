// Verified US supplier rules. Suppliers come ONLY from real Supplier records; nothing is generated.
export const MIN_SUPPLIERS = 5;
export const MAX_SUPPLIERS = 10;
const US = ['us', 'usa', 'u.s.', 'u.s.a.', 'united states', 'united states of america'];
const filled = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

export function isVerifiedUs(s: any): boolean {
  return s?.verified === true
    && US.includes(String(s.country || '').trim().toLowerCase())
    && ['wholesaler', 'distributor'].includes(s.business_type)
    && filled(s.name) && filled(s.address) && filled(s.phone) && filled(s.email) && filled(s.website);
}

// Verified US suppliers for a product (matched by product name), best first.
export async function verifiedUsSuppliers(entities: any, productName: string) {
  const rows = await entities.Supplier.filter({ product_name: productName, verified: true }, '-rating', 200);
  return rows.filter(isVerifiedUs).sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
}