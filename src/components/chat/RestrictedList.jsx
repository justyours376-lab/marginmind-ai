import { useLang } from '@/lib/i18n';
import { reasonLabel } from '@/lib/restrictionReasons';

// Separate, view-only list of items that cannot be sold on eBay. No order flow exists for these.
export default function RestrictedList({ items }) {
  const { t, lang } = useLang();
  return (
    <div className="bg-white rounded-2xl p-4 border border-red-200 max-w-md space-y-2">
      <p className="font-bold text-red-700 text-sm">{t('restrictedTitle')}</p>
      <p className="text-xs text-muted-foreground">{t('restrictedNote')}</p>
      {items.map((it) => (
        <div key={it.name} className="text-sm border-t pt-2">
          <p className="font-semibold">{it.name}</p>
          <p className="text-xs text-red-700">{it.reasons.map((r) => reasonLabel(r, lang)).join(' · ')}</p>
        </div>
      ))}
    </div>
  );
}