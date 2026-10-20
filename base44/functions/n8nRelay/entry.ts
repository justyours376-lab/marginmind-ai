import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// stage: 'trend' | 'supplier'. Returns { demo: true } when the user's webhook isn't set.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { stage, payload } = await req.json();
    if (!['trend', 'supplier'].includes(stage)) return Response.json({ error: 'Bad stage' }, { status: 400 });
    const url = user.webhooks?.[stage];
    if (!url) return Response.json({ demo: true });
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, user_email: user.email, language: user.language }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return Response.json({ error: `n8n returned ${res.status}` }, { status: 502 });
    return Response.json({ demo: false, data: await res.json() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}