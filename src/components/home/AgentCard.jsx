import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Loader2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import { nextScan, fmtWhen } from '@/lib/schedule';

// Agent status: scans automatically every 2 hours (scheduled workflow); "Run now" starts one scan immediately.
export default function AgentCard({ userId }) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: last } = useQuery({
    queryKey: ['agentRun', userId], enabled: !!userId,
    queryFn: async () => (await base44.entities.AgentRun.filter({ user_id: userId }, '-ran_at', 1))[0] || null,
  });
  const run = async () => {
    setBusy(true);
    try { await base44.functions.invoke('agentScan', {}); await qc.invalidateQueries(); } finally { setBusy(false); }
  };
  const n = (v) => localNum(v || 0, lang);
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5 flex gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Bot className="w-4 h-4" /></div>
      <div className="text-sm flex-1 min-w-0">
        <h2 className="font-semibold text-brand">{t('agentTitle')}</h2>
        <p className="mt-0.5">{t('agentIdle')}</p>
        <p className="text-xs font-semibold text-brand mt-1">{t('agentNext', { when: fmtWhen(nextScan(), lang) })}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {last ? `${t('agentLast', { when: fmtWhen(last.ran_at, lang), how: t(last.trigger === 'scheduled' ? 'agentAuto' : 'agentManual') })} · ${t('agentResult', { z: n(last.stock_zeroed), r: n(last.repriced), d: n(last.delisted) })}` : t('agentNever')}
        </p>
        <button onClick={run} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-semibold text-brand disabled:opacity-60">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}{busy ? t('agentRunning') : t('agentRunNow')}
        </button>
      </div>
    </section>
  );
}