import { Undo2, PauseCircle } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import PaymentPanel from '@/components/orders/PaymentPanel';
import Countdown from '@/components/orders/Countdown';

const colors = { awaiting_approval: 'bg-amber-100 text-amber-800', payment_failed: 'bg-red-100 text-red-700', ordered: 'bg-blue-100 text-blue-800', shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-teal-100 text-teal-800', sold: 'bg-emerald-100 text-emerald-800', at_risk: 'bg-red-600 text-white' };

// `rc` = the order's most urgent open buyer case (return / message): its reply countdown shows right on the order.
export default function OrderRow({ o, ledger, f, rc }) {
  const { t } = useLang();
  const gross = o.realized_profit || 0;
  const net = +(gross - (o.realized_reserve || 0)).toFixed(2);
  const failed = o.status === 'payment_failed';
  return (
    <div id={`order-${o.id}`} className="space-y-1.5">
      <div className={`bg-white rounded-2xl p-3 flex gap-3 items-center border ${o.status === 'at_risk' ? 'border-red-300' : 'border-black/5'}`}>
        <img src={o.image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{o.product_name}</p>
          <p className="text-xs text-muted-foreground">{o.supplier_name} · {o.quantity} × ${o.unit_price} = <b>${o.total}</b></p>
          {!failed && <>
            <p className="text-xs text-brand">{t('grossProfit')}: ${gross} · {o.units_sold || 0}/{o.quantity}</p>
            <p className="text-xs text-brand">{t('netProfit')}: ${net}</p>
          </>}
          {o.paused && <p className="text-xs text-red-700 flex items-center gap-1 mt-0.5"><PauseCircle className="w-3 h-3" />{t('ordPaused')}</p>}
          {rc && <p className="text-xs flex items-center gap-1 mt-0.5"><Undo2 className="w-3 h-3 text-brand" /><Countdown to={rc.deadline} /></p>}
        </div>
        <span className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap ${colors[o.status]}`}>{t(o.status === 'ordered' ? 'ordered_s' : o.status)}</span>
      </div>
      {!failed && <PaymentPanel ledger={ledger} f={f} />}
    </div>
  );
}