import { Pencil, FileSignature, RefreshCw } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { agreementState, supplierLabel } from '@/lib/agreementStatus';
import AgreementDelete from '@/components/agreements/AgreementDelete';

const BADGE = { signed: 'bg-green-100 text-green-800', expired: 'bg-red-100 text-red-800', draft: 'bg-gray-100 text-gray-700' };
const LABEL = { signed: 'agrSigned', expired: 'agrExpired', draft: 'agrDraft' };

// One agreement row. The id lets notifications deep-link here (/settings?focus=agreement-<id>).
export default function AgreementItem({ a, supplier, onOpen }) {
  const { t } = useLang();
  const state = agreementState(a);
  const brands = (a.authorized_brands || []).join(', ');
  const action = { draft: ['agrSignNow', FileSignature], expired: ['agrRenew', RefreshCw], signed: ['agrEdit', Pencil] }[state];
  const Icon = action[1];
  return (
    <li id={`agreement-${a.id}`} className="py-3 space-y-1.5 px-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{supplierLabel(supplier)}</p>
        <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${BADGE[state]}`}>{t(LABEL[state])}</span>
        {a.is_test && <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">{t('agrTest')}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        {[a.signed_date && t('agrSignedOn', { date: a.signed_date }), a.expiry_date ? t('agrExpiresOn', { date: a.expiry_date }) : t('agrNoExpiry')].filter(Boolean).join(' · ')}
      </p>
      <p className="text-xs">{a.dispatch_time_days ? t('agrDispatchLine', { n: a.dispatch_time_days }) : t('agrNoDispatch')} · {brands || t('agrNoBrands')}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onOpen(a, 'default')} className={`inline-flex items-center gap-1 text-white rounded-full px-3 py-1.5 text-xs font-semibold ${state === 'signed' ? 'bg-info' : 'bg-ok'}`}><Icon className="w-3 h-3" />{t(action[0])}</button>
        {state !== 'signed' && <button onClick={() => onOpen(a, 'edit')} className="inline-flex items-center gap-1 border rounded-full px-3 py-1.5 text-xs font-semibold"><Pencil className="w-3 h-3" />{t('agrEdit')}</button>}
        <AgreementDelete a={a} supplier={supplier} state={state} />
      </div>
    </li>
  );
}