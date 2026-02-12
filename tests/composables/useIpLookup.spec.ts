import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { useIpLookup } from '@/composables/useIpLookup';

// Mock the ipApi service
vi.mock('@/services/ipApi');
import { lookupIp } from '@/services/ipApi';

function mountWithQuery(composable: () => any) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  let result: any;
  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  });

  const wrapper = mount(TestComponent, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });

  return { wrapper, result, queryClient };
}

describe('useIpLookup composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is correct', () => {
    const { result } = mountWithQuery(useIpLookup);
    expect(result.data.value).toBeUndefined();
    expect(result.isLoading.value).toBe(false);
    expect(result.isError.value).toBe(false);
  });

  it('lookup() triggers loading state and fetches data', async () => {
    const mockData = { status: 'success', country: 'US' };
    vi.mocked(lookupIp).mockResolvedValue(mockData as any);
    
    const { result } = mountWithQuery(useIpLookup);
    
    const promise = result.lookup('8.8.8.8');
    
    // Check loading during fetch? useQuery updates asynchronously so hard to catch isLoading: true immediately without flushing
    // But we check that helper was called
    
    await promise;
    
    expect(lookupIp).toHaveBeenCalledWith('8.8.8.8');
    await vi.waitUntil(() => result.data.value);
    expect(result.data.value).toEqual(mockData);
    expect(result.isError.value).toBe(false);
  });

  it('lookup() handles errors', async () => {
    vi.mocked(lookupIp).mockRejectedValue(new Error('API failure'));
    const { result } = mountWithQuery(useIpLookup);
    
    try {
      await result.lookup('bad-ip');
    } catch (e) {
      // refetch might not reject, useQuery handles error state
    }
    
    await vi.waitUntil(() => result.isError.value, { timeout: 3000 });
    expect(result.isError.value).toBe(true);
    expect(result.error.value).toBeTruthy();
  });

  it('enabled: false means no automatic fetch on mount', () => {
    // We already checked lookupIp calls, but verify count 0 initially
    const { result } = mountWithQuery(useIpLookup);
    expect(lookupIp).not.toHaveBeenCalled();
  });
});
