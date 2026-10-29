import { useState } from 'react';
import { useLang } from '@/lib/i18n';
import SupplierCard from '@/components/chat/SupplierCard';

// Shows only verified US suppliers returned by the server (highest rating first). Never invents entries.
export default function SupplierReport({ report, product, onRfq, done }) {
  const { t } = useLang();
  const [sel, setSel] = useState(null);
  const list = [...report.suppliers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('supplierReport')} · {t('usOnly')}</p>
      {list.length === 0 && <p className="text-sm max-w-md">{t('supplierPending')}</p>}
      {list.map((s) => <SupplierCard key={s.id} s={s} product={product} selected={sel === s.id} onSelect={() => !done && setSel(s.id)} onRfq={onRfq} done={done} />)}
    </div>
  );
}