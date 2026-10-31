import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';

// Suppliers ranked by incidents in the last 90 days (defects, late dispatches, stock mismatches). More than 2 incidents = "Review".
export default function SupplierRanking() {
  const { t, lang } = useLang();
  const { data = [] } = useQuery({
    queryKey: ['supplierRanking'],
    queryFn: () => base44.entities.Supplier.filter({ incident_total: { $gt: 0 } }, '-incident_total', 50),
  });
  // One row per supplier name (a supplier has one record per product).
  const rows = Object.values(Object.fromEntries(data.map((s) => [s.name, s]))).slice(0, 10);
  const n = (v) => localNum(v || 0, lang);
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-brand text-sm">{t('supTitle')}</h2>
      {rows.length === 0 && <p className="text-muted-foreground text-sm">{t('supNone')}</p>}
      {rows.map((s, i) => (
        <div key={s.name} className={`rounded-xl px-3 py-2 text-sm border flex items-center gap-2 ${s.review_status === 'review' ? 'bg-red-50 border-red-200' : 'bg-white border-black/5'}`}>
          <span className="font-bold text-brand w-5">{n(i + 1)}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{s.name}</p>
            <p className="text-xs text-muted-foreground">{t('supLine', { d: n(s.incident_defects), l: n(s.incident_late), s: n(s.incident_stock) })}</p>
          </div>
          <span className="font-bold text-brand">{n(s.incident_total)}</span>
          {s.review_status === 'review' && <span className="text-[10px] font-bold uppercase bg-red-600 text-white rounded-full px-2 py-0.5">{t('supReview')}</span>}
        </div>
      ))}
    </section>
  );
}