import { Lock, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function QuoteCard({ q, cap, onApprove, busy, done, overCap, onConfirm, onCancel }) {
  const { t } = useLang();
  return (
    <div className="bg-white rounded-2xl p-4 border-2 border-gold/50 max-w-md">
      <p className="text-xs text-muted-foreground">{t('quote')}</p>
      <div className="text-sm space-y-1 my-2">
        <div className="flex justify-between"><span>{t('unitPrice')}</span><span>${q.unit_price}</span></div>
        <div className="flex justify-between"><span>{t('qty')}</span><span>{q.quantity}</span></div>
        <div className="flex justify-between"><span>{t('shipping')}</span><span>${q.shipping_total}</span></div>
        <div className="flex justify-between"><span>{t('shipTime')}</span><span>{t('daysN', { n: q.lead_days })}</span></div>
        <div className="flex justify-between font-bold text-brand text-base border-t pt-1"><span>{t('total')}</span><span>${q.total}</span></div>
      </div>
      <p className="text-xs font-semibold text-emerald-700 mb-2">{t('tradeAssurance')}</p>
      <p className="text-xs text-muted-foreground flex gap-1 items-center mb-3"><Lock className="w-3 h-3" />{t('waiting')} ({t('spendCap')}: ${cap})</p>
      {overCap ? (
        <div className="bg-amber-50 text-amber-900 rounded-xl p-3 text-sm">
          {t('overCap')}
          <div className="flex gap-2 mt-2">
            <button onClick={onConfirm} disabled={busy} className="flex-1 bg-gold text-brand rounded-full py-2 font-semibold">{t('confirmAnyway')}</button>
            <button onClick={onCancel} className="flex-1 border rounded-full py-2">{t('cancel')}</button>
          </div>
        </div>
      ) : !done && (
        <button onClick={onApprove} disabled={busy} className="w-full bg-gold text-brand rounded-full py-2.5 font-bold flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('approvePay')}
        </button>
      )}
    </div>
  );
}