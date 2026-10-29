import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import { withReserve } from '@/lib/demoData';

const Row = ({ l, v, bold }) => (<div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span className={bold ? 'font-bold text-brand' : ''}>{v}</span></div>);

export default function ProductCard({ p, onPick, disabled }) {
  const { t } = useLang();
  const { me } = useMe();
  const r = withReserve(p.profit, p.ebay_price, me?.returns_reserve ?? 5);
  return (
    <button disabled={disabled} onClick={() => onPick?.(p)} className="text-left bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0">
      <div className="relative aspect-[4/3] bg-cream">
        <img src={p.image_url} alt={p.name} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} className="w-full h-full object-cover" />
        <span className="absolute top-2 right-2 bg-gold text-brand text-xs font-bold px-2 py-0.5 rounded-full">{r.margin}%</span>
      </div>
      <div className="p-3 text-xs space-y-1">
        <p className="font-semibold text-sm leading-tight mb-1.5 line-clamp-2">{p.name}</p>
        <Row l={t('price')} v={`$${p.ebay_price}`} />
        <Row l={t('cost')} v={`$${p.alibaba_cost}`} />
        <Row l={t('shipping')} v={`$${p.shipping}`} />
        <Row l={t('fee')} v={`$${p.ebay_fee}`} />
        <div className="border-t pt-1 space-y-0.5">
          <Row l={t('grossProfit')} v={`$${r.gross}`} />
          <Row l={t('netProfit')} v={`$${r.net}`} bold />
        </div>
      </div>
    </button>
  );
}