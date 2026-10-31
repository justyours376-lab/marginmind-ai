// Same rule the server screening uses: only 'signed' with an expiry date of today or later counts as signed.
export const todayStr = () => new Date().toISOString().slice(0, 10);

export function agreementState(a) {
  if (a.status === 'expired') return 'expired';
  if (a.status === 'signed') return a.expiry_date && a.expiry_date < todayStr() ? 'expired' : 'signed';
  return 'draft';
}

export const supplierLabel = (s) => (s ? `${s.name}${s.product_name ? ` · ${s.product_name}` : ''}` : '-');