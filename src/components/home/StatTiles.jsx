import { DollarSign, ShoppingCart, ListChecks, Percent } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import StatCard from '@/components/StatCard';

// 2x2 grid of the four home tiles. Every number comes from stored internal records (no live API sync), so each is badged "demo data".
export default function StatTiles({ s }) {
  const { t, lang } = useLang();
  const n = (v) => (v == null ? '–' : localNum(v, lang));
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard demo icon={DollarSign} label={t('stProfitToday')} value={s ? `$${n(s.profit.toFixed(2))}` : '–'} sub={s ? `${t('netProfit')}: $${n(s.net.toFixed(2))}` : ''} accent />
      <StatCard demo icon={ShoppingCart} label={t('stSales7')} value={n(s?.sales7)} />
      <StatCard demo icon={ListChecks} label={t('stListings')} value={n(s?.listings)} />
      <StatCard demo icon={Percent} label={t('stMargin')} value={s?.margin == null ? '–' : `${n(s.margin.toFixed(1))}%`} accent />
    </div>
  );
}