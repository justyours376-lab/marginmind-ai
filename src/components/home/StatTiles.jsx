import { DollarSign, ShoppingCart, ListChecks, Percent } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import StatCard from '@/components/StatCard';
import { DAY_NAMES } from '@/components/home/TrendCard';

const sum = (a) => a.reduce((x, d) => x + d.n, 0);

// 2x2 grid of the four home tiles. Every number comes from stored internal records (no live API sync), so each is badged "demo data".
export default function StatTiles({ s }) {
  const { t, lang } = useLang();
  const n = (v) => (v == null ? '–' : localNum(v, lang));
  // Trend of the sales tile: the last 3 days against the 3 days before them (display only).
  const days = s?.days || [];
  const recent = sum(days.slice(4)), prev = sum(days.slice(1, 4));
  const trend = !s || recent + prev === 0 ? undefined
    : prev === 0 ? { dir: 'up', text: `+${n(recent)}` }
    : { dir: recent > prev ? 'up' : recent < prev ? 'down' : 'flat', text: `${recent >= prev ? '+' : '−'}${n(Math.round((Math.abs(recent - prev) / prev) * 100))}%` };
  const detail = s ? days.map((d) => `${DAY_NAMES[lang][new Date(`${d.key}T00:00:00Z`).getUTCDay()]} ${n(d.n)}`).join(' · ') : undefined;
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard demo accent loading={!s} icon={DollarSign} label={t('stProfitToday')} value={s ? `$${n(s.profit.toFixed(2))}` : '–'} sub={s ? `${t('netProfit')}: $${n(s.net.toFixed(2))}` : ''} />
      <StatCard demo loading={!s} icon={ShoppingCart} label={t('stSales7')} value={n(s?.sales7)} trend={trend} spark={s ? days.map((d) => d.n) : undefined} detail={detail} />
      <StatCard demo loading={!s} icon={ListChecks} label={t('stListings')} value={n(s?.listings)} />
      <StatCard demo accent loading={!s} icon={Percent} label={t('stMargin')} value={s?.margin == null ? '–' : `${n(s.margin.toFixed(1))}%`} />
    </div>
  );
}