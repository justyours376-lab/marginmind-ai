import { useLang } from '@/lib/i18n';
import { useEbayStatus } from '@/lib/useEbayStatus';

const locales = { en: 'en-US', ne: 'ne-NP', hi: 'hi-IN' };

// Header banner: the original internal-records text, unless a verified eBay connection exists.
export default function StatusLine() {
  const { t, lang } = useLang();
  const ebay = useEbayStatus();
  const text = ebay
    ? t('liveEbay', { ts: new Date(ebay.syncedAt).toLocaleString(locales[lang] || 'en-US') })
    : t('statusLine');
  return <p className="px-4 py-1 text-[11px] text-white/80 bg-black/20">{text}</p>;
}