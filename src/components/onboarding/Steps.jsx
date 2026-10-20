import { ShieldCheck, PartyPopper } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import OptionTile from '@/components/onboarding/OptionTile';
import Field from '@/components/onboarding/Field';

export default function Steps({ step, d, set }) {
  const { t } = useLang();
  const c = (k) => (v) => set({ ...d, creds: { ...d.creds, [k]: v } });
  if (step === 0) return (<div className="space-y-3">
    <OptionTile label="eBay" selected={d.channel === 'ebay'} onClick={() => set({ ...d, channel: 'ebay' })} />
    <OptionTile label="Amazon" badge={t('comingSoon')} disabled />
    <OptionTile label="Shopify" selected={d.channel === 'shopify'} onClick={() => set({ ...d, channel: 'shopify' })} />
  </div>);
  if (step === 1) return (<div className="space-y-3">
    <p className="text-xs flex gap-2 bg-emerald-50 text-emerald-800 p-3 rounded-xl"><ShieldCheck className="w-4 h-4 shrink-0" />{t('noPassword')}</p>
    {d.channel === 'ebay' ? <><Field label={t('appId')} value={d.creds.app_id} onChange={c('app_id')} /><Field label={t('certId')} type="password" value={d.creds.cert_id} onChange={c('cert_id')} /><Field label={t('oauthToken')} type="password" value={d.creds.oauth_token} onChange={c('oauth_token')} /></>
      : <><Field label={t('shopDomain')} value={d.creds.shop} onChange={c('shop')} /><Field label={t('adminToken')} type="password" value={d.creds.admin_token} onChange={c('admin_token')} /></>}
  </div>);
  if (step === 2) return (<div className="space-y-3">
    <OptionTile label="Alibaba" selected={d.source === 'alibaba'} onClick={() => set({ ...d, source: 'alibaba' })} />
    {[['1688', '1688'], ['dhgate', 'DHgate'], ['made_in_china', 'Made-in-China']].map(([k, l]) => <OptionTile key={k} label={l} badge={t('beta')} selected={d.source === k} onClick={() => set({ ...d, source: k })} />)}
    <Field label={t('alibabaKey')} type="password" value={d.srcKey} onChange={(v) => set({ ...d, srcKey: v })} />
  </div>);
  if (step === 3) return (<div className="space-y-3">
    <label className="block text-sm">{t('payType')}
      <select className="mt-1 w-full border rounded-md h-9 px-2 bg-white" value={d.pay.type} onChange={(e) => set({ ...d, pay: { ...d.pay, type: e.target.value } })}>
        <option value="card">{t('card')}</option><option value="paypal">{t('paypal')}</option><option value="bank">{t('bank')}</option>
      </select></label>
    <Field label={t('payLabel')} value={d.pay.label} onChange={(v) => set({ ...d, pay: { ...d.pay, label: v } })} />
    <Field label={t('last4')} value={d.pay.last4} onChange={(v) => set({ ...d, pay: { ...d.pay, last4: v.replace(/\D/g, '').slice(0, 4) } })} />
    <p className="text-xs text-muted-foreground">{t('payNote')}</p>
  </div>);
  return (<div className="text-center py-6"><PartyPopper className="w-12 h-12 text-gold mx-auto" /><p className="mt-3 text-muted-foreground">{t('readyText')}</p></div>);
}