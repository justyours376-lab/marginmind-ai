import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import { Skeleton } from '@/components/ui/skeleton';

export const DAY_NAMES = {
  ne: ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'],
  hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const names = DAY_NAMES;

// 7 bars (units sold per day) with the day name under each bar. days = [{ key: 'YYYY-MM-DD', n }]
export default function TrendCard({ days = [] }) {
  const { t, lang } = useLang();
  const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <section className="bg-white rounded-2xl p-4 border border-black/5">
      <h2 className="font-semibold text-brand mb-3">{t('trend7')}</h2>
      {days.length === 0 ? <Skeleton className="h-28 w-full rounded-xl" /> : (
        <div className="flex items-end justify-between gap-2 h-28">
          {days.map((d) => {
            const day = names[lang][new Date(`${d.key}T00:00:00Z`).getUTCDay()];
            return (
              <div key={d.key} title={`${day}: ${localNum(d.n, lang)}`} className="group flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-xs font-medium text-muted-foreground group-hover:text-brand transition-colors">{localNum(d.n, lang)}</span>
                <div data-testid="trend-bar" className="w-full rounded-t-md bg-emerald-600 group-hover:bg-emerald-800 transition-colors" style={{ height: `${Math.max(4, (d.n / max) * 70)}%` }} />
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}