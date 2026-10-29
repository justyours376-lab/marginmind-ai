import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';

const tone = { ok: 'bg-emerald-100 text-emerald-800', low: 'bg-amber-100 text-amber-800', out: 'bg-red-100 text-red-700', upcoming: 'bg-blue-100 text-blue-800' };
const Line = ({ l, v }) => <div className="flex justify-between gap-2"><span className="text-muted-foreground">{l}</span><span className="font-semibold text-right">{v}</span></div>;

// One product: sales so far + current and upcoming stock, all from the user's own order records.
export default function StockItem({ it }) {
  const { t, lang } = useLang();
  const n = (v) => localNum(v, lang);
  return (
    <div className="bg-white rounded-2xl p-3 border border-black/5 space-y-2">
      <div className="flex gap-3 items-center">
        <img src={it.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{it.product_name}</p>
          <p className="text-xs text-muted-foreground truncate">{it.supplier_name}{it.listing_live ? '' : ` · ${t('listingNo')}`}</p>
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap ${tone[it.state]}`}>{t(`st_${it.state}`)}</span>
      </div>
      <div className="text-xs space-y-0.5">
        <Line l={t('unitsSold')} v={`${n(it.units_sold)} / ${n(it.ordered_qty)}`} />
        <Line l={t('revenue')} v={`$${it.revenue}`} />
        <Line l={t('netRealized')} v={`$${it.net_profit}`} />
        <Line l={t('onHand')} v={n(it.on_hand)} />
        <Line l={t('incoming')} v={it.incoming ? `${n(it.incoming)} · ${t('eta')}: ${it.eta || t('na')}` : n(0)} />
      </div>
    </div>
  );
}