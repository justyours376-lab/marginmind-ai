import { Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import Countdown from '@/components/orders/Countdown';

export default function ReturnCaseCard({ c, onResolved }) {
  const { t } = useLang();
  const { toast } = useToast();
  const copy = async () => { await navigator.clipboard.writeText(c.ai_suggested_reply); toast({ title: t('saved') }); };
  const resolve = async () => { await base44.entities.ReturnCase.update(c.id, { resolved: true, status: 'resolved' }); onResolved(); };
  return (
    <div className="bg-white rounded-2xl p-3 border border-black/5 space-y-2 text-xs">
      <div className="flex justify-between gap-2 items-start">
        <div className="min-w-0"><p className="font-semibold text-sm truncate">{c.product_name}</p><p className="text-muted-foreground">{t(`k_${c.case_type}`)}</p></div>
        <Countdown to={c.deadline} />
      </div>
      {c.buyer_message && <p className="bg-cream rounded-xl p-2 whitespace-pre-wrap">{c.buyer_message}</p>}
      {c.ai_suggested_reply && (
        <div className="space-y-1">
          <p className="font-semibold text-brand">{t('retSuggested')}</p>
          <p className="border rounded-xl p-2 whitespace-pre-wrap">{c.ai_suggested_reply}</p>
          <button onClick={copy} className="flex items-center gap-1 text-brand font-semibold"><Copy className="w-3 h-3" />{t('retCopy')}</button>
        </div>
      )}
      <button onClick={resolve} className="border rounded-full px-3 py-1 font-semibold">{t('retResolve')}</button>
    </div>
  );
}