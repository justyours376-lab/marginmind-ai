import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMe } from '@/lib/useMe';

// Returns the verified, connected eBay account (or null). Any failure or missing flag means "not verified".
export function useEbayStatus() {
  const { me } = useMe();
  const { data } = useQuery({
    queryKey: ['ebayStatus', me?.id], enabled: !!me, retry: false,
    queryFn: async () => {
      const rows = await base44.entities.ConnectedAccount.filter({ created_by_id: me.id, provider: 'ebay' });
      const a = rows.find((r) => r.status === 'connected' && r.connection_verified === true);
      return a ? { syncedAt: a.last_verified_at || a.updated_date } : null;
    },
  });
  return data || null;
}