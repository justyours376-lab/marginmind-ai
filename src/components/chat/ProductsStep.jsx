import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import ChatText from '@/components/chat/ChatText';
import ProductCard from '@/components/chat/ProductCard';

// Up to 20 profit-ranked products, each with at least one US supplier record. The count is always the honest count.
export default function ProductsStep({ data, disabled, onPick }) {
  const { t, lang } = useLang();
  const n = data.products.length;
  const num = (v) => localNum(v, lang);
  if (n === 0) return <ChatText>{t('noneFound')}</ChatText>;
  return (
    <>
      <ChatText>{t('foundN', { n: num(n), max: num(data.max) })}{n < data.max ? ` ${t('foundFew', { max: num(data.max) })}` : ''}</ChatText>
      <div className="grid grid-cols-2 gap-3">{data.products.map((p) => <ProductCard key={p.id} p={p} onPick={onPick} disabled={disabled} />)}</div>
    </>
  );
}