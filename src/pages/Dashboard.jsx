import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Loader2, Radar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import StatTiles from '@/components/home/StatTiles';
import AgentCard from '@/components/home/AgentCard';
import TrendCard from '@/components/home/TrendCard';
import NotificationList from '@/components/NotificationList';

const dayKey = (i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);

export default function Dashboard() {
  const { t } = useLang();
  const { me } = useMe();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const { data: s } = useQuery({
    queryKey: ['stats', me?.id], enabled: !!me,
    queryFn: async () => {
      const q = { created_by_id: me.id };
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [td, wk, listings, mg] = await Promise.all([
        base44.entities.Order.aggregate({ query: { ...q, updated_date: { $gte: today.toISOString() } }, sum: ['realized_profit', 'realized_reserve'] }),
        base44.entities.Order.aggregate({ query: { ...q, updated_date: { $gte: `${dayKey(6)}T00:00:00Z` } }, dateBucket: { field: 'updated_date', unit: 'day' }, sum: ['units_sold'] }),
        base44.entities.Listing.count({ ...q, status: 'live' }),
        base44.entities.Product.aggregate({ query: q, avg: ['margin'] }),
      ]);
      const gross = td.rows?.[0]?.sum_realized_profit || 0;
      const byDay = Object.fromEntries((wk.rows || []).map((r) => [String(r.updated_date).slice(0, 10), r.sum_units_sold || 0]));
      const days = [6, 5, 4, 3, 2, 1, 0].map((i) => ({ key: dayKey(i), n: byDay[dayKey(i)] || 0 }));
      return { profit: gross, net: gross - (td.rows?.[0]?.sum_realized_reserve || 0), days, sales7: days.reduce((a, d) => a + d.n, 0), listings, margin: mg.rows?.[0]?.avg_margin ?? null };
    },
  });
  const check = async () => {
    setChecking(true);
    await base44.functions.invoke('saleWatch', {});
    await qc.invalidateQueries();
    setChecking(false);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-brand text-white p-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gold/20" />
        <h1 className="text-xl font-bold relative">{t('greeting')}</h1>
        <div className="flex flex-wrap gap-2 mt-4 relative">
          <Link to="/chat" state={{ start: true }} className="inline-flex items-center gap-2 bg-gold text-brand font-semibold px-4 py-2 rounded-full text-sm">{t('openChat')} <ArrowRight className="w-4 h-4" /></Link>
          <button onClick={check} disabled={checking} className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 rounded-full text-sm">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}{t('checkSales')}
          </button>
        </div>
      </div>
      <StatTiles s={s} />
      <AgentCard />
      <TrendCard days={s?.days} />
      <NotificationList userId={me?.id} limit={3} />
    </div>
  );
}