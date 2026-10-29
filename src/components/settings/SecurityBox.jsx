import { ShieldCheck } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Plain-language security summary (text only).
export default function SecurityBox() {
  const { t } = useLang();
  return (
    <section className="bg-brand text-white rounded-2xl p-4 flex gap-3">
      <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
      <div className="text-sm space-y-1">
        <h2 className="font-semibold text-gold">{t('secTitle')}</h2>
        <p>{t('secPw')}</p>
        <p>{t('secApprove')}</p>
      </div>
    </section>
  );
}