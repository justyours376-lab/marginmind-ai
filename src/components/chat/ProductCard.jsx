import { useLang } from '@/lib/i18n';

const Row = ({ l, v, bold }) => (<div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className={bold ? 'font-bold text-brand' : ''}>{v}</span></div>);

export default function ProductCard({ p, onPick, disabled }) {
  const { t } = useLang();
  return (
    <button disabled={disabled} onClick={() => onPick?.(p)} className="text-left bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0">
      <div className="relative aspect-[4/3] bg-cream">
        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        <span className="absolute top-2 right-2 bg-gold text-brand text-xs font-bold px-2 py-0.5 rounded-full">{p.margin}%</span>
      </div>
      <div className="p-3 text-xs space-y-1">
        <p className="font-semibold text-sm leading-tight mb-1.5 line-clamp-2">{p.name}</p>
        <Row l={t('price')} v={`$${p.ebay_price}`} />
        <Row l={t('cost')} v={`$${p.alibaba_cost}`} />
        <Row l={t('shipping')} v={`$${p.shipping}`} />
        <Row l={t('fee')} v={`$${p.ebay_fee}`} />
        <div className="border-t pt-1"><Row l={t('profit')} v={`$${p.profit}`} bold /></div>
      </div>
    </button>
  );
}