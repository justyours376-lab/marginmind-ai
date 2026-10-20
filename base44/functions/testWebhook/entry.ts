import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Sends a harmless test ping (no order data) to an n8n webhook URL.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { stage, url } = await req.json();
    if (!['trend', 'supplier', 'order', 'sale'].includes(stage)) return Response.json({ ok: false, reason: 'other' });
    const u = String(url || '').trim();
    if (!u) return Response.json({ ok: false, reason: 'empty' });
    let parsed;
    try { parsed = new URL(u); } catch { return Response.json({ ok: false, reason: 'bad_url' }); }
    const host = parsed.hostname.toLowerCase();
    const privateHost = /^(localhost|127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(host) || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.');
    if (parsed.protocol !== 'https:' || privateHost) return Response.json({ ok: false, reason: 'bad_url' });
    try {
      const res = await fetch(u, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ test: true, ping: 'marginmind', stage, user_email: user.email }),
      });
      return res.ok ? Response.json({ ok: true }) : Response.json({ ok: false, reason: 'http', status: res.status });
    } catch (e) {
      return Response.json({ ok: false, reason: e?.name === 'TimeoutError' ? 'timeout' : 'network' });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}