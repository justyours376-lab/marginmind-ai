import { readCreds } from './ebayFulfillment.ts';

const itemIdOf = (url) => (String(url || '').match(/\/itm\/([A-Za-z0-9-]+)$/) || [])[1] || '';
// Demo listings (link contains /itm/demo-) are simulated: no real eBay call.
export const isDemoListing = (listing, order) => order?.demo === true || /\/itm\/demo-/.test(listing?.url || '');

// Calls one eBay Trading API method for a listing. Returns { ok, note }; note is a short result code.
async function tradingCall(sr, userId, listing, order, name, inner) {
  if (isDemoListing(listing, order)) return { ok: true, note: 'demo' };
  const id = itemIdOf(listing.url);
  if (!id) return { ok: false, note: 'no_item_id' };
  const acct = (await sr.entities.ConnectedAccount.filter({ created_by_id: userId, provider: 'ebay', status: 'connected' }, '-created_date', 1))[0];
  if (!acct?.encrypted_credentials) return { ok: false, note: 'ebay_not_connected' };
  try {
    const token = (await readCreds(acct.encrypted_credentials)).oauth_token;
    if (!token) return { ok: false, note: 'ebay_not_connected' };
    const body = `<?xml version="1.0" encoding="utf-8"?><${name}Request xmlns="urn:ebay:apis:eBLBaseComponents">${inner(id)}</${name}Request>`;
    const res = await fetch('https://api.ebay.com/ws/api.dll', {
      method: 'POST', signal: AbortSignal.timeout(15000), body,
      headers: { 'Content-Type': 'text/xml', 'X-EBAY-API-SITEID': '0', 'X-EBAY-API-COMPATIBILITY-LEVEL': '1193', 'X-EBAY-API-CALL-NAME': name, 'X-EBAY-API-IAF-TOKEN': token },
    });
    const text = await res.text();
    if (res.status === 401 || res.status === 403 || /<ErrorCode>(931|932)<\/ErrorCode>/.test(text)) return { ok: false, note: 'ebay_auth_failed' };
    if (!res.ok || !/<Ack>(Success|Warning)<\/Ack>/.test(text)) return { ok: false, note: 'ebay_error' };
    return { ok: true, note: 'updated' };
  } catch (err) {
    console.log('ebay trading call failed', name, err.message);
    return { ok: false, note: 'ebay_unreachable' };
  }
}

export const setEbayQuantityZero = (sr, userId, listing, order) =>
  tradingCall(sr, userId, listing, order, 'ReviseInventoryStatus', (id) => `<InventoryStatus><ItemID>${id}</ItemID><Quantity>0</Quantity></InventoryStatus>`);

export const setEbayPrice = (sr, userId, listing, order, price) =>
  tradingCall(sr, userId, listing, order, 'ReviseInventoryStatus', (id) => `<InventoryStatus><ItemID>${id}</ItemID><StartPrice>${Number(price).toFixed(2)}</StartPrice></InventoryStatus>`);

export const endEbayListing = (sr, userId, listing, order) =>
  tradingCall(sr, userId, listing, order, 'EndFixedPriceItem', (id) => `<ItemID>${id}</ItemID><EndingReason>NotAvailable</EndingReason>`);