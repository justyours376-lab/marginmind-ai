export default function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accent ? 'bg-gold/20 text-gold-dark' : 'bg-brand/10 text-brand'}`}><Icon className="w-4 h-4" /></div>
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{label}</div>
    </div>
  );
}