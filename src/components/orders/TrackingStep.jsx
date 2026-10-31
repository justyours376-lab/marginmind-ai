import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/i18n';

// Prompt shown right after the payment is marked paid: paste the tracking number, it is saved and uploaded to eBay.
export default function TrackingStep({ f, retry, onDone }) {
  const { t } = useLang();
  const { toast } = useToast();
  const [tn, setTn] = useState(f.tracking_number || '');
  const [carrier, setCarrier] = useState(f.carrier || '');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await base44.functions.invoke('submitTracking', { fulfillment_id: f.id, tracking_number: tn, carrier });
      if (r.data?.code) toast({ title: t(r.data.code === 'not_paid' ? 'err_not_paid' : 'opsError'), variant: 'destructive' });
      else await onDone();
    } catch {
      toast({ title: t('opsError'), variant: 'destructive' });
    }
    setBusy(false);
  };
  return (
    <div className="space-y-2">
      {!retry && <p className="font-semibold text-brand">{t('trackPrompt')}</p>}
      {f.handling_deadline && <p className="text-muted-foreground">{t('handleBy', { date: new Date(f.handling_deadline).toLocaleDateString() })}</p>}
      <div className="flex gap-2">
        <Input autoFocus={!retry} value={tn} onChange={(e) => setTn(e.target.value)} placeholder={t('trackNo')} className="h-9 text-sm bg-white" />
        <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder={t('carrierOpt')} className="h-9 text-sm bg-white w-28" />
      </div>
      <button onClick={submit} disabled={busy || tn.replace(/\s/g, '').length < 6} className="bg-ok text-white rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
        {busy && <Loader2 className="w-3 h-3 animate-spin" />}{t(retry ? 'retryUpload' : 'saveTrack')}
      </button>
    </div>
  );
}