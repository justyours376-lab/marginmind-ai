import { Lock, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { finalProfit } from '@/lib/ceoFlow';

const Row = ({ l, v, bold }) => <div className={`flex justify-between gap-2 ${bold ? 'font-bold text-brand text-base border-t pt-1' : ''}`}><span>{l}</span><span className="text-right">{v}</span></div>;

// Strict approval screen: product + wholesaler + full amounts + quote + final profit are all visible before the tap.
export default function QuoteCard({ q, product, supplier, pct, cap, onApprove, busy, done, overCap, onConfirm, onCancel }) {
  const { t } = useLang();
  const f = finalProfit(product, q, pct);
  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-gold/50 max-w-md">
      <p className="text-xs font-semibold text-brand">{t('apprTitle')}</p>
      <div className="text-sm space-y-1 my-2">
        <Row l={t('apprProduct')} v={product.name} />
        <Row l={t('apprSupplier')} v={supplier.name} />
        <Row l={t('unitPrice')} v={`$${q.unit_price}`} />
        <Row l={t('qty')} v={q.quantity} />
        <Row l={t('shipping')} v={`$${q.shipping_total}`} />
        <Row l={t('shipTime')} v={t('daysN', { n: q.lead_days })} />
        <Row l={t('total')} v={`$${q.total}`} bold />
      </div>
      <div className="text-sm space-y-1 bg-cream rounded-xl p-3 mb-2">
        <p className="text-xs font-semibold text-brand">{t('apprFinal')}</p>
        <Row l={t('perUnit')} v={`$${f.net}`} />
        <Row l={t('allUnits', { n: q.quantity })} v={`$${f.totalNet}`} bold />
        <p className="text-[11px] text-muted-foreground">{t('reserveLbl', { pct })}: ${f.reserve}</p>
      </div>
      <p className="text-xs font-semibold text-emerald-700 mb-2">{t('tradeAssurance')}</p>
      <p className="text-xs text-muted-foreground flex gap-1 items-start mb-1"><Lock className="w-3 h-3 mt-0.5 shrink-0" />{t('waiting')} ({t('spendCap')}: ${cap})</p>
      <p className="text-[11px] text-muted-foreground mb-3">{t('apprNote')}</p>
      {overCap ? (
        <div className="bg-amber-50 text-amber-900 rounded-xl p-3 text-sm">
          {t('overCap')}
          <div className="flex gap-2 mt-2">
            <button onClick={onConfirm} disabled={busy} className="flex-1 bg-ok text-white rounded-full py-2 font-semibold">{t('confirmAnyway')}</button>
            <button onClick={onCancel} className="flex-1 border rounded-full py-2">{t('cancel')}</button>
          </div>
        </div>
      ) : !done && (
        <button onClick={onApprove} disabled={busy} className="w-full bg-ok text-white rounded-full py-2.5 font-bold flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('approvePay')}
        </button>
      )}
    </div>
  );
}