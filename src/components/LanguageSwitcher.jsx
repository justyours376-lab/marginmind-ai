import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';

const opts = [['ne', 'नेपाली'], ['hi', 'हिन्दी'], ['en', 'EN']];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const qc = useQueryClient();
  const pick = (k) => {
    setLang(k);
    qc.setQueryData(['me'], (m) => (m ? { ...m, preferred_language: k } : m));
    base44.auth.updateMe({ preferred_language: k }).catch(() => {});
  };
  return (
    <div className="flex rounded-full bg-white/15 p-0.5 text-xs">
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => pick(k)}
          className={`px-3 py-1.5 rounded-full transition-all ${lang === k ? 'bg-gold text-brand font-semibold shadow-sm' : 'text-white/90 hover:text-white hover:bg-white/10'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}