import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DemoBadge from '@/components/DemoBadge';

const trendStyle = {
  up: ['bg-emerald-100 text-emerald-800', TrendingUp],
  down: ['bg-red-100 text-red-800', TrendingDown],
  flat: ['bg-slate-100 text-slate-700', Minus],
};

// Tiny 7-bar chart; the latest bar is emphasised.
function Spark({ data }) {
  const max = Math.max(1, ...data);
  return (
    <div className="mt-3 flex items-end gap-1 h-8" aria-hidden="true">
      {data.map((v, i) => (
        <div key={i} className={`flex-1 rounded-sm transition-colors ${i === data.length - 1 ? 'bg-emerald-700' : 'bg-emerald-200 group-hover:bg-emerald-300'}`} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} />
      ))}
    </div>
  );
}

// Analytics tile: small label, big value, optional trend badge and sparkline.
// `demo` shows the demo-data badge. `to` makes the whole tile a link. `trend` = { dir: 'up'|'down'|'flat', text }.
// `detail` is a hover/focus tooltip. `loading` shows a skeleton instead of the value. `children` adds extra content (e.g. a gauge).
export default function StatCard({ icon: Icon, label, value, sub, accent, demo, to, id, className = '', children, loading, trend, spark, detail }) {
  const cls = `group relative block bg-white rounded-2xl p-4 border border-black/5 ${to ? 'interactive' : 'hover:shadow-card-hover transition-shadow'} ${className}`;
  const [tCls, TIcon] = trend ? trendStyle[trend.dir] : [];
  const body = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-emerald-100 text-emerald-800' : 'bg-brand/10 text-brand'}`}><Icon className="w-[18px] h-[18px]" /></div>
        {demo && <DemoBadge />}
      </div>
      <div className="text-xs font-medium text-muted-foreground leading-snug">{label}</div>
      {loading ? <Skeleton className="h-8 w-24 mt-1.5" /> : (
        <div className="mt-0.5 flex items-center flex-wrap gap-x-2 gap-y-1">
          <span className="text-3xl font-bold tracking-tight text-brand leading-tight">{value}</span>
          {trend && <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${tCls}`}><TIcon className="w-3 h-3" />{trend.text}</span>}
        </div>
      )}
      {loading ? <Skeleton className="h-3 w-16 mt-2" /> : sub && <div className="text-xs font-semibold text-gold-dark mt-0.5">{sub}</div>}
      {!loading && spark && <Spark data={spark} />}
      {children}
      {detail && !loading && (
        <span role="tooltip" className="pointer-events-none absolute right-0 -top-2 -translate-y-full z-20 w-max max-w-[16rem] rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white shadow-card-hover opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{detail}</span>
      )}
    </>
  );
  const title = !detail && !loading && typeof value === 'string' ? `${label}: ${value}` : undefined;
  return to ? <Link id={id} to={to} title={title} className={cls}>{body}</Link> : <div id={id} title={title} className={cls}>{body}</div>;
}