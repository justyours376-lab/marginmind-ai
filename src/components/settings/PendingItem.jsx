import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Check, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { reasonLabel } from '@/lib/notifMsgs';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// One listing held for manual review. Approve sends it through the normal approval flow (all server checks run again);
// Reject logs the hold reason to the audit log and removes the held item for good.
export default function PendingItem({ p }) {
  const { t, lang } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const fail = (code) => { const m = t(`err_${code}`); toast({ title: m === `err_${code}` ? t('opsError') : m, variant: 'destructive' }); };

  const approve = async (confirm) => {
    setBusy(true);
    try {
      const { data: d } = await base44.functions.invoke('approveOrder', { release_screening_id: p.id, user_approved: true, confirm_over_cap: !!confirm });
      if (d.needs_confirm) { setBusy(false); if (window.confirm(t('overCap'))) await approve(true); return; }
      if (d.code) fail(d.code); else toast({ title: t('prApproved') });
    } catch { toast({ title: t('opsError'), variant: 'destructive' }); }
    await qc.invalidateQueries();
    setBusy(false);
  };
  const reject = async () => {
    setBusy(true);
    try {
      const { data: d } = await base44.functions.invoke('rejectHeld', { screening_id: p.id });
      if (d.code) fail(d.code); else toast({ title: t('prRejected') });
    } catch { toast({ title: t('opsError'), variant: 'destructive' }); }
    await qc.invalidateQueries();
    setBusy(false);
  };

  return (
    <li className="py-2 space-y-1.5">
      <p className="font-medium">{p.product_name}</p>
      <p className="text-xs text-muted-foreground">{format(new Date(p.created_date), 'PPp')}</p>
      <p className="text-xs">{String(p.reasons || '').split(',').filter(Boolean).map((c) => reasonLabel(lang, c)).join('; ')}</p>
      <div className="flex gap-2">
        <button onClick={() => approve(false)} disabled={busy} className="inline-flex items-center gap-1 bg-ok text-white rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}{t('prApprove')}
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button disabled={busy} className="inline-flex items-center gap-1 bg-danger text-white rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-60"><X className="w-3 h-3" />{t('prReject')}</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('prRejectTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{p.product_name}. {t('prRejectBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={reject} className="bg-danger text-white hover:bg-danger/90">{t('prReject')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}