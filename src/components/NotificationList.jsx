import { useQuery } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, Megaphone, FileText, Radar, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

const icons = { sale: DollarSign, low_stock: AlertTriangle, marketing: Megaphone, report: FileText, scan: Radar, security: ShieldAlert };

export default function NotificationList({ userId, limit = 8, compact }) {
  const { t } = useLang();
  const { data = [] } = useQuery({
    queryKey: ['notifs', userId], enabled: !!userId,
    queryFn: () => base44.entities.Notification.filter({ user_id: userId }, '-created_date', limit),
  });
  return (
    <div className={compact ? '' : 'bg-white rounded-2xl p-5 border border-black/5'}>
      {!compact && <h2 className="font-semibold text-brand mb-3">{t('recentNotifs')}</h2>}
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noNotifs')}</p>}
      <ul className="space-y-2">
        {data.map((n) => {
          const Icon = icons[n.type] || FileText;
          return (
            <li key={n.id} className="flex gap-3 items-start p-3 rounded-xl bg-cream">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
              <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p></div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}