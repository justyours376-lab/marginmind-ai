import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import { useAgent } from '@/lib/useAgent';
import { TRACKS, CATEGORIES } from '@/lib/ceoFlow';
import AgentBubble from '@/components/chat/AgentBubble';
import ChatText from '@/components/chat/ChatText';
import Chips from '@/components/chat/Chips';
import UserBubble from '@/components/chat/UserBubble';
import BannedPanel from '@/components/chat/BannedPanel';
import ProductsStep from '@/components/chat/ProductsStep';
import ProductCard from '@/components/chat/ProductCard';
import SupplierReport from '@/components/chat/SupplierReport';
import RoughProfitCard from '@/components/chat/RoughProfitCard';
import QuoteCard from '@/components/chat/QuoteCard';
import ListingCard from '@/components/chat/ListingCard';

export default function Chat() {
  const { t } = useLang();
  const { me } = useMe();
  const a = useAgent();
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [a.msgs, a.busy]);
  // A product tapped on the Products screen continues here (one tap = one step).
  const loc = useLocation();
  const nav = useNavigate();
  const opened = useRef(false);
  useEffect(() => {
    const p = loc.state?.product;
    if (!p || opened.current) return;
    opened.current = true;
    nav('/chat', { replace: true, state: null });
    a.openProduct(p);
  }, []);
  const cap = me?.spend_cap ?? 200;
  const pct = me?.returns_reserve ?? 5;
  const later = (i) => a.msgs.slice(i + 1);
  // A step is "answered" once the user has tapped something after it; deleting that tap re-opens the step.
  const answered = (i) => later(i).some((x) => x.kind === 'user');
  const off = (i) => !!a.busy || answered(i);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold text-brand">{t('chat')}</h1>
        <button onClick={a.reset} className="text-sm flex items-center gap-1.5 rounded-full border border-brand/30 bg-white px-3 py-1.5 font-medium text-brand"><RotateCcw className="w-4 h-4" />{t('startOver')}</button></div>
      {a.msgs.map((m, i) => m.kind === 'user' ? (
        <UserBubble key={i} text={m.text} label={t('deleteSel')} disabled={!!a.busy} onDelete={() => a.removeFrom(i)} />
      ) : (
        <AgentBubble key={i}>
          {m.kind === 'greet' && <><ChatText>{t('greeting')}</ChatText><Chips items={TRACKS.map(([k, l]) => [k, t(l)])} disabled={off(i)} onPick={(k, l) => a.pickTrack(k, l)} /></>}
          {m.kind === 'categories' && <><ChatText>{t('chooseCat')}</ChatText><Chips items={CATEGORIES.map(([k, l]) => [k, t(l)])} disabled={off(i)} onPick={(k, l) => a.pickCategory(m.track, k, l)} /></>}
          {m.kind === 'banned' && <BannedPanel data={m.data} />}
          {m.kind === 'tracks' && <><ChatText>{t('chooseTrack')}</ChatText><Chips items={TRACKS.map(([k, l]) => [k, t(l)])} disabled={off(i)} onPick={(k, l) => a.pickTrack(k, l)} /></>}
          {m.kind === 'product' && <div className="w-44"><ProductCard p={m.product} /></div>}
          {m.kind === 'products' && <ProductsStep data={m.data} disabled={off(i)} onPick={(x) => a.pick(x)}
            onEmptyPick={(k, l) => (k === 'cat' ? a.anotherCategory(m.data.track, l) : k === 'track' ? a.anotherTrack(l) : a.reset())} />}
          {m.kind === 'choice' && <><ChatText>{t('chooseGroup')}</ChatText><Chips items={[['us', t('optUs')], ['nonus', t('optNonUs')]]} disabled={off(i)} onPick={(g, l) => a.pickGroup(m, g, l)} /></>}
          {m.kind === 'supplier' && <SupplierReport report={m.report} product={m.product} group={m.group}
            selectedId={later(i).find((x) => x.kind === 'rfqPrompt')?.supplier.id} onSelect={off(i) ? undefined : (s) => a.selectSupplier(m, s)} />}
          {m.kind === 'rfqPrompt' && <><RoughProfitCard product={m.product} supplier={m.supplier} pct={pct} /><Chips items={[['rfq', t('requestRfq')]]} disabled={off(i)} onPick={(k, l) => a.rfq(m, l)} /></>}
          {m.kind === 'quote' && <><ChatText>{t('rfqSent')}</ChatText>
            <QuoteCard q={m.quote} product={m.product} supplier={m.supplier} pct={pct} cap={cap} busy={a.busy === 'order'} done={later(i).some((x) => x.kind === 'listing')} overCap={m.overCap} onApprove={() => a.approve(m)} onConfirm={() => a.approve(m, true)} onCancel={a.cancelOver} /></>}
          {m.kind === 'error' && <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-2.5 text-sm max-w-md">{t(`err_${m.code}`)}</div>}
          {m.kind === 'bench' && <><ChatText>{t('benchPrompt')}</ChatText><p className="text-xs text-muted-foreground">{t('benchNote', { names: m.bench.map((s) => s.name).join(', ') })}</p>
            <Chips items={m.bench.map((s) => [s.id, s.name])} disabled={off(i)} onPick={(id) => a.selectSupplier(m, m.bench.find((s) => s.id === id))} /></>}
          {m.kind === 'listing' && <ListingCard listing={m.listing} demo={m.demo} />}
        </AgentBubble>
      ))}
      {a.busy && <AgentBubble><ChatText><span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t(a.busy === 'scan' ? 'scanning' : a.busy === 'supplier' ? 'researching' : 'placing')}</span></ChatText></AgentBubble>}
      <div ref={end} />
    </div>
  );
}