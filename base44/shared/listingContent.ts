// Listing content (titles, descriptions, buyer replies) is English only, whatever language the seller's app is set to.
// The app screens, notifications and emails follow User.preferred_language; nothing that goes to eBay does.
export const ENGLISH_ONLY = 'Write everything in English only (eBay buyers read English), whatever language the seller or buyer text uses.';

// Anything outside Latin letters, digits and normal punctuation (Devanagari, CJK, emoji, ...) is not English.
export function isEnglishOnly(text: unknown): boolean {
  return !/[^\u0000-\u024F\u2010-\u2027\u2030-\u205E\u20AC]/.test(String(text || ''));
}

// The one place a listing title is built. Fixed English template; never translated.
export function buildListingTitle(productName: string): string {
  return `${String(productName).trim()} - Fast Shipping, New`;
}