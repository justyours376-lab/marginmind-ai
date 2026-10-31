import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Open buyer cases (returns, item-not-received, messages), most urgent first. Shared by the Orders page and its return list.
export function useOpenReturns(userId) {
  return useQuery({
    queryKey: ['returns', userId], enabled: !!userId,
    queryFn: () => base44.entities.ReturnCase.filter({ user_id: userId, resolved: false }, 'deadline', 50),
  });
}