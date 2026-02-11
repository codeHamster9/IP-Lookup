import { useQuery } from '@tanstack/react-query';
import { lookupIp } from '../services/ipApi';

/**
 * Wraps the IP lookup in a React Query `useQuery`.
 * - Caches results by IP (same IP won't re-fetch)
 * - `enabled` controls when the query fires (e.g. after blur + validation)
 */
export function useIpLookup(ip: string, enabled: boolean) {
  return useQuery({
    queryKey: ['ipLookup', ip],
    queryFn: () => lookupIp(ip),
    enabled: enabled && !!ip,
    retry: false,
    staleTime: Infinity, // IP geolocations rarely change
  });
}
