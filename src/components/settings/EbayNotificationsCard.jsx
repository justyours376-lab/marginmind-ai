import { Bell } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Shows where eBay should send sales, returns and buyer messages. The verification token is never shown here.
export default function EbayNotificationsCard() {
  const { t } = useLang();
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5 flex gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Bell className="w-4 h-4" /></div>
      <div className="text-sm min-w-0">
        <h2 className="font-semibold text-brand">{t('ebTitle')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('ebBody')}</p>
        <code className="block mt-2 text-[11px] bg-cream rounded-lg px-2 py-1.5 break-all select-all">{window.location.origin}/functions/ebayNotifications</code>
      </div>
    </section>
  );
}