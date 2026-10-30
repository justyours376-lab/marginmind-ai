import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import ChatText from '@/components/chat/ChatText';
import Chips from '@/components/chat/Chips';
import ProductCard from '@/components/chat/ProductCard';

// Up to 20 profit-ranked products, each with at least one US supplier record. The count is always the honest count.
// With no results the flow continues: another category, another brand status, or a fresh start.
export default function ProductsStep({ data, disabled, onPick, onEmptyPick }) {
  const { t, lang } = useLang();
  const n = data.products.length;
  const num = (v) => localNum(v, lang);
  if (n === 0) return (
    <>
      <ChatText>{t('noneFound')}</ChatText>
      <Chips items={[['cat', t('tryCat')], ['track', t('tryTrack')], ['again', t('startOver')]]} disabled={disabled} onPick={onEmptyPick} />
    </>
  );
  return (
    <>
      <ChatText>{t('foundN', { n: num(n), max: num(data.max) })}{n < data.max ? ` ${t('foundFew', { max: num(data.max) })}` : ''}</ChatText>
      <div className="grid grid-cols-2 gap-3">{data.products.map((p) => <ProductCard key={p.id} p={p} onPick={onPick} disabled={disabled} />)}</div>
    </>
  );
}