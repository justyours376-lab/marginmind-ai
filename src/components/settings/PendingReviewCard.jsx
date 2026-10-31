import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import PendingItem from '@/components/settings/PendingItem';

// Listings held for manual review (ProductScreening status = manual_review), each with Approve / Reject.
export default function PendingReviewCard({ userId }) {
  const { t } = useLang();
  const { data = [] } = useQuery({
    queryKey: ['pendingReview', userId], enabled: !!userId,
    queryFn: () => base44.entities.ProductScreening.filter({ status: 'manual_review', created_by_id: userId }, '-created_date', 100),
  });
  return (
    <section id="pending-review" className="bg-white rounded-2xl p-5 border border-black/5">
      <h2 className="font-semibold text-brand">{t('pendingReview')} ({data.length})</h2>
      <p className="text-xs text-muted-foreground mb-3">{t('pendingReviewHint')}</p>
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noPendingReview')}</p>}
      <ul className="divide-y text-sm max-h-72 overflow-y-auto pr-1">{data.map((p) => <PendingItem key={p.id} p={p} />)}</ul>
    </section>
  );
}