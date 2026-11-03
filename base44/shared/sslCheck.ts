// SSL certificate expiry monitoring for the app's custom domain.
// The runtime cannot open raw TLS sockets, so the certificate dates come from the public Qualys SSL Labs API (HTTPS fetch only).
// A fresh assessment takes 1-3 minutes; a recent one (up to 48h old) is reused. No secrets or tokens are involved or logged.
const API = 'https://api.ssllabs.com/api/v3/analyze';
const WARN_DAYS = 30;
const POLL_MS = 10000;
const BUDGET_MS = 210000;
const SUBJECT = 'MarginMind AI: SSL certificate expiry warning';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Never throws: { ok: true, expiresAt, daysRemaining } or { ok: false, error }.
export async function checkSslExpiry(host) {
  try {
    const started = Date.now();
    let url = `${API}?host=${encodeURIComponent(host)}&fromCache=on&maxAge=48&all=done`;
    while (Date.now() - started < BUDGET_MS) {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return { ok: false, error: `ssl_service_http_${res.status}` };
      const j = await res.json();
      if (j.status === 'ERROR') return { ok: false, error: `assessment_error: ${String(j.statusMessage || '').slice(0, 80)}` };
      if (j.status === 'READY') {
        // The certificate for the host itself (not the issuer chain). If several servers answer, the earliest expiry counts.
        const leaf = (j.certs || []).filter((c) => String(c.subject || '').toLowerCase().includes(`cn=${host.toLowerCase()}`));
        const ends = leaf.map((c) => Number(c.notAfter)).filter((n) => Number.isFinite(n));
        if (!ends.length) return { ok: false, error: 'no_certificate_found' };
        const exp = Math.min(...ends);
        return { ok: true, expiresAt: new Date(exp).toISOString(), daysRemaining: Math.floor((exp - Date.now()) / 864e5) };
      }
      url = `${API}?host=${encodeURIComponent(host)}&all=done`;
      await sleep(POLL_MS);
    }
    return { ok: false, error: 'timeout' };
  } catch (err) {
    return { ok: false, error: `check_failed: ${String(err.message || err).slice(0, 80)}` };
  }
}

const day = (d) => d.toISOString().slice(0, 10);

function buildBody(host, now, r) {
  const intro = r.ok
    ? `<p>The SSL certificate for <b>${host}</b> expires soon.</p>`
    : `<p><b>The SSL certificate check for ${host} failed</b> (${r.error}). The certificate may be fine, but it could not be verified this week.</p>`;
  const facts = `<ul><li>Current date: ${day(now)}</li><li>Certificate expiry date: ${r.ok ? day(new Date(r.expiresAt)) : 'unknown'}</li><li>Days remaining: ${r.ok ? r.daysRemaining : 'unknown'}</li></ul>`;
  const how = '<p>To renew: open your domain registrar and check that the domain and its DNS records are active, or open the Domains section of the Base44 dashboard and re-check the custom domain connection. Certificates are normally renewed automatically once the domain is connected correctly.</p>';
  return `${intro}${facts}${how}`;
}

// Weekly step: check the certificate, email the operator(s) when it expires within 30 days or the check failed.
// Operators are the admin users with a notification email saved in Settings. Returns a compact summary.
export async function runSslStep(sr, host) {
  const r = await checkSslExpiry(host);
  console.log(`weeklyJobs ssl: ${r.ok ? `cert_days_remaining=${r.daysRemaining}` : `cert_check_failed (${r.error})`}`);
  const summary = r.ok ? { cert_days_remaining: r.daysRemaining, expires_at: r.expiresAt } : { cert_days_remaining: null, cert_check_failed: true, error: r.error };
  if (r.ok && r.daysRemaining > WARN_DAYS) return { ...summary, warned: 0 };

  const admins = await sr.entities.User.filter({ role: 'admin' }, '-created_date', 50);
  const recipients = [...new Set(admins.map((a) => String(a.notification_email || '').trim()).filter(Boolean))];
  if (!recipients.length) {
    console.warn('weeklyJobs ssl: no operator notification email is configured, warning email not sent');
    return { ...summary, warned: 0, no_recipient: true };
  }
  const body = buildBody(host, new Date(), r);
  let warned = 0;
  for (const to of recipients) {
    try {
      await sr.integrations.Core.SendEmail({ to, subject: SUBJECT, body, category: 'transactional' });
      warned++;
    } catch (err) {
      console.log('weeklyJobs ssl: warning email failed', String(err.message || err).slice(0, 120));
    }
  }
  return { ...summary, warned };
}