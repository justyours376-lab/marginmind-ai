import { useQueryClient } from '@tanstack/react-query';
import { useLang } from '@/lib/i18n';
import PayStep from '@/components/orders/PayStep';
import TrackingStep from '@/components/orders/TrackingStep';

const reason = (t, note) => (note?.startsWith('ebay_http_') ? t('up_http', { code: note.slice(10) }) : t(`up_${note}`));

// Per-order money and shipping steps: pay supplier (due now) → paste tracking → eBay upload result.
export default function PaymentPanel({ ledger, f }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries();
  if (!ledger) return null;
  let body;
  if (ledger.status === 'pending') body = <PayStep ledger={ledger} onDone={refresh} />;
  else if (!f || f.status === 'awaiting_tracking') body = f && <TrackingStep f={f} onDone={refresh} />;
  else if (f.status === 'uploaded') {
    body = <p className="font-semibold text-brand">{t(f.uploaded_within_handling_time ? 'upDone' : 'upLate')} {f.upload_note === 'demo' && <span className="font-normal text-muted-foreground">{t('upDemoNote')}</span>}</p>;
  } else {
    body = <><p className="text-red-700 font-semibold">{t('upFailed')}</p><p className="text-muted-foreground">{reason(t, f.upload_note)}</p><TrackingStep f={f} retry onDone={refresh} /></>;
  }
  return (
    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs space-y-1.5">
      {body}
      {ledger.status !== 'pending' && <p className="text-muted-foreground">{t('paidOn', { date: ledger.paid_date })}{f?.supplier_order_id && ` · ${t('supOrderLbl', { id: f.supplier_order_id })}`}</p>}
    </div>
  );
}