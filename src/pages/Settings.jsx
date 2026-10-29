import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import AccountsCard from '@/components/settings/AccountsCard';
import AuditLogCard from '@/components/settings/AuditLogCard';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Settings() {
  const { t, lang } = useLang();
  const { me, update } = useMe();
  const { toast } = useToast();
  const [f, setF] = useState({ spend_cap: 200, returns_reserve: 5, notification_email: '' });
  useEffect(() => { if (me) setF({ spend_cap: me.spend_cap ?? 200, returns_reserve: me.returns_reserve ?? 5, notification_email: me.notification_email || me.email }); }, [me]);
  const save = async () => {
    const reserve = Math.min(50, Math.max(0, Number(f.returns_reserve) || 0));
    await update({ spend_cap: Number(f.spend_cap), returns_reserve: reserve, notification_email: f.notification_email, language: lang });
    toast({ title: t('saved') });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand">{t('settings')}</h1>
      <AccountsCard userId={me?.id} />
      <section className="bg-white rounded-2xl p-5 border border-black/5 space-y-3">
        <label className="block text-sm">{t('spendCap')}<Input type="number" className="mt-1" value={f.spend_cap} onChange={(e) => setF({ ...f, spend_cap: e.target.value })} /></label>
        <label className="block text-sm">{t('returnsReserve')}<Input type="number" min="0" max="50" className="mt-1" value={f.returns_reserve} onChange={(e) => setF({ ...f, returns_reserve: e.target.value })} />
          <span className="text-xs text-muted-foreground">{t('returnsReserveHint')}</span></label>
        <label className="block text-sm">{t('notifEmail')}<Input type="email" className="mt-1" value={f.notification_email} onChange={(e) => setF({ ...f, notification_email: e.target.value })} /></label>
        <div className="text-sm flex items-center justify-between">{t('language')}<div className="bg-brand rounded-full"><LanguageSwitcher /></div></div>
        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p className="font-semibold text-brand">{t('schedules')}</p>
          <p>{t('schedReport')}</p>
          <p>{t('schedScan')}</p>
        </div>
        <button onClick={save} className="w-full bg-brand text-white rounded-full py-2.5 font-semibold">{t('save')}</button>
      </section>
      <AuditLogCard userId={me?.id} />
      <button onClick={() => base44.auth.logout('/login')} className="w-full border rounded-full py-2.5 text-sm">{t('logout')}</button>
    </div>
  );
}