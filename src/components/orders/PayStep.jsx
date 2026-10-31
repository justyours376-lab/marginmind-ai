import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/i18n';

// Payment is due now. The user pays in the supplier's own portal, then marks it paid here with the supplier order id.
export default function PayStep({ ledger, onDone }) {
  const { t } = useLang();
  const { toast } = useToast();
  const [sid, setSid] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await base44.functions.invoke('recordPayment', { ledger_id: ledger.id, supplier_order_id: sid });
      await onDone();
    } catch {
      toast({ title: t('opsError'), variant: 'destructive' });
    }
    setBusy(false);
  };
  return (
    <div className="space-y-2">
      <p className="font-semibold text-brand">{t('payDue', { amount: ledger.amount })}</p>
      <p className="text-muted-foreground">{t('payNote')}</p>
      <div className="flex gap-2">
        <Input value={sid} onChange={(e) => setSid(e.target.value)} placeholder={t('supOrderId')} className="h-9 text-sm bg-white" />
        <button onClick={submit} disabled={busy || sid.trim().length < 2} className="bg-ok text-white rounded-full px-3 text-xs font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-1">
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}{t('markPaid')}
        </button>
      </div>
    </div>
  );
}