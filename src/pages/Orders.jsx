import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import OrderRow from '@/components/orders/OrderRow';

// Approvals screen: pending first, recent decisions below, lock note always visible.
export default function Orders() {
  const { t } = useLang();
  const { me } = useMe();
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', me?.id], enabled: !!me,
    queryFn: () => base44.entities.Order.filter({ created_by_id: me.id }, '-created_date', 50),
  });
  const pending = data.filter((o) => o.status === 'awaiting_approval');
  const decided = data.filter((o) => o.status !== 'awaiting_approval');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand">{t('orders')}</h1>
      <p className="flex items-center gap-2 text-sm bg-gold/15 text-brand rounded-xl px-3 py-2"><Lock className="w-4 h-4 shrink-0" />{t('lockNote')}</p>
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('pendingTitle')}</h2>
        {!isLoading && pending.length === 0 && <p className="text-muted-foreground text-sm">{t('noPending')}</p>}
        {pending.map((o) => <OrderRow key={o.id} o={o} />)}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('recentDecisions')}</h2>
        {!isLoading && decided.length === 0 && <p className="text-muted-foreground text-sm">{t('noDecisions')}</p>}
        {decided.map((o) => <OrderRow key={o.id} o={o} />)}
      </section>
    </div>
  );
}