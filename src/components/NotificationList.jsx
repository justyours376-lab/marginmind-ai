import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DollarSign, AlertTriangle, Megaphone, FileText, Radar, ShieldAlert, PackageX, Undo2, FileSignature } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { tr } from '@/lib/notifMsgs';

const icons = { sale: DollarSign, low_stock: AlertTriangle, marketing: Megaphone, report: FileText, scan: Radar, security: ShieldAlert, stock_risk: PackageX, return: Undo2, agreement: FileSignature };
// Older notifications have no stored link: open the screen that fits their type.
const FALLBACK = { sale: '/orders', low_stock: '/stock', marketing: '/orders', report: '/', scan: '/', security: '/settings', stock_risk: '/orders', return: '/orders', agreement: '/settings?focus=agreements' };

export default function NotificationList({ userId, limit = 8, compact }) {
  const { t, lang } = useLang();
  const { data = [] } = useQuery({
    queryKey: ['notifs', userId], enabled: !!userId,
    queryFn: () => base44.entities.Notification.filter({ user_id: userId }, '-created_date', limit),
  });
  // Notifications with message keys are re-rendered in the language selected now; older ones show their stored text.
  const text = (n) => (n.title_key ? { title: tr(lang, n.title_key, n.vars || {}), message: tr(lang, n.msg_key, n.vars || {}) } : { title: n.title, message: n.message });
  return (
    <div className={compact ? '' : 'bg-white rounded-2xl p-5 border border-black/5'}>
      {!compact && <h2 className="font-semibold text-brand mb-3">{t('recentNotifs')}</h2>}
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noNotifs')}</p>}
      <ul className="space-y-2">
        {data.map((n) => {
          const Icon = icons[n.type] || FileText;
          const crit = n.severity === 'critical';
          const { title, message } = text(n);
          return (
            <li key={n.id}>
              <Link to={n.link || FALLBACK[n.type] || '/'} className={`flex gap-3 items-start p-3 rounded-xl ${crit ? 'bg-red-50 border border-red-200' : 'bg-cream'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${crit ? 'bg-red-600 text-white' : 'bg-brand/10 text-brand'}`}><Icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-medium">{crit && <span className="text-[10px] font-bold uppercase bg-red-600 text-white rounded-full px-1.5 py-0.5 mr-1.5">{t('critical')}</span>}{title}</p>
                  <p className="text-xs text-muted-foreground">{message}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}