import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { downloadAuditCsv } from '@/lib/auditCsv';
import AuditPurgeButton from '@/components/settings/AuditPurgeButton';

export default function AuditLogCard({ userId, isAdmin }) {
  const { t } = useLang();
  const [exporting, setExporting] = useState(false);
  const { data = [] } = useQuery({ queryKey: ['audit', userId], enabled: !!userId, queryFn: () => base44.entities.AuditLog.filter({ created_by_id: userId }, '-created_date', 200) });
  const { data: stats } = useQuery({
    queryKey: ['audit', 'stats', userId], enabled: !!userId,
    queryFn: async () => {
      const [n, oldest] = await Promise.all([
        base44.entities.AuditLog.count({ created_by_id: userId }),
        base44.entities.AuditLog.filter({ created_by_id: userId }, { sort: 'created_date', limit: 1 }),
      ]);
      return { n, oldest: oldest.items[0]?.created_date };
    },
  });
  const label = (a) => { const l = t(`act_${a}`); return l.startsWith('act_') ? a : l; };
  const exportCsv = async () => { setExporting(true); await downloadAuditCsv(userId); setExporting(false); };
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
        <h2 className="font-semibold text-brand">{t('auditLog')}</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} disabled={exporting} className="text-xs inline-flex items-center gap-1 bg-info text-white rounded-full px-3 py-1.5 font-semibold disabled:opacity-60">
            {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}{t('auditExportAll')}
          </button>
          {isAdmin && <AuditPurgeButton userId={userId} />}
        </div>
      </div>
      {stats && <p className="text-xs text-muted-foreground mb-3">{stats.n ? t('auditSummary', { n: stats.n, date: format(new Date(stats.oldest), 'PP') }) : t('auditNoEntries')}</p>}
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