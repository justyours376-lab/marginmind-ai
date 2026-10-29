import { useLang } from '@/lib/i18n';
import { roughProfit } from '@/lib/ceoFlow';

const Row = ({ l, v, bold }) => <div className={`flex justify-between ${bold ? 'font-bold text-brand border-t pt-1' : ''}`}><span>{l}</span><span>{v}</span></div>;

// Rough (estimated) profit for the chosen product + wholesaler, computed in code from stored prices. Not final.
export default function RoughProfitCard({ product, supplier, pct }) {
  const { t } = useLang();
  const r = roughProfit(product, pct);
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5 max-w-md text-sm space-y-1">
      <p className="text-xs font-semibold text-brand">{t('roughTitle')} · {supplier.name}</p>
      <Row l={t('price')} v={`$${r.price}`} />
      <Row l={t('wholesalePrice')} v={`− $${r.cost}`} />
      <Row l={t('fee')} v={`− $${r.fee}`} />
      <Row l={t('shipping')} v={`− $${r.shipping}`} />
      <Row l={t('reserveLbl', { pct })} v={`− $${r.reserve}`} />
      <Row l={t('roughProfit')} v={`$${r.profit}`} bold />
      <p className="text-[11px] text-muted-foreground pt-1">{t('roughNote')}</p>
    </div>
  );
}