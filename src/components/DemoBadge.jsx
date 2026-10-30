import { useLang } from '@/lib/i18n';

// Marks a number that comes from seeded/internal records, not a live API call.
export default function DemoBadge() {
  const { t } = useLang();
  return <span className="inline-block rounded-full bg-gold/25 text-gold-dark text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 leading-none">{t('demoData')}</span>;
}