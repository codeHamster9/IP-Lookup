import { ref, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { lookupIp } from '@/services/ipApi';
import type { IpApiResponse } from '@/types';

export function useIpLookup() {
  const ip = ref('');

  const { data, isLoading, isError, error, refetch } = useQuery<IpApiResponse>({
    queryKey: computed(() => ['ip-lookup', ip.value]),
    queryFn: () => lookupIp(ip.value),
    enabled: false, // only fetch on manual lookup
    retry: 1,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  async function lookup(ipAddress: string) {
    ip.value = ipAddress;
    // Force a refetch for the new IP
    await refetch();
  }

  return {
    data,
    isLoading,
    isError,
    error,
    lookup,
  };
}
