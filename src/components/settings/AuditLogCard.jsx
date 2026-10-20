import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

export default function AuditLogCard({ userId }) {
  const { t } = useLang();
  const { data = [] } = useQuery({ queryKey: ['audit', userId], enabled: !!userId, queryFn: () => base44.entities.AuditLog.filter({ created_by_id: userId }, '-created_date', 50) });
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5">
      <h2 className="font-semibold text-brand mb-3">{t('auditLog')}</h2>
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noAudit')}</p>}
      <ul className="divide-y text-sm">
        {data.map((a) => (
          <li key={a.id} className="py-2">
            <div className="flex justify-between"><span className="font-medium">{a.action}</span><span>${a.amount}</span></div>
            <p className="text-xs text-muted-foreground">{a.actor_email} · {format(new Date(a.created_date), 'PPp')}</p>
            <p className="text-xs">{a.details}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}