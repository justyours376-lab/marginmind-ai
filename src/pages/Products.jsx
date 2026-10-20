import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import ProductCard from '@/components/chat/ProductCard';

export default function Products() {
  const { t } = useLang();
  const { me } = useMe();
  const { data = [], isLoading } = useQuery({
    queryKey: ['products', me?.id], enabled: !!me,
    queryFn: () => base44.entities.Product.filter({ created_by_id: me.id }, '-created_date', 60),
  });
  return (
    <div>
      <h1 className="text-xl font-bold text-brand mb-4">{t('products')}</h1>
      {!isLoading && data.length === 0 && <p className="text-muted-foreground text-sm">{t('noProducts')}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{data.map((p) => <ProductCard key={p.id} p={p} disabled />)}</div>
    </div>
  );
}