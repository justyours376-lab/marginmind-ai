import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import SupplierCard from '@/components/chat/SupplierCard';

// Shows only real supplier records returned by the server (highest rating first, up to 5). Never invents entries.
// group 'nonus' is view-only: cards cannot be selected.
export default function SupplierReport({ report, product, group, selectedId, onSelect }) {
  const { t, lang } = useLang();
  const us = group !== 'nonus';
  const list = [...report.suppliers].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('supplierReport')}: {t(us ? 'usOnly' : 'nonUsOnly')}</p>
      {!us && <p className="text-sm font-semibold text-amber-800 bg-amber-50 rounded-xl px-3 py-2 max-w-md">{t('nonUsNote')}</p>}
      {list.length === 0
        ? <p className="text-sm max-w-md">{t('supplierPending')}</p>
        : <p className="text-sm font-semibold">{t('suppliersFound', { n: localNum(list.length, lang) })}</p>}
      {list.map((s) => <SupplierCard key={s.id} s={s} product={product} us={us} selected={selectedId === s.id} onSelect={us && onSelect ? () => onSelect(s) : undefined} />)}
    </div>
  );
}