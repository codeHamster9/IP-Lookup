import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { lookupIp } from '@/services/ipApi';
import type { IpApiResponse } from '@/types';

export function useIpLookup() {
  const ip = ref('');

  const { data, isLoading, isError, error } = useQuery<IpApiResponse>({
    queryKey: computed(() => ['ip-lookup', ip.value]),
    queryFn: ({ queryKey }) => lookupIp(queryKey[1] as string),
    enabled: computed(() => !!ip.value),
    retry: 1,
    staleTime: 5 * 60 * 1000, // cache 5 min
    // Ensure data stays in cache even if no components are using it for a while
    gcTime: 15 * 60 * 1000, 
  });

  async function lookup(ipAddress: string) {
    ip.value = ipAddress;
    // Don't call refetch()! refetch() always triggers a network request.
    // Changing ip.value triggers a queryKey change, which makes useQuery 
    // check the cache automatically.
  }

  return {
    data,
    isLoading,
    isError,
    error,
    lookup,
  };
}
