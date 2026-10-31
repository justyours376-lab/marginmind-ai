import { Link } from 'react-router-dom';
import DemoBadge from '@/components/DemoBadge';

// `demo` shows the demo-data badge. `to` makes the whole tile a link; `children` adds extra content (e.g. a gauge).
export default function StatCard({ icon: Icon, label, value, sub, accent, demo, to, id, className = '', children }) {
  const cls = `block bg-white rounded-2xl p-4 shadow-sm border border-black/5 ${className}`;
  const body = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-gold/20 text-gold-dark' : 'bg-brand/10 text-brand'}`}><Icon className="w-4 h-4" /></div>
        {demo && <DemoBadge />}
      </div>
      <div className="text-2xl font-bold text-brand">{value}</div>
      {sub && <div className="text-xs font-semibold text-gold-dark">{sub}</div>}
      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{label}</div>
      {children}
    </>
  );
  return to ? <Link id={id} to={to} className={cls}>{body}</Link> : <div id={id} className={cls}>{body}</div>;
}