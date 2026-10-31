import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import OrderRow from '@/components/orders/OrderRow';
import ReturnCases from '@/components/orders/ReturnCases';
import { useOpenReturns } from '@/lib/useOpenReturns';
import { useFocusScroll } from '@/lib/useFocusScroll';

// Latest record per order wins.
const byOrder = (rows) => Object.fromEntries([...rows].reverse().map((r) => [r.order_ref, r]));

// Approvals screen: pending first, recent decisions below, lock note always visible.
export default function Orders() {
  const { t } = useLang();
  const { me } = useMe();
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', me?.id], enabled: !!me,
    queryFn: () => base44.entities.Order.filter({ created_by_id: me.id }, '-created_date', 50),
  });
  const { data: fin } = useQuery({
    queryKey: ['fin', me?.id], enabled: !!me,
    queryFn: async () => {
      const [l, f] = await Promise.all([
        base44.entities.PaymentLedger.filter({ created_by_id: me.id, direction: 'paid_to_supplier' }, '-created_date', 100),
        base44.entities.FulfillmentRecord.filter({ created_by_id: me.id }, '-created_date', 100),
      ]);
      return { ledger: byOrder(l), ful: byOrder(f) };
    },
  });
  const { data: cases = [] } = useOpenReturns(me?.id);
  useFocusScroll(!isLoading && !!fin);
  const caseOf = (o) => cases.find((c) => c.order_ref === o.id);
  const pending = data.filter((o) => o.status === 'awaiting_approval');
  const decided = data.filter((o) => o.status !== 'awaiting_approval');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand">{t('orders')}</h1>
      <p className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-brand rounded-xl px-3 py-2.5"><Lock className="w-4 h-4 shrink-0" />{t('lockNote')}</p>
      <Link to="/stock" className="interactive block bg-white rounded-2xl border border-black/5 px-4 py-3 text-sm font-semibold text-brand">{t('stockNav')} →</Link>
      <ReturnCases userId={me?.id} />
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('pendingTitle')}</h2>
        {isLoading && <><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></>}
        {!isLoading && pending.length === 0 && <p className="text-muted-foreground text-sm">{t('noPending')}</p>}
        {pending.map((o) => <OrderRow key={o.id} o={o} rc={caseOf(o)} />)}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-brand text-sm">{t('recentDecisions')}</h2>
        {!isLoading && decided.length === 0 && <p className="text-muted-foreground text-sm">{t('noDecisions')}</p>}
        {decided.map((o) => <OrderRow key={o.id} o={o} ledger={fin?.ledger[o.id]} f={fin?.ful[o.id]} rc={caseOf(o)} />)}
      </section>
    </div>
  );
}