import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useLang } from '@/lib/i18n';

const num = (v, f) => (typeof v === 'number' ? f(v) : '—');

export default function SupplierCard({ s, onRfq, done }) {
  const { t } = useLang();
  const stats = [[t('years'), num(s.years_in_business, (v) => v)], [t('rating'), num(s.rating, (v) => `${v} ★`)], [t('response'), num(s.response_rate, (v) => `${v}%`)], [t('ontime'), num(s.ontime_rate, (v) => `${v}%`)],
    [t('delivery'), num(s.delivery_days_us, (v) => t('daysN', { n: v }))]];
  const contact = [[t('address'), s.address], [t('phone'), s.phone], [t('emailLabel'), s.email], [t('website'), s.website]];
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5 max-w-md">
      <p className="font-bold text-brand">{s.name}</p>
      <p className="text-xs text-muted-foreground">{t(s.business_type)} · US</p>
      <div className="text-xs space-y-0.5 mt-2 break-words">
        {contact.map(([l, v]) => <p key={l}><span className="text-muted-foreground">{l}: </span>{v}</p>)}
      </div>
      <div className="grid grid-cols-2 gap-2 my-3">
        {stats.map(([l, v]) => <div key={l} className="bg-cream rounded-xl p-2"><p className="text-[11px] text-muted-foreground">{l}</p><p className="font-semibold">{v}</p></div>)}
      </div>
      {typeof s.reliability_score === 'number' && (
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold text-brand">{s.reliability_score}<span className="text-sm text-muted-foreground">/100</span></div>
          <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${s.reliability_score}%` }} /></div>
        </div>
      )}
      <div className={`flex gap-2 items-start text-xs p-2 rounded-xl ${s.policy_safe ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
        {s.policy_safe ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
        {s.policy_safe ? t('policySafe') : t('policyFail')}
      </div>
      {s.policy_safe && !done && <button onClick={() => onRfq(s)} className="mt-3 w-full bg-brand text-white rounded-full py-2 text-sm font-semibold">{t('requestRfq')}</button>}
    </div>
  );
}