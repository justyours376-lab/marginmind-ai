import { HeartPulse } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import StatCard from '@/components/StatCard';

const MAX = 3; // gauge scale: 0-3% transaction defect rate (watch at 1.5%, critical at 1.8%, same as the server)
const tone = { healthy: 'text-emerald-700', watch: 'text-amber-700', critical: 'text-red-700' };

// Account health gauge from the latest AccountHealthSnapshot. `live` = the snapshot came from a verified eBay connection.
export default function HealthTile({ snap, live, loading }) {
  const { t, lang } = useLang();
  const tdr = snap?.tdr_percent;
  const status = snap?.alert_status;
  const pos = tdr == null ? 0 : Math.min(100, (tdr / MAX) * 100);
  return (
    <StatCard id="tile-health" className="col-span-2" demo={!live} loading={loading} icon={HeartPulse} label={t('tileHealth')}
      value={tdr == null ? '–' : `${localNum(tdr, lang)}%`} sub={status ? <span className={tone[status]}>{t(`hl_${status}`)}</span> : t('hl_none')}>
      <div className="relative mt-4 flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="w-1/2 bg-emerald-500 rounded-l-full" />
        <div className="w-[10%] bg-amber-400" />
        <div className="flex-1 bg-red-500 rounded-r-full" />
      </div>
      {tdr != null && <div className="relative h-0"><div className="absolute -top-[14px] h-[18px] w-1.5 rounded-full bg-brand ring-2 ring-white shadow -translate-x-1/2" style={{ left: `${pos}%` }} /></div>}
      <div className="relative mt-1.5 h-4 text-xs text-muted-foreground">
        <span className="absolute left-0">0%</span>
        <span className="absolute -translate-x-1/2" style={{ left: '50%' }}>{localNum(1.5, lang)}%</span>
        <span className="absolute -translate-x-1/2" style={{ left: '60%' }}>{localNum(1.8, lang)}%</span>
        <span className="absolute right-0">{localNum(MAX, lang)}%</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{t('hl_scale')}</p>
    </StatCard>
  );
}