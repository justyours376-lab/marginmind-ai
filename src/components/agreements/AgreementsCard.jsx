import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useFocusScroll } from '@/lib/useFocusScroll';
import { agreementState, todayStr } from '@/lib/agreementStatus';
import AgreementItem from '@/components/agreements/AgreementItem';
import AgreementForm from '@/components/agreements/AgreementForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Admin-only list of supplier agreements, with create / edit / sign / renew.
export default function AgreementsCard({ userId }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(null);
  const { data: agreements = [], isSuccess } = useQuery({
    queryKey: ['agreements', userId], enabled: !!userId,
    queryFn: () => base44.entities.Agreement.filter({ created_by_id: userId }, '-created_date', 200),
  });
  const { data: suppliers = [] } = useQuery({ queryKey: ['allSuppliers', userId], enabled: !!userId, queryFn: () => base44.entities.Supplier.filter({}, 'name', 500) });
  useFocusScroll(isSuccess);
  const byId = Object.fromEntries(suppliers.map((s) => [s.id, s]));

  // Sign now opens the form already set to signed; Renew also clears the old expiry date.
  const open = (a, how) => {
    const state = agreementState(a);
    if (how === 'edit' || state === 'signed') return setEditing(a);
    return setEditing({ ...a, status: 'signed', signed_date: todayStr(), expiry_date: state === 'expired' ? '' : a.expiry_date });
  };

  return (
    <section id="agreements" className="bg-white rounded-2xl p-5 border border-black/5">
      <div className="flex justify-between items-center gap-2">
        <h2 className="font-semibold text-brand">{t('agrTitle')} ({agreements.length})</h2>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-1 bg-ok text-white rounded-full px-3 py-1.5 text-xs font-semibold"><Plus className="w-3 h-3" />{t('agrAdd')}</button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t('agrHint')}</p>
      {agreements.length === 0 && <p className="text-sm text-muted-foreground">{t('agrNone')}</p>}
      <ul className="divide-y text-sm">{agreements.map((a) => <AgreementItem key={a.id} a={a} supplier={byId[a.supplier_ref]} onOpen={open} />)}</ul>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t('agrEdit') : t('agrAdd')}</DialogTitle>
            <DialogDescription>{t('agrHint')}</DialogDescription>
          </DialogHeader>
          {editing && <AgreementForm key={editing.id || 'new'} initial={editing} suppliers={suppliers} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}