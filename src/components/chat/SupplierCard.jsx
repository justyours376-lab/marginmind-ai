import { useLang } from '@/lib/i18n';

const pct = (v) => (typeof v === 'number' ? `${v}%` : null);

export default function SupplierCard({ s, product, selected, onSelect, onRfq, done }) {
  const { t } = useLang();
  const stats = [[t('reliabilityLbl'), typeof s.reliability_score === 'number' ? `${s.reliability_score}/100` : null], [t('ontime'), pct(s.ontime_rate)], [t('response'), pct(s.response_rate)]].filter(([, v]) => v);
  const contact = [[t('emailLabel'), s.email], [t('phone'), s.phone], [t('website'), s.website]].filter(([, v]) => v);
  return (
    <div onClick={onSelect} className={`bg-white rounded-2xl p-4 border max-w-md ${selected ? 'border-gold' : 'border-black/5'} ${done ? '' : 'cursor-pointer'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-brand">{s.name}</p>
        {typeof s.rating === 'number' && <p className="text-sm font-semibold text-gold-dark shrink-0">{s.rating} ★</p>}
      </div>
      <p className="text-xs text-muted-foreground">{t('usLoc')}{s.address ? ` · ${s.address}` : ''}</p>
      <p className="text-xs font-semibold text-emerald-700 mt-1">{s.business_type === 'distributor' ? t('verifiedDistributor') : t('authWholesaler')}</p>
      {stats.length > 0 && <p className="text-xs mt-2">{stats.map(([l, v]) => `${l}: ${v}`).join(' · ')}</p>}
      <div className="text-xs space-y-0.5 mt-2 break-words">
        {contact.length ? contact.map(([l, v]) => <p key={l}><span className="text-muted-foreground">{l}: </span>{v}</p>) : <p>{t('noContact')}</p>}
      </div>
      {product && <p className="text-xs mt-2 border-t pt-2">{t('price')} ${product.ebay_price} · {t('grossProfit')} ${product.profit}</p>}
      {selected && !done && <button onClick={(e) => { e.stopPropagation(); onRfq(s); }} className="mt-3 w-full bg-brand text-white rounded-full py-2 text-sm font-semibold">{t('requestRfq')}</button>}
    </div>
  );
}