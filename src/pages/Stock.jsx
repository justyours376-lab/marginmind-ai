import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import StockItem from '@/components/stock/StockItem';
import StockAlerts from '@/components/stock/StockAlerts';

// Sales + stock information from the user's own records. Information and alerts only; no automatic actions.
export default function Stock() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['stock'], queryFn: async () => (await base44.functions.invoke('stockSales', {})).data });
  const read = useMutation({ mutationFn: (alert_id) => base44.functions.invoke('stockSales', { action: 'markRead', alert_id }), onSuccess: (_, id) => qc.setQueryData(['stock'], (d) => d && { ...d, alerts: d.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) }) });
  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (isError || !data) return <p className="text-sm text-red-700">{t('loadFail')}</p>;
  const tot = data.totals;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand">{t('stockTitle')}</h1>
      <p className="flex items-center gap-2 text-sm bg-gold/15 text-brand rounded-xl px-3 py-2"><Lock className="w-4 h-4 shrink-0" />{t('noAutoNote')}</p>
      <StockAlerts alerts={data.alerts} onRead={(id) => read.mutate(id)} />
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('salesTitle')}</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[[t('unitsSold'), localNum(tot.units_sold, lang)], [t('revenue'), `$${tot.revenue}`], [t('netRealized'), `$${tot.net_profit}`]].map(([l, v]) => (
            <div key={l} className="bg-white rounded-xl p-2 border border-black/5"><p className="font-bold text-brand">{v}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('stockSec')}</h2>
        {data.items.length === 0 && <p className="text-muted-foreground text-sm">{t('noItems')}</p>}
        {data.items.map((it) => <StockItem key={it.order_id} it={it} />)}
      </section>
      <p className="text-[11px] text-muted-foreground">{t('stockSource')}</p>
    </div>
  );
}