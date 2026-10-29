import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { verifiedUsSuppliers, nonUsSuppliers, MAX_SUPPLIERS } from '../../shared/suppliers.ts';

// Returns ONLY real supplier records: qualified US wholesalers (group 'us') or non-US suppliers for view only ('nonus').
// At most 4, best first. Fewer qualified suppliers means a shorter list; nothing is padded or invented.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { product_id, group } = await req.json();
    const product = product_id ? await base44.entities.Product.get(product_id).catch(() => null) : null;
    if (!product || product.created_by_id !== user.id) return Response.json({ error: 'Invalid product' }, { status: 400 });

    const all = group === 'nonus' ? await nonUsSuppliers(base44.entities, product.name) : await verifiedUsSuppliers(base44.entities, product.name);
    const suppliers = all.slice(0, MAX_SUPPLIERS);
    return Response.json({ suppliers, count: suppliers.length, max: MAX_SUPPLIERS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}