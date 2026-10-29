import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useMe() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const update = async (data) => { await base44.auth.updateMe(data); await qc.invalidateQueries({ queryKey: ['me'] }); };
  return { me: q.data, isLoading: q.isLoading, update };
}