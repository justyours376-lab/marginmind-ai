import { useLang } from '@/lib/i18n';

const Line = ({ l, v }) => <p><span className="text-muted-foreground">{l}: </span>{v}</p>;

// One real supplier record. Every card shows the same fields; anything the record lacks says "not available" (never invented).
export default function SupplierCard({ s, product, us, selected, onSelect }) {
  const { t } = useLang();
  const na = t('na');
  const has = (v) => typeof v === 'number';
  const biz = [s.business_type && t(s.business_type === 'distributor' ? 'distributor' : s.business_type === 'wholesaler' ? 'wholesaler' : s.business_type), us ? t('usLoc') : s.country, s.address].filter(Boolean).join(' · ');
  const contacts = [s.email, s.phone, s.website].filter(Boolean);
  return (
    <div onClick={onSelect} role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } } : undefined}
      className={`bg-white rounded-2xl p-4 border max-w-md ${selected ? 'border-brand border-2 ring-2 ring-brand/15' : 'border-black/5'} ${onSelect ? 'interactive' : ''}`}>
      <p className="font-bold text-brand">{s.name}</p>
      {us && <p className="text-xs font-semibold text-emerald-700 mt-1">{s.business_type === 'distributor' ? t('verifiedDistributor') : t('authWholesaler')}{s.ebay_registered === true ? ` · ${t('ebayReg')}` : ''}</p>}
      <div className="text-xs space-y-0.5 mt-2 break-words">
        <Line l={t('cYears')} v={has(s.years_in_business) ? t('cYearsVal', { n: s.years_in_business }) : na} />
        <Line l={t('cSales')} v={has(s.rating) ? `${s.rating} ★` : na} />
        <Line l={t('cShip')} v={has(s.ontime_rate) ? `${s.ontime_rate}%` : na} />
        <Line l={t('cOverall')} v={has(s.reliability_score) ? `${s.reliability_score}/100` : na} />
        <Line l={t('cResp')} v={has(s.response_rate) ? `${s.response_rate}%` : na} />
        <Line l={t('delivery')} v={has(s.delivery_days_us) ? t('daysN', { n: s.delivery_days_us }) : na} />
        <Line l={t('cBiz')} v={biz || na} />
        <Line l={t('cType')} v={s.business_type || na} />
        {contacts.length ? <Line l={t('emailLabel') + ' / ' + t('phone') + ' / ' + t('website')} v={contacts.join(' · ')} /> : <p>{t('noContact')}</p>}
        <Line l={t('cPrice')} v={product && has(product.alibaba_cost) ? `$${product.alibaba_cost}` : na} />
        <Line l={t('cSource')} v={t('cSourceVal')} />
      </div>
    </div>
  );
}