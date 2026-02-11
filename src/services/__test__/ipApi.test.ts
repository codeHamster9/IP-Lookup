import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { lookupIp } from '../ipApi';

describe('lookupIp', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return data on successful response', async () => {
    const mockData = {
      status: 'success',
      country: 'United States',
      countryCode: 'US',
      timezone: 'America/New_York',
      query: '8.8.8.8',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => '45' },
      json: async () => mockData,
    });

    const result = await lookupIp('8.8.8.8');
    expect(result).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('http://ip-api.com/json/8.8.8.8'),
    );
  });

  it('should throw an error on HTTP failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => '45' },
    });

    await expect(lookupIp('8.8.8.8')).rejects.toThrow('HTTP 500');
  });

  it('should throw an error if API returns status: fail', async () => {
    const mockData = {
      status: 'fail',
      message: 'invalid query',
      query: 'invalid',
    };

    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => '45' },
      json: async () => mockData,
    });

    await expect(lookupIp('invalid')).rejects.toThrow('invalid query');
  });

  it('should fail with "Unknown error" if message is missing in fail response', async () => {
      const mockData = {
        status: 'fail',
        query: 'invalid',
      };
  
      fetchMock.mockResolvedValue({
        ok: true,
        headers: { get: () => '45' },
        json: async () => mockData,
      });
  
      await expect(lookupIp('invalid')).rejects.toThrow('Unknown error');
    });

  it('should warn if rate limit is low', async () => {
    const mockData = { status: 'success' };
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => '4' }, // Low rate limit
      json: async () => mockData,
    });

    await lookupIp('8.8.8.8');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Rate limit nearly exhausted'),
    );
  });
});
