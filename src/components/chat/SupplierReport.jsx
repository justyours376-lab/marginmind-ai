import { useLang } from '@/lib/i18n';
import SupplierCard from '@/components/chat/SupplierCard';

// Shows only verified US suppliers returned by the server. Never fills gaps with placeholders.
export default function SupplierReport({ report, onRfq, done }) {
  const { t } = useLang();
  const list = report.suppliers;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('supplierReport')} · {t('usOnly')}</p>
      {list.length === 0 && <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl px-4 py-2.5 text-sm max-w-md">{t('supplierPending')}</div>}
      {list.length > 0 && report.shortage && <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs max-w-md">{t('supplierShortage', { n: list.length })}</div>}
      {list.map((s) => <SupplierCard key={s.id} s={s} onRfq={onRfq} done={done} />)}
    </div>
  );
}