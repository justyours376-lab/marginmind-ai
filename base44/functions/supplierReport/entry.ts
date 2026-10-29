import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { verifiedUsSuppliers, MIN_SUPPLIERS, MAX_SUPPLIERS } from '../../shared/suppliers.ts';

// Returns ONLY real, verified US wholesalers/distributors stored in the Supplier records. Nothing is invented.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { product_id } = await req.json();
    const product = product_id ? await base44.entities.Product.get(product_id).catch(() => null) : null;
    if (!product || product.created_by_id !== user.id) return Response.json({ error: 'Invalid product' }, { status: 400 });

    const all = await verifiedUsSuppliers(base44.entities, product.name);
    const suppliers = all.slice(0, MAX_SUPPLIERS);
    return Response.json({ suppliers, count: suppliers.length, min: MIN_SUPPLIERS, shortage: suppliers.length < MIN_SUPPLIERS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}