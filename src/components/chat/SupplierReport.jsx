import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function SupplierReport({ s, onRfq, done }) {
  const { t } = useLang();
  const stats = [[t('years'), s.years_in_business], [t('rating'), `${s.rating} ★`], [t('response'), `${s.response_rate}%`], [t('ontime'), `${s.ontime_rate}%`]];
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5 max-w-md">
      <p className="text-xs text-muted-foreground">{t('supplierReport')}</p>
      <p className="font-bold text-brand">{s.name}</p>
      <p className="text-xs text-muted-foreground">{t(s.business_type)}</p>
      <div className="grid grid-cols-2 gap-2 my-3">
        {stats.map(([l, v]) => <div key={l} className="bg-cream rounded-xl p-2"><p className="text-[11px] text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>)}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl font-bold text-brand">{s.reliability_score}<span className="text-sm text-muted-foreground">/100</span></div>
        <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${s.reliability_score}%` }} /></div>
      </div>
      <div className={`flex gap-2 items-start text-xs p-2 rounded-xl ${s.policy_safe ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
        {s.policy_safe ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
        {s.policy_safe ? t('policySafe') : t('policyFail')}
      </div>
      {s.policy_safe && !done && <button onClick={onRfq} className="mt-3 w-full bg-brand text-white rounded-full py-2 text-sm font-semibold">{t('requestRfq')}</button>}
    </div>
  );
}