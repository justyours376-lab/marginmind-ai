import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import ProductCard from '@/components/chat/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Products() {
  const { t } = useLang();
  const { me } = useMe();
  const nav = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ['products', me?.id], enabled: !!me,
    queryFn: () => base44.entities.Product.filter({ created_by_id: me.id }, '-created_date', 60),
  });
  return (
    <div>
      <h1 className="text-xl font-bold text-brand mb-4">{t('products')}</h1>
      {isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>}
      {!isLoading && data.length === 0 && <p className="text-muted-foreground text-sm">{t('noProducts')}</p>}
      {/* Tapping a card opens its supplier report in Chat (US-qualified suppliers only, checked on the server). */}
      <div className="grid grid-cols-2 gap-3">{data.map((p) => <ProductCard key={p.id} p={p} onPick={(x) => nav('/chat', { state: { product: x } })} />)}</div>
    </div>
  );
}