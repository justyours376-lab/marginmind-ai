import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n';

// Live countdown to a reply deadline. Turns red in the last 24 hours and when overdue.
export default function Countdown({ to }) {
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);
  const ms = Date.parse(to) - now;
  if (ms <= 0) return <span className="text-red-600 font-semibold">{t('retOverdue')}</span>;
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return <span className={`font-semibold ${ms < 864e5 ? 'text-red-600' : 'text-brand'}`}>{t('retLeft', { d, h, m })}</span>;
}