// The "Agent Scan" workflow runs at minute 0 of every even UTC hour (cron "0 */2 * * *"). Returns the next run as a Date.
export function nextScan(now = Date.now()) {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours(Math.floor(d.getUTCHours() / 2) * 2 + 2);
  return d;
}

const LOCALES = { ne: 'ne-NP', hi: 'hi-IN', en: 'en-US' };
export const fmtWhen = (date, lang) => new Date(date).toLocaleString(LOCALES[lang] || 'en-US', { dateStyle: 'medium', timeStyle: 'short' });