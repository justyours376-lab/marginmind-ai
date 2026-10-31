import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import AgreementFields from '@/components/agreements/AgreementFields';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const start = (a) => ({
  supplier_ref: a.supplier_ref || '', status: a.status === 'signed' ? 'signed' : 'draft', signed_date: a.signed_date || '', expiry_date: a.expiry_date || '',
  dispatch_time_days: a.dispatch_time_days ?? '', brands: (a.authorized_brands || []).join(', '), payment_terms: a.payment_terms || '', document_ref: a.document_ref || '',
  resale_certificate_uri: a.resale_certificate_uri || '', agreement_document_uri: a.agreement_document_uri || '', is_test: a.is_test === true,
});

// Create / edit form. The server validates, asks for confirmation when dispatch time or brands are missing, and writes the audit log.
export default function AgreementForm({ initial, suppliers, onDone }) {
  const { t } = useLang();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [f, setF] = useState(() => start(initial));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (confirmed = false) => {
    setWarn(null); setErr('');
    if (!f.supplier_ref) { setErr(t('agrErr_supplier_required')); return; }
    setBusy(true);
    try {
      const { data: d } = await base44.functions.invoke('saveAgreement', { id: initial.id, confirmed, data: { ...f, authorized_brands: f.brands } });
      if (d.needs_confirm) setWarn(d.warnings);
      else if (d.code) setErr(t(`agrErr_${d.code}`));
      else {
        toast({ title: f.status === 'signed' ? t('agrSignedOk') : t('agrSaved') });
        await qc.invalidateQueries();
        onDone();
      }
    } catch { setErr(t('agrErr_generic')); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <AgreementFields f={f} set={set} suppliers={suppliers} />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button onClick={() => submit(false)} disabled={busy} className="w-full bg-ok text-white rounded-full py-2.5 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}{t('agrSave')}
      </button>
      <AlertDialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agrWarnTitle')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <ul className="list-disc pl-5 space-y-1">{(warn || []).map((w) => <li key={w}>{t(`agrWarn_${w}`)}</li>)}</ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('agrBack')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit(true)}>{t('agrSaveAnyway')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}