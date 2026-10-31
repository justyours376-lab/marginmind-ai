import { useQueryClient } from '@tanstack/react-query';
import { useLang } from '@/lib/i18n';
import { useOpenReturns } from '@/lib/useOpenReturns';
import ReturnCaseCard from '@/components/orders/ReturnCaseCard';

// Open buyer returns / messages, most urgent first. Each has a 3-business-day reply countdown and an AI draft reply.
export default function ReturnCases({ userId }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data = [], isLoading } = useOpenReturns(userId);
  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-brand text-sm">{t('retTitle')}</h2>
      {!isLoading && data.length === 0 && <p className="text-muted-foreground text-sm">{t('retNone')}</p>}
      {data.map((c) => <ReturnCaseCard key={c.id} c={c} onResolved={() => qc.invalidateQueries({ queryKey: ['returns'] })} />)}
    </section>
  );
}