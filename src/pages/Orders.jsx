import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';

const colors = { awaiting_approval: 'bg-amber-100 text-amber-800', payment_failed: 'bg-red-100 text-red-700', ordered: 'bg-blue-100 text-blue-800', shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-teal-100 text-teal-800', sold: 'bg-emerald-100 text-emerald-800' };

export default function Orders() {
  const { t } = useLang();
  const { me } = useMe();
  const { data = [], isLoading } = useQuery({
    queryKey: ['orders', me?.id], enabled: !!me,
    queryFn: () => base44.entities.Order.filter({ created_by_id: me.id }, '-created_date', 50),
  });
  return (
    <div>
      <h1 className="text-xl font-bold text-brand mb-4">{t('orders')}</h1>
      {!isLoading && data.length === 0 && <p className="text-muted-foreground text-sm">{t('noOrders')}</p>}
      <div className="space-y-3">
        {data.map((o) => {
          const gross = o.realized_profit || 0;
          const net = +(gross - (o.realized_reserve || 0)).toFixed(2);
          const failed = o.status === 'payment_failed';
          return (
            <div key={o.id} className="bg-white rounded-2xl p-3 flex gap-3 items-center border border-black/5">
              <img src={o.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{o.product_name} {o.demo && <span className="text-xs font-normal text-muted-foreground">{t('demoTag')}</span>}</p>
                <p className="text-xs text-muted-foreground">{o.supplier_name} · {o.quantity} × ${o.unit_price} = <b>${o.total}</b></p>
                {!failed && <>
                  <p className="text-xs text-brand">{t('grossProfit')}: ${gross} · {o.units_sold || 0}/{o.quantity}</p>
                  <p className="text-xs text-brand">{t('netProfit')}: ${net}</p>
                </>}
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap ${colors[o.status]}`}>{t(o.status === 'ordered' ? 'ordered_s' : o.status)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}