import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIpLookup } from '../useIpLookup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as ipApi from '../../services/ipApi';

// Mock the service
vi.mock('../../services/ipApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useIpLookup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should not fetch if enabled is false', () => {
    const { result } = renderHook(() => useIpLookup('8.8.8.8', false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true); // 'isPending' is true initially if enabled is false (status: pending, fetchStatus: idle)
    expect(result.current.fetchStatus).toBe('idle');
    expect(ipApi.lookupIp).not.toHaveBeenCalled();
  });

  it('should fetch if enabled is true', async () => {
    (ipApi.lookupIp as any).mockResolvedValue({ country: 'US' });

    const { result } = renderHook(() => useIpLookup('8.8.8.8', true), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ country: 'US' });
    expect(ipApi.lookupIp).toHaveBeenCalledWith('8.8.8.8');
  });

  it('should handle errors', async () => {
    (ipApi.lookupIp as any).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useIpLookup('8.8.8.8', true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Failed'));
  });
});
