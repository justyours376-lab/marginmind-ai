import { useEffect } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Home, MessageCircle, Package, ShoppingBag, Settings, Sparkles } from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { useMe } from '@/lib/useMe';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import StatusLine from '@/components/home/StatusLine';

const tabs = [['/', 'home', Home], ['/chat', 'chat', MessageCircle], ['/products', 'products', Package], ['/orders', 'orders', ShoppingBag], ['/settings', 'settings', Settings]];

// Mobile app shell: ~480px column, sticky header + status line on top, fixed bottom navigation.
export default function Layout() {
  const { t, lang, setLang } = useLang();
  const { me, isLoading } = useMe();
  useEffect(() => { if (me?.language && me.language !== lang) setLang(me.language); }, [me?.language]);
  if (!isLoading && me && !me.onboarded) return <Navigate to="/onboarding" replace />;
  return (
    <div className="min-h-screen bg-black/5">
      <div className="relative mx-auto w-full max-w-[480px] min-h-screen bg-cream shadow-xl pb-24">
        <header className="sticky top-0 z-30 bg-brand text-white">
          <div className="px-4 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gold flex items-center justify-center"><Sparkles className="w-4 h-4 text-brand" /></div>
              <div className="min-w-0 leading-tight">
                <p className="font-bold tracking-tight truncate">{t('appName')}</p>
                <p className="text-[10px] text-white/70 truncate">{t('tagline')}</p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
          <StatusLine />
        </header>
        <main className="px-4 py-5"><Outlet /></main>
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-brand border-t border-white/10 grid grid-cols-5">
          {tabs.map(([to, k, Icon]) => (
            <NavLink key={to} to={to} end className={({ isActive }) => `flex flex-col items-center py-2 text-[11px] ${isActive ? 'text-gold font-semibold' : 'text-white/50'}`}>
              <Icon className="w-5 h-5 mb-0.5" />{t(k)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}