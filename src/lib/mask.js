// Display-only masking for demos and screen sharing. Stored values are never changed.
export function maskEmail(v) {
  if (!v) return '';
  const at = v.lastIndexOf('@');
  if (at < 1) return maskId(v);
  const local = v.slice(0, at);
  const last = local.length > 1 ? local.slice(-1) : '';
  return `${local[0]}****${last}${v.slice(at)}`;
}

// App ID and Cert ID: first 2 + last 2 characters stay visible.
export function maskId(v) {
  if (!v) return '';
  if (v.length <= 4) return '*'.repeat(v.length);
  return `${v.slice(0, 2)}${'*'.repeat(v.length - 4)}${v.slice(-2)}`;
}

// OAuth tokens are fully masked.
export function maskToken(v) {
  return v ? '*****' : '';
}

export const maskers = { email: maskEmail, id: maskId, token: maskToken };