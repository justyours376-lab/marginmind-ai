import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

// View-only list of listings held for manual review (ProductScreening status = manual_review).
export default function PendingReviewCard({ userId }) {
  const { t } = useLang();
  const { data = [] } = useQuery({
    queryKey: ['pendingReview', userId], enabled: !!userId,
    queryFn: () => base44.entities.ProductScreening.filter({ status: 'manual_review', created_by_id: userId }, '-created_date', 100),
  });
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5">
      <h2 className="font-semibold text-brand">{t('pendingReview')} ({data.length})</h2>
      <p className="text-xs text-muted-foreground mb-3">{t('pendingReviewHint')}</p>
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noPendingReview')}</p>}
      <ul className="divide-y text-sm max-h-72 overflow-y-auto pr-1">
        {data.map((p) => (
          <li key={p.id} className="py-2">
            <p className="font-medium">{p.product_name}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(p.created_date), 'PPp')}</p>
            <p className="text-xs">{p.reasons}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}