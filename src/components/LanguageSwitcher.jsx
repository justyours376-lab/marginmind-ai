import { useLang } from '@/lib/i18n';

const opts = [['ne', 'नेपाली'], ['hi', 'हिन्दी'], ['en', 'EN']];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full bg-white/10 p-0.5 text-xs">
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => setLang(k)}
          className={`px-2.5 py-1 rounded-full transition-all ${lang === k ? 'bg-gold text-brand font-semibold' : 'text-white/80 hover:text-white'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}