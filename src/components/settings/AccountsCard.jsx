import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

const providers = [['ebay', 'eBay'], ['alibaba', 'Alibaba'], ['shopify', 'Shopify'], ['payment', 'Payment']];

export default function AccountsCard({ userId }) {
  const { t } = useLang();
  const { data = [] } = useQuery({ queryKey: ['accounts', userId], enabled: !!userId, queryFn: () => base44.entities.ConnectedAccount.filter({ created_by_id: userId }) });
  return (
    <section className="bg-white rounded-2xl p-5 border border-black/5">
      <h2 className="font-semibold text-brand mb-3">{t('accounts')}</h2>
      {providers.map(([k, l]) => {
        const acc = data.find((a) => a.provider === k);
        return (
          <div key={k} className="flex justify-between py-2 border-b last:border-0 text-sm">
            <span>{l} {acc?.hint && <span className="text-muted-foreground text-xs">· {acc.hint}</span>}</span>
            <span className={acc ? 'text-amber-700' : 'text-muted-foreground'}>{acc ? t('keySaved') : t('notConnected')}</span>
          </div>
        );
      })}
    </section>
  );
}