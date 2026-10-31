// Adds business days (Mon-Fri, UTC) to a date. Used for eBay handling time and the 3-business-day buyer reply deadline.
// Counts business days (Mon-Fri, UTC) after `from` up to and including `to`'s date.
export function businessDaysBetween(from, to) {
  const d = new Date(from), end = new Date(to);
  d.setUTCHours(0, 0, 0, 0); end.setUTCHours(0, 0, 0, 0);
  let n = 0;
  while (d < end) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}

export function addBusinessDays(from, n) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}