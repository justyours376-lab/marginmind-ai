import { FlaskConical } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function DemoBanner() {
  const { t } = useLang();
  return (
    <div className="bg-amber-400 text-brand text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2 text-center">
      <FlaskConical className="w-4 h-4 shrink-0" />{t('demoBanner')}
    </div>
  );
}