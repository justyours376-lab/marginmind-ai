import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import { loadCashflow } from '@/lib/cashflow';

const money = (v, lang) => `$${localNum(v.toFixed(2), lang)}`;

// Card float exposure = supplier payments marked paid minus eBay payouts received.
export default function CashFlowCard({ userId }) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [amt, setAmt] = useState('');
  const { data } = useQuery({
    queryKey: ['cashflow', userId], enabled: !!userId,
    queryFn: () => loadCashflow(userId),
  });
  const record = async () => {
    const amount = Number(amt);
    if (!(amount > 0)) return;
    await base44.entities.PaymentLedger.create({ order_ref: 'payout', direction: 'payout_received', amount, currency: 'USD', method: 'ebay_payout', status: 'settled', settled_date: new Date().toISOString().slice(0, 10) });
    setAmt('');
    qc.invalidateQueries({ queryKey: ['cashflow'] });
  };
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5 space-y-3">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
        <div className="flex-1">
          <h2 className="font-semibold text-brand text-sm">{t('cfTitle')}</h2>
          {data ? <p className="text-3xl font-bold tracking-tight text-brand leading-tight">{money(data.exposure, lang)}</p> : <Skeleton className="h-8 w-28 my-1" />}
          <p className="text-xs text-muted-foreground">{t('cfSub')}</p>
          {data && <p className="text-xs mt-1">{t('cfPaid')}: {money(data.paid, lang)} · {t('cfPayouts')}: {money(data.payouts, lang)}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <Input type="number" min="0" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={t('cfAmount')} className="h-9 text-sm" />
        <button onClick={record} disabled={!(Number(amt) > 0)} className="bg-ok text-white rounded-full px-4 text-xs font-semibold whitespace-nowrap disabled:opacity-50">{t('cfAdd')}</button>
      </div>
    </section>
  );
}