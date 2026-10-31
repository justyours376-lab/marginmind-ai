import { useLang } from '@/lib/i18n';

// Marks a number that comes from seeded/internal records, not a live API call.
export default function DemoBadge() {
  const { t } = useLang();
  return <span className="inline-block rounded-full bg-amber-100 text-gold-dark border border-amber-200 text-[9px] font-bold uppercase tracking-wide px-2 py-1 leading-none">{t('demoData')}</span>;
}