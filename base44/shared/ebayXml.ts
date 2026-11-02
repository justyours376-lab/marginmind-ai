import { secrets } from 'base44:runtime';
import { readCreds } from './ebayFulfillment.ts';

// eBay Platform Notifications arrive as SOAP/XML. This module parses them, verifies their signature and stores the event.
// No XML library is available, so tags are read with small namespace-tolerant patterns.
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const block = (xml, tag) => (xml.match(new RegExp(`<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>`)) || [])[1] || '';
const text = (xml, tag) => decode(block(xml, tag).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim());
const attr = (xml, tag, name) => (xml.match(new RegExp(`<(?:[\\w.-]+:)?${tag}\\s[^>]*?${name}="([^"]*)"`)) || [])[1] || '';

export const sameText = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

// For the debug log only: hides the signature and the seller's tokens.
export const redact = (s) => s.replace(/(<(?:[\w.-]+:)?(?:NotificationSignature|EIASToken|eBayAuthToken|AuthToken)\b[^>]*>)[\s\S]*?(<\/)/g, '$1[redacted]$2');

// Reads the SOAP envelope: signature (header) and event name + event data (body).
export function parseSoapNotification(xml) {
  const body = block(xml, 'Body') || xml;
  const item = block(body, 'Item');
  const txn = block(body, 'Transaction');
  const priceTag = [[txn, 'TransactionPrice'], [item, 'CurrentPrice'], [item, 'StartPrice']].find(([src, t]) => block(src, t));
  const price = priceTag ? Number(text(priceTag[0], priceTag[1])) : NaN;
  const eventType = text(body, 'NotificationEventName');
  return {
    eventType: /^[A-Za-z0-9]{2,60}$/.test(eventType) ? eventType : '',
    signature: text(xml, 'NotificationSignature'),
    timestamp: text(body, 'Timestamp'),
    itemId: text(item, 'ItemID'),
    title: text(item, 'Title').slice(0, 300),
    price: Number.isFinite(price) ? price : null,
    currency: priceTag ? attr(priceTag[0], priceTag[1], 'currencyID') : '',
    quantity: Math.max(1, Math.min(100, Math.floor(Number(text(txn, 'QuantityPurchased'))) || 1)),
    transactionId: text(txn, 'TransactionID'),
    orderId: text(body, 'OrderID'),
    recipientUserId: text(body, 'RecipientUserID'),
  };
}

// Same shape the JSON path produces, so the existing sale / dedupe code handles both.
export function xmlToEvent(p) {
  return {
    kind: p.eventType === 'ItemSold' ? 'sale' : null, topic: p.eventType.toUpperCase(),
    notificationId: `xml:${p.eventType}:${p.itemId}:${p.transactionId}:${p.timestamp}`.slice(0, 200),
    itemId: p.itemId, quantity: p.quantity, ebayOrderId: p.orderId, caseId: '', message: '',
  };
}

// eBay's documented rule: NotificationSignature = base64(MD5(Timestamp + DevID + AppID + CertID)).
// The ids come from the saved eBay connection (DevID from the connection if present, else the EBAY_DEV_ID secret).
export async function verifyXmlSignature(sr, p) {
  try {
    if (!p.signature) return { ok: false, reason: 'signature_missing' };
    if (!p.timestamp) return { ok: false, reason: 'timestamp_missing' };
    let envDev = '';
    try { envDev = secrets.get('EBAY_DEV_ID') || ''; } catch { envDev = ''; }
    const accounts = await sr.entities.ConnectedAccount.filter({ provider: 'ebay', status: 'connected' }, '-created_date', 20);
    let reason = 'no_ebay_account';
    for (const acct of accounts) {
      if (!acct.encrypted_credentials) continue;
      const c = await readCreds(acct.encrypted_credentials);
      const dev = String(c?.dev_id || envDev).trim(), app = String(c?.app_id || '').trim(), cert = String(c?.cert_id || '').trim();
      if (!dev || !app || !cert) { if (reason === 'no_ebay_account') reason = 'dev_id_missing'; continue; }
      const md5 = await crypto.subtle.digest('MD5', new TextEncoder().encode(`${p.timestamp}${dev}${app}${cert}`));
      if (sameText(btoa(String.fromCharCode(...new Uint8Array(md5))), p.signature)) return { ok: true, env: acct.environment === 'sandbox' ? 'sandbox' : 'production' };
      reason = 'signature_mismatch';
    }
    return { ok: false, reason };
  } catch (err) {
    return { ok: false, reason: `verify_error: ${err.message}` };
  }
}

// Saves the parsed event once (eBay retries are recognised by dedupe_key). Returns { duplicate }.
export async function storeXmlEvent(sr, p, ev) {
  if ((await sr.entities.EbayEvent.filter({ dedupe_key: ev.notificationId }, '-created_date', 1)).length) return { duplicate: true };
  const listing = /^[A-Za-z0-9-]{3,40}$/.test(p.itemId) ? (await sr.entities.Listing.filter({ url: { $regex: `/itm/${p.itemId}$` } }, '-created_date', 1))[0] : null;
  await sr.entities.EbayEvent.create({
    event_type: p.eventType || 'Unknown', item_id: p.itemId, title: p.title, currency: p.currency, quantity: p.quantity,
    ...(p.price !== null ? { price: p.price } : {}), ebay_order_id: p.orderId, transaction_id: p.transactionId,
    event_timestamp: p.timestamp, recipient_user_id: p.recipientUserId, user_id: listing?.created_by_id || '', dedupe_key: ev.notificationId, source: 'xml',
  });
  return { duplicate: false };
}