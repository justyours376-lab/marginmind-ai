// Tap-gated choice chips. items: [[key, label], ...]
export default function Chips({ items, onPick, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([k, l]) => (
        <button key={k} disabled={disabled} onClick={() => onPick(k, l)} className="px-4 py-2 rounded-full border border-brand/40 bg-white text-brand text-sm font-semibold text-left shadow-sm hover:bg-brand hover:text-white hover:border-brand hover:shadow-md transition disabled:opacity-50 disabled:shadow-none disabled:hover:bg-white disabled:hover:text-brand disabled:hover:border-brand/40">{l}</button>
      ))}
    </div>
  );
}