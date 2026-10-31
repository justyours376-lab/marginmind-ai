import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Returns only the connection flags for the signed-in user's eBay account. Never returns credentials, hints or tokens.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = await base44.entities.ConnectedAccount.filter({ created_by_id: user.id, provider: 'ebay' });
    const a = rows[0];
    return Response.json({
      connected: !!a && a.status === 'connected',
      connection_verified: !!a && a.connection_verified === true,
      last_verified_at: a?.last_verified_at ?? null,
      environment: a?.environment ?? null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}