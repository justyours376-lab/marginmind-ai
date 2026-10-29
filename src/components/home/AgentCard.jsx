import { Bot } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// Honest agent status: the chat only runs when the user starts it; no automatic scan is scheduled.
export default function AgentCard() {
  const { t } = useLang();
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5 flex gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><Bot className="w-4 h-4" /></div>
      <div className="text-sm">
        <h2 className="font-semibold text-brand">{t('agentTitle')}</h2>
        <p className="mt-0.5">{t('agentIdle')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('agentNext')}</p>
      </div>
    </section>
  );
}