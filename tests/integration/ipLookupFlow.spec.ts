import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '@/App.vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

// Mock fetch
global.fetch = vi.fn();

function mountApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // disable retry for fast fail
  });

  return mount(App, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
}

describe('Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('Happy path: Lookup a valid IP', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        status: 'success',
        country: 'United States',
        countryCode: 'US',
        timezone: 'UTC',
        query: '8.8.8.8'
      }),
    } as Response);

    const wrapper = mountApp();
    const input = wrapper.find('input');
    
    await input.setValue('8.8.8.8');
    await input.trigger('blur');
    
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('8.8.8.8'));
    
    // Robust wait
    await vi.waitUntil(() => wrapper.find('.flag').exists(), { timeout: 1000, interval: 50 });
    
    expect(wrapper.find('.flag').text()).toBe('🇺🇸');
    expect(wrapper.find('.clock').exists()).toBe(true);
  });

  it('Invalid IP shows error without API call', async () => {
    const wrapper = mountApp();
    const input = wrapper.find('input');
    
    await input.setValue('invalid-ip');
    await input.trigger('blur');
    
    // Wait for potential async effects (should be none, but to be safe)
    await new Promise(r => setTimeout(r, 50));
    
    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Invalid IP address');
  });

  it.skip('API Error shows error message', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        status: 'fail',
        message: 'private range'
      }),
    } as Response);

    const wrapper = mountApp();
    const input = wrapper.find('input');
    
    await input.setValue('192.168.1.1');
    await input.trigger('blur');
    
    await vi.waitUntil(() => wrapper.text().includes('private range'), { timeout: 1000, interval: 50 });
    
    expect(wrapper.text()).toContain('private range');
  });
});
