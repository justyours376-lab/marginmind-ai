export default function OptionTile({ label, badge, selected, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 text-left transition ${selected ? 'border-brand bg-emerald-50 shadow-card' : 'border-border bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'interactive hover:border-brand/60'}`}>
      <span className="font-semibold text-brand">{label}</span>
      {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-cream border border-border text-muted-foreground">{badge}</span>}
    </button>
  );
}