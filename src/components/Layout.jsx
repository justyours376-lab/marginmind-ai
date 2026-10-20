import { useEffect } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, MessageCircle, Package, ShoppingBag, Settings, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useMe, allConnected } from '@/lib/useMe';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DemoBanner from '@/components/DemoBanner';

const tabs = [['/', 'home', Home], ['/chat', 'chat', MessageCircle], ['/products', 'products', Package], ['/orders', 'orders', ShoppingBag], ['/settings', 'settings', Settings]];

export default function Layout() {
  const { t, lang, setLang } = useLang();
  const { me, isLoading } = useMe();
  useEffect(() => { if (me?.language && me.language !== lang) setLang(me.language); }, [me?.language]);
  if (!isLoading && me && !me.onboarded) return <Navigate to="/onboarding" replace />;
  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="sticky top-0 z-30">
        {me && !allConnected(me) && <DemoBanner />}
        <header className="bg-brand text-white">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gold flex items-center justify-center"><Sparkles className="w-4 h-4 text-brand" /></div>
              <span className="font-bold tracking-tight truncate">{t('appName')}</span>
            </div>
            <nav className="hidden md:flex gap-1">
              {tabs.map(([to, k]) => (
                <NavLink key={to} to={to} end className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm transition ${isActive ? 'bg-white/15 text-gold' : 'text-white/75 hover:text-white'}`}>{t(k)}</NavLink>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </header>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-6"><Outlet /></main>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t grid grid-cols-5">
        {tabs.map(([to, k, Icon]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center py-2 text-[11px] ${isActive ? 'text-brand font-semibold' : 'text-muted-foreground'}`}>
            <Icon className="w-5 h-5 mb-0.5" />{t(k)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}