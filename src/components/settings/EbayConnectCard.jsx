import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import Field from '@/components/onboarding/Field';

const NOTES = ['ebay_app_rejected', 'ebay_token_missing', 'ebay_token_rejected', 'ebay_unreachable', 'ebay_creds_missing'];

// Saves eBay credentials (encrypted on the server) and verifies them with a real call to the chosen eBay environment.
export default function EbayConnectCard() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [env, setEnv] = useState('sandbox');
  const [c, setC] = useState({});
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const set = (k) => (v) => setC((o) => ({ ...o, [k]: v }));
  const go = async () => {
    setBusy(true); setRes(null);
    try { setRes((await base44.functions.invoke('secureAccount', { provider: 'ebay', environment: env, credentials: c })).data); }
    catch (e) { setRes({ error: e?.response?.data?.error || e.message }); }
    setC({}); qc.invalidateQueries(); setBusy(false);
  };
  const msg = !res ? null : res.verified ? t('ebayVerifiedOk') : NOTES.includes(res.note) ? t(res.note) : t('ebay_other');
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5 space-y-3">
      <h2 className="font-semibold text-brand">{t('ebayConnect')}</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {[['sandbox', 'envSandbox'], ['production', 'envLive']].map(([k, l]) => (
          <button key={k} onClick={() => setEnv(k)} className={`rounded-xl border py-2 ${env === k ? 'border-brand bg-emerald-50 font-semibold text-brand' : 'bg-white'}`}>{t(l)}</button>
        ))}
      </div>
      <Field label={t('appId')} value={c.app_id} onChange={set('app_id')} />
      <Field label={t('certId')} type="password" value={c.cert_id} onChange={set('cert_id')} />
      <Field label={t('oauthToken')} type="password" value={c.oauth_token} onChange={set('oauth_token')} />
      <button onClick={go} disabled={busy} className="w-full bg-brand text-white rounded-full py-2.5 font-semibold flex items-center justify-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('connectVerify')}
      </button>
      {msg && <p className={`text-sm ${res.verified ? 'text-emerald-700' : 'text-red-700'}`}>{msg}</p>}
    </section>
  );
}