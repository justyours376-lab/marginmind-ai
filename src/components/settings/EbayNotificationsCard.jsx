import { useState } from 'react';
import { Bell, Copy } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import MaskToggle from '@/components/MaskToggle';
import { maskUrl } from '@/lib/mask';

// Shows where eBay should send sales, returns and buyer messages. The URL is masked until the eye is clicked.
export default function EbayNotificationsCard() {
  const { t } = useLang();
  const { toast } = useToast();
  const [shown, setShown] = useState(false);
  const url = `${window.location.origin}/functions/ebayNotifications`;
  const copy = async () => { await navigator.clipboard.writeText(url); toast({ title: t('maskCopied') }); };
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5 flex gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Bell className="w-4 h-4" /></div>
      <div className="text-sm min-w-0 flex-1">
        <h2 className="font-semibold text-brand">{t('ebTitle')}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{t('ebBody')}</p>
        <div className="mt-2 flex items-start gap-1">
          <code data-testid="webhook-url" className={`block flex-1 min-w-0 text-[11px] bg-cream rounded-lg px-2 py-1.5 break-all ${shown ? 'select-all' : 'select-none'}`}>{shown ? url : maskUrl(url)}</code>
          <MaskToggle shown={shown} onToggle={() => setShown((s) => !s)} hiddenKey="maskUrlHidden" showKey="maskUrlShow" />
          <button type="button" onClick={copy} disabled={!shown} title={shown ? t('maskCopy') : t('maskCopyLocked')} aria-label={shown ? t('maskCopy') : t('maskCopyLocked')} className="p-1.5 rounded-full bg-info text-white disabled:opacity-40 shrink-0">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}