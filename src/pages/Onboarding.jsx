import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Steps from '@/components/onboarding/Steps';

const titles = ['s1', 's2', 's3', 's4', 's5'];
const filled = (o) => Object.values(o || {}).some((v) => v);

export default function Onboarding() {
  const { t, lang } = useLang();
  const { update } = useMe();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [d, setD] = useState({ channel: 'ebay', creds: {}, source: 'alibaba', srcKey: '', pay: { type: 'card', label: '', last4: '' } });

  const secure = (provider, credentials) => base44.functions.invoke('secureAccount', { provider, credentials });

  const next = async () => {
    setErr(''); setBusy(true);
    try {
      if (step === 1 && filled(d.creds)) await secure(d.channel, d.creds);
      if (step === 2 && d.srcKey) await secure(d.source, { api_key: d.srcKey });
      if (step === 3 && d.pay.label) await secure('payment', d.pay);
      if (step === 4) { await update({ onboarded: true, preferred_language: lang, spend_cap: 200 }); window.location.href = '/'; return; }
      setStep(step + 1);
    } catch (e) { setErr(e?.response?.data?.error || e.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brand text-white shadow-md"><div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" />{t('appName')}</span><LanguageSwitcher /></div></header>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex gap-1.5 mb-6">{titles.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand' : 'bg-border'}`} />)}</div>
        <p className="text-xs font-medium text-muted-foreground">{t('step')} {step + 1}/5</p>
        <h1 className="text-2xl font-bold tracking-tight text-brand mb-5 mt-1">{t(titles[step])}</h1>
        <Steps step={step} d={d} set={setD} />
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        <div className="flex gap-2 mt-8">
          {step > 0 && step < 4 && <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-full border border-brand/30 bg-white text-brand font-medium">{t('back')}</button>}
          <button onClick={next} disabled={busy} className="flex-1 bg-gold text-brand rounded-full py-2.5 font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{step === 4 ? t('go') : t('next')}
          </button>
        </div>
        {step > 0 && step < 4 && <button onClick={() => setStep(step + 1)} className="w-full mt-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-brand hover:bg-brand/5">{t('skip')}</button>}
      </div>
    </div>
  );
}