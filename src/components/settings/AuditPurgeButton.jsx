import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Eraser, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { downloadAuditCsv } from '@/lib/auditCsv';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Admin-only. Asks the server how many entries are older than 90 days, confirms, downloads the full CSV, then purges them.
export default function AuditPurgeButton({ userId }) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);

  const start = async () => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke('purgeAuditLog', { preview: true });
      if (data.count > 0) setInfo(data); else toast({ title: t('auditPurgeNone') });
    } catch { toast({ title: t('auditPurgeFail'), variant: 'destructive' }); }
    setBusy(false);
  };
  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await downloadAuditCsv(userId);
      const { data } = await base44.functions.invoke('purgeAuditLog', {});
      toast({ title: t('auditPurgeDone', { n: data.purged }) });
      setInfo(null);
      await qc.invalidateQueries({ queryKey: ['audit'] });
    } catch { toast({ title: t('auditPurgeFail'), variant: 'destructive' }); }
    setBusy(false);
  };

  return (
    <>
      <button onClick={start} disabled={busy} className="text-xs inline-flex items-center gap-1 bg-ok text-white rounded-full px-3 py-1.5 font-semibold disabled:opacity-60">
        {busy && !info ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eraser className="w-3 h-3" />}{t('auditPurgeBtn')}
      </button>
      <AlertDialog open={!!info} onOpenChange={(o) => !o && !busy && setInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('auditPurgeTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{info && t('auditPurgeBody', { n: info.count, date: format(new Date(info.oldest), 'PP') })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('cancel')}</AlertDialogCancel>
            <button onClick={confirm} disabled={busy} className="inline-flex items-center justify-center gap-1 bg-ok text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('purgeConfirm')}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}