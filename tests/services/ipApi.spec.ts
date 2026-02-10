import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupIp } from '@/services/ipApi';

// Mock global fetch
global.fetch = vi.fn();

describe('ipApi service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successful lookup returns typed response', async () => {
    const mockData = {
      status: 'success',
      country: 'United States',
      countryCode: 'US',
      timezone: 'America/New_York',
      query: '8.8.8.8',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
      headers: new Headers(),
    } as Response);

    const result = await lookupIp('8.8.8.8');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('http://ip-api.com/json/8.8.8.8')
    );
  });

  it('throws error when API returns status: fail', async () => {
    const mockData = {
      status: 'fail',
      message: 'invalid query',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
      headers: new Headers(),
    } as Response);

    await expect(lookupIp('bad-ip')).rejects.toThrow('invalid query');
  });

  it('throws error on HTTP failure (e.g. 429)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
    } as Response);

    await expect(lookupIp('8.8.8.8')).rejects.toThrow('HTTP 429');
  });

  it('propagates network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(lookupIp('8.8.8.8')).rejects.toThrow('Failed to fetch');
  });

  it('handles rate limit headers without crashing', async () => {
    // Just verify it doesn't throw, since we only log warning
    const headers = new Headers();
    headers.set('X-Rl', '1'); // Limit reached warning condition

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers,
      json: async () => ({ status: 'success' }),
    } as Response);

    // Should spy on console.warn? Optional test enhancement
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await lookupIp('8.8.8.8');
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});
