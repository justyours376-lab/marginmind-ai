import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLang } from '@/lib/i18n';
import { supplierLabel } from '@/lib/agreementStatus';
import DocField from '@/components/agreements/DocField';

// The agreement form inputs. `f` is the form state, `set(key, value)` updates one field.
export default function AgreementFields({ f, set, suppliers }) {
  const { t } = useLang();
  const hint = (k) => <span className="text-xs text-muted-foreground">{t(k)}</span>;
  return (
    <div className="space-y-3">
      <label className="block text-sm">{t('agrSupplier')}
        <select value={f.supplier_ref} onChange={(e) => set('supplier_ref', e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="">{suppliers.length ? t('agrPickSupplier') : t('agrNoSuppliers')}</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{supplierLabel(s)}</option>)}
        </select>
      </label>
      <label className="block text-sm">{t('agrStatus')}
        <select value={f.status} onChange={(e) => set('status', e.target.value)} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
          <option value="draft">{t('agrDraft')}</option>
          <option value="signed">{t('agrSigned')}</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">{t('agrSignedDate')}<Input type="date" className="mt-1" value={f.signed_date} onChange={(e) => set('signed_date', e.target.value)} /></label>
        <label className="block text-sm">{t('agrExpiry')}<Input type="date" className="mt-1" value={f.expiry_date} onChange={(e) => set('expiry_date', e.target.value)} /></label>
      </div>
      <label className="block text-sm">{t('agrDispatch')}<Input type="number" min="1" max="60" className="mt-1" value={f.dispatch_time_days} onChange={(e) => set('dispatch_time_days', e.target.value)} />{hint('agrDispatchHint')}</label>
      <label className="block text-sm">{t('agrBrands')}<Input className="mt-1" value={f.brands} onChange={(e) => set('brands', e.target.value)} />{hint('agrBrandsHint')}</label>
      <DocField label={t('agrResale')} uri={f.resale_certificate_uri} onChange={(v) => set('resale_certificate_uri', v)} />
      <DocField label={t('agrSignedDoc')} uri={f.agreement_document_uri} onChange={(v) => set('agreement_document_uri', v)} />
      <label className="block text-sm">{t('agrDocRef')}<Input className="mt-1" value={f.document_ref} onChange={(e) => set('document_ref', e.target.value)} />{hint('agrDocRefHint')}</label>
      <label className="block text-sm">{t('agrPayTerms')}<Textarea className="mt-1" rows={2} value={f.payment_terms} onChange={(e) => set('payment_terms', e.target.value)} />{hint('agrPayHint')}</label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={f.is_test} onChange={(e) => set('is_test', e.target.checked)} />{t('agrTestMark')}
      </label>
    </div>
  );
}