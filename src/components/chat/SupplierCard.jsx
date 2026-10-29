import { useLang } from '@/lib/i18n';

const pct = (v) => (typeof v === 'number' ? `${v}%` : null);

// One real supplier record. Only fields the record has are shown.
export default function SupplierCard({ s, product, us, selected, onSelect }) {
  const { t } = useLang();
  const stats = [[t('reliabilityLbl'), typeof s.reliability_score === 'number' ? `${s.reliability_score}/100` : null], [t('ontime'), pct(s.ontime_rate)], [t('response'), pct(s.response_rate)]].filter(([, v]) => v);
  const contact = [[t('emailLabel'), s.email], [t('phone'), s.phone], [t('website'), s.website]].filter(([, v]) => v);
  const place = us ? t('usLoc') : s.country;
  return (
    <div onClick={onSelect} className={`bg-white rounded-2xl p-4 border max-w-md ${selected ? 'border-gold border-2' : 'border-black/5'} ${onSelect ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-brand">{s.name}</p>
        {typeof s.rating === 'number' && <p className="text-sm font-semibold text-gold-dark shrink-0">{s.rating} ★</p>}
      </div>
      <p className="text-xs text-muted-foreground">{place}{s.address ? ` · ${s.address}` : ''}</p>
      {us && <p className="text-xs font-semibold text-emerald-700 mt-1">{s.business_type === 'distributor' ? t('verifiedDistributor') : t('authWholesaler')}</p>}
      {us && s.ebay_registered === true && <p className="text-xs font-semibold text-emerald-700">{t('ebayReg')}</p>}
      {stats.length > 0 && <p className="text-xs mt-2">{stats.map(([l, v]) => `${l}: ${v}`).join(' · ')}</p>}
      <div className="text-xs space-y-0.5 mt-2 break-words">
        {contact.length ? contact.map(([l, v]) => <p key={l}><span className="text-muted-foreground">{l}: </span>{v}</p>) : <p>{t('noContact')}</p>}
      </div>
      {product && <p className="text-xs mt-2 border-t pt-2">{t('price')} ${product.ebay_price} · {t('grossProfit')} ${product.profit}</p>}
    </div>
  );
}