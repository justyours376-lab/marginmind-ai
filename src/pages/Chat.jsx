import { useEffect, useRef } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import { useAgent } from '@/lib/useAgent';
import AgentBubble from '@/components/chat/AgentBubble';
import ProductCard from '@/components/chat/ProductCard';
import SupplierReport from '@/components/chat/SupplierReport';
import QuoteCard from '@/components/chat/QuoteCard';
import ListingCard from '@/components/chat/ListingCard';

const Text = ({ children }) => <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm inline-block border border-black/5">{children}</div>;

export default function Chat() {
  const { t } = useLang();
  const { me } = useMe();
  const a = useAgent();
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [a.msgs, a.busy]);
  const chips = [['cosmetics', t('cosmetics')], ['home', t('homeNiche')], ['profitable', t('profitable')]];
  const cap = me?.spend_cap ?? 200;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold text-brand">{t('chat')}</h1>
        <button onClick={a.reset} className="text-sm flex items-center gap-1 text-muted-foreground"><RotateCcw className="w-4 h-4" />{t('startOver')}</button></div>
      {a.msgs.map((m, i) => m.kind === 'user' ? (
        <div key={i} className="flex justify-end"><div className="bg-brand text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm">{m.text}</div></div>
      ) : (
        <AgentBubble key={i}>
          {m.kind === 'greet' && <><Text>{t('greeting')}</Text>
            <div className="flex flex-wrap gap-2">{chips.map(([k, l]) => <button key={k} disabled={!!a.busy} onClick={() => a.scan(k, l)} className="px-4 py-2 rounded-full border-2 border-gold text-brand text-sm font-semibold hover:bg-gold transition">{l}</button>)}</div></>}
          {m.kind === 'products' && <><Text>{t('pickProduct')}</Text>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{m.products.map((p) => <ProductCard key={p.id} p={p} onPick={a.pick} disabled={!!a.busy} />)}</div></>}
          {m.kind === 'supplier' && <SupplierReport s={m.supplier} done={m.done} onRfq={() => a.rfq(m)} />}
          {m.kind === 'quote' && <><Text>{t('rfqSent')}</Text>
            <QuoteCard q={m.quote} cap={cap} busy={a.busy === 'order'} done={m.done} overCap={m.overCap} onApprove={() => a.approve(m)} onConfirm={() => a.approve(m, true)} onCancel={a.cancelOver} /></>}
          {m.kind === 'listing' && <ListingCard listing={m.listing} demo={m.demo} />}
        </AgentBubble>
      ))}
      {a.busy && <AgentBubble><Text><span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t(a.busy === 'scan' ? 'scanning' : a.busy === 'supplier' ? 'researching' : 'placing')}</span></Text></AgentBubble>}
      <div ref={end} />
    </div>
  );
}