export default function OptionTile({ label, badge, selected, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-full flex justify-between items-center p-4 rounded-2xl border-2 text-left transition ${selected ? 'border-gold bg-gold/10' : 'border-black/10 bg-white'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gold'}`}>
      <span className="font-semibold text-brand">{label}</span>
      {badge && <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream text-muted-foreground">{badge}</span>}
    </button>
  );
}