import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import { useAgent } from '@/lib/useAgent';
import { localNum } from '@/lib/numerals';
import AgentBubble from '@/components/chat/AgentBubble';
import ChatText from '@/components/chat/ChatText';
import Chips from '@/components/chat/Chips';
import UserBubble from '@/components/chat/UserBubble';
import GroupResult from '@/components/chat/GroupResult';
import RestrictedList from '@/components/chat/RestrictedList';
import ProductCard from '@/components/chat/ProductCard';
import SupplierReport from '@/components/chat/SupplierReport';
import QuoteCard from '@/components/chat/QuoteCard';
import ListingCard from '@/components/chat/ListingCard';

export default function Chat() {
  const { t, lang } = useLang();
  const { me } = useMe();
  const a = useAgent();
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [a.msgs, a.busy]);
  // A product tapped on the Products screen opens its supplier report here (one tap = one step).
  const loc = useLocation();
  const nav = useNavigate();
  const opened = useRef(false);
  useEffect(() => {
    const p = loc.state?.product;
    if (!p || opened.current) return;
    opened.current = true;
    nav('/chat', { replace: true, state: null });
    a.pick(p, 'us');
  }, []);
  const cap = me?.spend_cap ?? 200;
  const later = (i) => a.msgs.slice(i + 1);
  // A step is "answered" once the user has tapped something after it; deleting that tap re-opens the step.
  const answered = (i) => later(i).some((x) => x.kind === 'user');
  const off = (i) => !!a.busy || answered(i);
  const groups = [['us', t('grpUs')], ['nonus', t('grpNonUs')]];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold text-brand">{t('chat')}</h1>
        <button onClick={a.reset} className="text-sm flex items-center gap-1 text-muted-foreground"><RotateCcw className="w-4 h-4" />{t('startOver')}</button></div>
      {a.msgs.map((m, i) => m.kind === 'user' ? (
        <UserBubble key={i} text={m.text} label={t('deleteSel')} disabled={!!a.busy} onDelete={() => a.removeFrom(i)} />
      ) : (
        <AgentBubble key={i}>
          {m.kind === 'greet' && <><ChatText>{t('greeting')}</ChatText><Chips items={groups} disabled={off(i)} onPick={(g, l) => a.pickGroup(g, l)} /></>}
          {m.kind === 'groupResult' && <GroupResult m={m} disabled={off(i)} onPick={(n, l) => a.pickNiche(m, n, l)} />}
          {m.kind === 'restricted' && <RestrictedList items={m.items} />}
          {m.kind === 'products' && <><ChatText>{t('pickProduct', { n: localNum(m.products.length, lang) })}</ChatText>
            <div className="grid grid-cols-2 gap-3">{m.products.map((p) => <ProductCard key={p.id} p={p} onPick={(x) => a.pick(x, m.group)} disabled={off(i)} />)}</div></>}
          {m.kind === 'supplier' && <SupplierReport report={m.report} product={m.product} group={m.group}
            selectedId={later(i).find((x) => x.kind === 'rfqPrompt')?.supplier.id} onSelect={off(i) ? undefined : (s) => a.selectSupplier(m, s)} />}
          {m.kind === 'rfqPrompt' && <Chips items={[['rfq', t('requestRfq')]]} disabled={off(i)} onPick={(k, l) => a.rfq(m, l)} />}
          {m.kind === 'quote' && <><ChatText>{t('rfqSent')}</ChatText>
            <QuoteCard q={m.quote} cap={cap} busy={a.busy === 'order'} done={later(i).some((x) => x.kind === 'listing')} overCap={m.overCap} onApprove={() => a.approve(m)} onConfirm={() => a.approve(m, true)} onCancel={a.cancelOver} /></>}
          {m.kind === 'error' && <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-4 py-2.5 text-sm max-w-md">{t(`err_${m.code}`)}</div>}
          {m.kind === 'listing' && <ListingCard listing={m.listing} demo={m.demo} />}
        </AgentBubble>
      ))}
      {a.busy && <AgentBubble><ChatText><span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t(a.busy === 'scan' ? 'scanning' : a.busy === 'supplier' ? 'researching' : 'placing')}</span></ChatText></AgentBubble>}
      <div ref={end} />
    </div>
  );
}