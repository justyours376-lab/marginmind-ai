import { Bell } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';

// Notifications only. Marking one as read is the only action; nothing is ordered, re-priced or paused from here.
export default function StockAlerts({ alerts, onRead }) {
  const { t, lang } = useLang();
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-brand text-sm">{t('alertsTitle')}</h2>
      {alerts.length === 0 && <p className="text-muted-foreground text-sm">{t('noAlerts')}</p>}
      {alerts.map((a) => (
        <div key={a.id} className={`rounded-xl px-3 py-2 flex items-center gap-2 text-sm border ${a.read ? 'bg-white border-black/5 text-muted-foreground' : 'bg-gold/15 border-gold/40 text-brand'}`}>
          <Bell className="w-4 h-4 shrink-0" />
          <span className="flex-1">{t(`al_${a.kind}`, { name: a.product_name, n: localNum(a.kind === 'upcoming' ? a.incoming : a.remaining, lang) })}{a.kind === 'upcoming' ? ` · ${t('eta')}: ${a.eta || t('na')}` : ''}</span>
          {!a.read && <button onClick={() => onRead(a.id)} className="text-xs underline shrink-0">{t('markRead')}</button>}
        </div>
      ))}
    </section>
  );
}