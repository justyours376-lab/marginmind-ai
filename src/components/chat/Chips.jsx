// Tap-gated choice chips. items: [[key, label], ...]
export default function Chips({ items, onPick, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([k, l]) => (
        <button key={k} disabled={disabled} onClick={() => onPick(k, l)} className="px-4 py-2 rounded-full border-2 border-gold text-brand text-sm font-semibold text-left hover:bg-gold transition disabled:opacity-50 disabled:hover:bg-transparent">{l}</button>
      ))}
    </div>
  );
}