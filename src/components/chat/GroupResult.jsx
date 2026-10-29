import { useLang } from '@/lib/i18n';
import ChatText from '@/components/chat/ChatText';
import Chips from '@/components/chat/Chips';

// Level 2: niche chips ONLY for niches that have at least one qualifying product in the scanned group.
export default function GroupResult({ m, disabled, onPick }) {
  const { t } = useLang();
  const us = m.group === 'us';
  const label = { cosmetics: t('cosmetics'), home: t('homeNiche'), profitable: t('profitable') };
  if (m.data.products.length === 0) return <ChatText>{t(us ? 'noGroupUs' : 'noGroupNonUs')}</ChatText>;
  const keys = [...m.data.niches.filter((n) => n.qualified > 0).map((n) => n.niche), 'profitable'];
  return (
    <>
      {!us && <ChatText>{t('nonUsNote')}</ChatText>}
      <Chips items={keys.map((k) => [k, label[k] || k])} disabled={disabled} onPick={onPick} />
    </>
  );
}