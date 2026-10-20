import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, DollarSign, AlertTriangle, ArrowRight, Loader2, Radar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe, isLive } from '@/lib/useMe';
import StatCard from '@/components/StatCard';
import NotificationList from '@/components/NotificationList';

export default function Dashboard() {
  const { t } = useLang();
  const { me } = useMe();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const { data: s } = useQuery({
    queryKey: ['stats', me?.id], enabled: !!me,
    queryFn: async () => {
      const week = new Date(Date.now() - 7 * 864e5).toISOString();
      const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [found, prog, att, agg] = await Promise.all([
        base44.entities.Product.count({ created_by_id: me.id, created_date: { $gte: week } }),
        base44.entities.Order.count({ created_by_id: me.id, status: { $in: ['ordered', 'shipped', 'delivered'] } }),
        base44.entities.Notification.count({ user_id: me.id, read: false, type: { $in: ['low_stock', 'marketing'] } }),
        base44.entities.Order.aggregate({ query: { created_by_id: me.id, updated_date: { $gte: month } }, sum: ['realized_profit'] }),
      ]);
      return { found, prog, att, profit: agg.rows?.[0]?.sum_realized_profit || 0 };
    },
  });
  const check = async () => {
    setChecking(true);
    await base44.functions.invoke('saleWatch', {});
    await qc.invalidateQueries();
    setChecking(false);
  };
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-brand text-white p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gold/20" />
        <span className="text-[11px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">{isLive(me) ? t('live') : t('demo')}</span>
        <p className="text-gold text-sm mt-3">{t('welcome')}{me?.full_name ? `, ${me.full_name}` : ''}</p>
        <h1 className="text-2xl font-bold mt-1">{t('todaySummary')}</h1>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/chat" className="inline-flex items-center gap-2 bg-gold text-brand font-semibold px-4 py-2 rounded-full text-sm">{t('openChat')} <ArrowRight className="w-4 h-4" /></Link>
          <button onClick={check} disabled={checking} className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 rounded-full text-sm">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}{t('checkSales')}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label={t('foundWeek')} value={s?.found ?? '–'} />
        <StatCard icon={Truck} label={t('inProgress')} value={s?.prog ?? '–'} />
        <StatCard icon={DollarSign} label={t('profitMonth')} value={s ? `$${s.profit.toFixed(2)}` : '–'} accent />
        <StatCard icon={AlertTriangle} label={t('attention')} value={s?.att ?? '–'} accent />
      </div>
      <NotificationList userId={me?.id} />
    </div>
  );
}