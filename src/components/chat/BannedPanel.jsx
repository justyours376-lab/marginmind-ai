import { useLang } from '@/lib/i18n';
import { reasonLabel } from '@/lib/restrictionReasons';
import ChatText from '@/components/chat/ChatText';
import RestrictedList from '@/components/chat/RestrictedList';

// Track 4: view only. Lists banned items (from the server screening) and the eBay rule categories enforced. No choices, no order path.
export default function BannedPanel({ data }) {
  const { t, lang } = useLang();
  return (
    <div className="space-y-3">
      <ChatText>{t('bannedIntro')}</ChatText>
      <RestrictedList items={data.restricted} />
      <div className="bg-white rounded-2xl p-4 border border-black/5 max-w-md">
        <p className="font-bold text-brand text-sm">{t('rulesTitle', { v: data.policy_version })}</p>
        <ul className="text-xs list-disc pl-4 mt-2 space-y-0.5">{data.rules.map((r) => <li key={r}>{reasonLabel(r, lang)}</li>)}</ul>
        <p className="text-[11px] text-muted-foreground mt-2">{t('rulesNote')}</p>
      </div>
    </div>
  );
}