import { useQuery } from '@tanstack/react-query';
import { Wallet, ClipboardCheck, PackageX, Undo2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { localNum } from '@/lib/numerals';
import { loadCashflow } from '@/lib/cashflow';
import { useEbayStatus } from '@/lib/useEbayStatus';
import StatCard from '@/components/StatCard';
import HealthTile from '@/components/home/HealthTile';

// Operations tiles. The demo badge stays on internal records and goes away on tiles fed by a live, verified eBay connection.
export default function OpsTiles({ userId }) {
  const { t, lang } = useLang();
  const ebay = useEbayStatus();
  const n = (v) => (v == null ? '–' : localNum(v, lang));
  const { data: cf } = useQuery({ queryKey: ['cashflow', userId], enabled: !!userId, queryFn: () => loadCashflow(userId) });
  const { data: c } = useQuery({
    queryKey: ['opsCounts', userId], enabled: !!userId,
    queryFn: async () => {
      const q = { created_by_id: userId };
      const [orders, holds, noTracking, returns, snap] = await Promise.all([
        base44.entities.Order.count({ ...q, status: 'awaiting_approval' }),
        base44.entities.ProductScreening.count({ ...q, status: 'manual_review' }),
        base44.entities.FulfillmentRecord.count({ ...q, status: { $in: ['awaiting_tracking', 'upload_failed'] } }),
        base44.entities.ReturnCase.count({ user_id: userId, resolved: false }),
        base44.entities.AccountHealthSnapshot.filter({ user_id: userId }, '-created_date', 1),
      ]);
      return { orders, pending: orders + holds, noTracking, returns, snap: snap[0] || null };
    },
  });
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard demo accent icon={Wallet} label={t('tileFloat')} value={cf ? `$${localNum(cf.exposure.toFixed(2), lang)}` : '–'} />
      <StatCard demo icon={ClipboardCheck} label={t('tilePending')} value={n(c?.pending)} to={c?.orders > 0 ? '/orders' : '/settings?focus=pending-review'} />
      <StatCard demo icon={PackageX} label={t('tileNoTracking')} value={n(c?.noTracking)} to="/orders" />
      <StatCard demo={!ebay} icon={Undo2} label={t('tileReturns')} value={n(c?.returns)} to="/orders" />
      <HealthTile snap={c?.snap} live={!!ebay && c?.snap?.source === 'ebay'} />
    </div>
  );
}