import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMe } from '@/lib/useMe';

// Returns the verified, connected eBay account (or null). Any failure or missing flag means "not verified".
// Reads only the status flags from the server; credentials never reach the browser through this hook.
export function useEbayStatus() {
  const { me } = useMe();
  const { data } = useQuery({
    queryKey: ['ebayStatus', me?.id], enabled: !!me, retry: false,
    queryFn: async () => {
      const { data: s } = await base44.functions.invoke('getEbayApiStatus', {});
      return s?.connected && s?.connection_verified && s?.last_verified_at ? { syncedAt: s.last_verified_at } : null;
    },
  });
  return data || null;
}