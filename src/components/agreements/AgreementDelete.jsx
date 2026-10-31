import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { supplierLabel } from '@/lib/agreementStatus';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Admin-only delete for one agreement. Signed agreements get an extra warning about screening.
export default function AgreementDelete({ a, supplier, state }) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await base44.functions.invoke('deleteAgreement', { id: a.id });
      toast({ title: t('agrDeleted') });
      setOpen(false);
      await qc.invalidateQueries();
    } catch { toast({ title: t('agrDeleteFail'), variant: 'destructive' }); }
    setBusy(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <AlertDialogTrigger asChild>
        <button className="inline-flex items-center gap-1 bg-danger text-white rounded-full px-3 py-1.5 text-xs font-semibold"><Trash2 className="w-3 h-3" />{t('agrDelete')}</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('agrDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('agrDeleteBody', { supplier: supplierLabel(supplier) })}</AlertDialogDescription>
          {state === 'signed' && <p className="text-sm font-medium text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-3">{t('agrDeleteSignedWarn')}</p>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('cancel')}</AlertDialogCancel>
          <button onClick={remove} disabled={busy} className="inline-flex items-center justify-center gap-1 bg-danger text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('agrDelete')}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}