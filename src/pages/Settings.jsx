import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import AccountsCard from '@/components/settings/AccountsCard';
import AuditLogCard from '@/components/settings/AuditLogCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const hooks = [['trend', 'trendScan'], ['supplier', 'supplierResearch'], ['order', 'orderList'], ['sale', 'saleWatch']];

export default function Settings() {
  const { t, lang } = useLang();
  const { me, update } = useMe();
  const { toast } = useToast();
  const [f, setF] = useState({ webhooks: {}, spend_cap: 200, notification_email: '' });
  useEffect(() => { if (me) setF({ webhooks: me.webhooks || {}, spend_cap: me.spend_cap ?? 200, notification_email: me.notification_email || me.email }); }, [me]);
  const save = async () => { await update({ ...f, spend_cap: Number(f.spend_cap), language: lang }); toast({ title: t('saved') }); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand">{t('settings')}</h1>
      <AccountsCard userId={me?.id} />
      <section className="bg-white rounded-2xl p-5 border border-black/5 space-y-3">
        <h2 className="font-semibold text-brand">{t('webhooks')}</h2>
        {hooks.map(([k, l]) => (
          <label key={k} className="block text-sm">{t(l)}
            <Input className="mt-1" placeholder="https://your-n8n.app/webhook/..." value={f.webhooks[k] || ''} onChange={(e) => setF({ ...f, webhooks: { ...f.webhooks, [k]: e.target.value } })} />
          </label>
        ))}
      </section>
      <section className="bg-white rounded-2xl p-5 border border-black/5 space-y-3">
        <label className="block text-sm">{t('spendCap')}<Input type="number" className="mt-1" value={f.spend_cap} onChange={(e) => setF({ ...f, spend_cap: e.target.value })} /></label>
        <label className="block text-sm">{t('notifEmail')}<Input type="email" className="mt-1" value={f.notification_email} onChange={(e) => setF({ ...f, notification_email: e.target.value })} /></label>
        <div className="text-sm flex items-center justify-between">{t('language')}<div className="bg-brand rounded-full"><LanguageSwitcher /></div></div>
        <button onClick={save} className="w-full bg-brand text-white rounded-full py-2.5 font-semibold">{t('save')}</button>
      </section>
      <AuditLogCard userId={me?.id} />
      <button onClick={() => base44.auth.logout('/login')} className="w-full border rounded-full py-2.5 text-sm">{t('logout')}</button>
    </div>
  );
}