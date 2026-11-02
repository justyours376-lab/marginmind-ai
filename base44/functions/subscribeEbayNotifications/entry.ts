import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readCreds } from '../../shared/ebayFulfillment.ts';
import { ebayHost } from '../../shared/ebayEnv.ts';

// Events to subscribe to / subscribe गरिने events
const EVENTS = ['ItemListed', 'ItemSold'];
const DEFAULT_TARGET = 'gpttype@gmail.com';

// Pulls <Tag>value</Tag> out of the eBay XML reply / eBay को XML जवाफबाट tag को value निकाल्ने
const pick = (xml, tag) => (xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1] || '';
// Lists every <Errors> block eBay returned / eBay ले फर्काएका सबै error निकाल्ने
const errorsOf = (xml) => [...xml.matchAll(/<Errors>([\s\S]*?)<\/Errors>/g)].map((m) => ({
  code: pick(m[1], 'ErrorCode'), severity: pick(m[1], 'SeverityCode'), message: pick(m[1], 'LongMessage') || pick(m[1], 'ShortMessage'),
}));

// Admin-only. Subscribes the seller's eBay SANDBOX account to Platform Notifications (ItemListed + ItemSold).
// Admin मात्र। sandbox seller लाई ItemListed र ItemSold Platform Notifications मा subscribe गर्छ।
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Step 1: only a signed-in admin may call this / signed-in admin मात्र
    const me = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // The target label is informational: eBay picks the user from the OAuth token, not from an email.
    // Target label मात्र हो: eBay ले user लाई OAuth token बाट चिन्छ, email बाट होइन।
    const body = await req.json().catch(() => ({}));
    const target = typeof body?.target_user === 'string' && body.target_user.length <= 100 ? body.target_user : DEFAULT_TARGET;

    // Step 2: find the saved SANDBOX eBay connection (saved by secureAccount) / सुरक्षित सेभ गरिएको sandbox connection
    const acct = (await base44.entities.ConnectedAccount.filter({ created_by_id: me.id, provider: 'ebay', status: 'connected' }, '-created_date', 1))[0];
    if (!acct?.encrypted_credentials) return Response.json({ ok: false, note: 'ebay_not_connected' }, { status: 400 });
    if (acct.environment !== 'sandbox') return Response.json({ ok: false, note: 'not_sandbox_account' }, { status: 400 });

    // Step 3: decrypt the OAuth token on the server only; it is never logged or returned
    // Token server मै decrypt हुन्छ; log वा response मा कहिल्यै जाँदैन
    const token = (await readCreds(acct.encrypted_credentials)).oauth_token;
    if (!token) return Response.json({ ok: false, note: 'ebay_token_missing' }, { status: 400 });

    // Step 4: build the SetNotificationPreferences request: one Enable entry per event
    // हरेक event को लागि एउटा Enable entry
    const prefs = EVENTS.map((e) => `<NotificationEnable><EventType>${e}</EventType><EventEnable>Enable</EventEnable></NotificationEnable>`).join('');
    const xml = `<?xml version="1.0" encoding="utf-8"?><SetNotificationPreferencesRequest xmlns="urn:ebay:apis:eBLBaseComponents"><PreferenceLevel>User</PreferenceLevel><UserDeliveryPreferenceArray>${prefs}</UserDeliveryPreferenceArray></SetNotificationPreferencesRequest>`;
    const endpoint = `${ebayHost('sandbox')}/ws/api.dll`;
    console.log('subscribeEbayNotifications: calling SetNotificationPreferences', { endpoint, events: EVENTS, target, by: me.email });

    // Step 5: call eBay (Trading API is XML; the OAuth token goes in X-EBAY-API-IAF-TOKEN)
    // eBay Trading API XML हो; OAuth token X-EBAY-API-IAF-TOKEN header मा जान्छ
    const res = await fetch(endpoint, {
      method: 'POST', signal: AbortSignal.timeout(15000), body: xml,
      headers: { 'Content-Type': 'text/xml', 'X-EBAY-API-SITEID': '0', 'X-EBAY-API-COMPATIBILITY-LEVEL': '1193', 'X-EBAY-API-CALL-NAME': 'SetNotificationPreferences', 'X-EBAY-API-IAF-TOKEN': token },
    });
    const text = await res.text();

    // Step 6: read eBay's answer / eBay को जवाफ पढ्ने
    const ack = pick(text, 'Ack');
    const errors = errorsOf(text);
    const ok = res.ok && (ack === 'Success' || ack === 'Warning');
    console.log('subscribeEbayNotifications: eBay replied', { http: res.status, ack, errors });

    // Step 7: return the result without any secret / secret बिना नतिजा फर्काउने
    return Response.json({ ok, target_user: target, events: EVENTS, environment: 'sandbox', ebay: { http_status: res.status, ack, errors, timestamp: pick(text, 'Timestamp') } }, { status: ok ? 200 : 502 });
  } catch (error) {
    console.error('subscribeEbayNotifications failed', error.message);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}