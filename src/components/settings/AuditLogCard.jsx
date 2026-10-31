import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

// Escape quotes and neutralise spreadsheet formulas.
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export default function AuditLogCard({ userId }) {
  const { t } = useLang();
  const { data = [] } = useQuery({ queryKey: ['audit', userId], enabled: !!userId, queryFn: () => base44.entities.AuditLog.filter({ created_by_id: userId }, '-created_date', 200) });
  const label = (a) => { const l = t(`act_${a}`); return l.startsWith('act_') ? a : l; };
  const exportCsv = async () => {
    const all = await base44.entities.AuditLog.filter({ created_by_id: userId }, '-created_date', 1000);
    const rows = [['date', 'action', 'actor_email', 'amount', 'details'], ...all.map((a) => [a.created_date, a.action, a.actor_email, a.amount, a.details])];
    const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-brand">{t('auditLog')}</h2>
        <button onClick={exportCsv} className="text-xs flex items-center gap-1 border border-brand text-brand rounded-full px-3 py-1.5 font-semibold"><Download className="w-3 h-3" />{t('downloadCsv')}</button>
      </div>
      {data.length === 0 && <p className="text-sm text-muted-foreground">{t('noAudit')}</p>}
      <ul className="divide-y text-sm max-h-96 overflow-y-auto pr-1">
        {data.map((a) => (
          <li key={a.id} className="py-2">
            <div className="flex justify-between"><span className="font-medium">{label(a.action)}</span>{a.amount != null && <span>${a.amount}</span>}</div>
            <p className="text-xs text-muted-foreground">{a.actor_email} · {format(new Date(a.created_date), 'PPp')}</p>
            <p className="text-xs">{a.details}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}