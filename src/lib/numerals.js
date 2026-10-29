// Shows digits as Nepali numerals when the UI language is Nepali.
export const localNum = (n, lang) => (lang === 'ne' ? String(n).replace(/\d/g, (d) => '०१२३४५६७८९'[d]) : n);