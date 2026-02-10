import { describe, it, expect } from 'vitest';
import { isValidIpv4 } from '@/utils/validateIp';

describe('isValidIpv4(ip: string): boolean', () => {
  it('validates standard IPs', () => {
    expect(isValidIpv4('8.8.8.8')).toBe(true);
    expect(isValidIpv4('0.0.0.0')).toBe(true);
    expect(isValidIpv4('255.255.255.255')).toBe(true);
    expect(isValidIpv4('192.168.1.100')).toBe(true);
  });

  it('handles surrounding whitespace (should be trimmed)', () => {
    expect(isValidIpv4('  8.8.8.8  ')).toBe(true);
  });

  it('rejects invalid octets', () => {
    expect(isValidIpv4('256.1.1.1')).toBe(false);
    expect(isValidIpv4('999.999.999.999')).toBe(false);
    expect(isValidIpv4('-1.0.0.0')).toBe(false);
  });

  it('rejects malformed structural inputs', () => {
    expect(isValidIpv4('8.8.8')).toBe(false); // too short
    expect(isValidIpv4('8.8.8.8.8')).toBe(false); // too long
    expect(isValidIpv4('...')).toBe(false); // just dots
    expect(isValidIpv4('abc.def.ghi.jkl')).toBe(false); // non-numeric
    expect(isValidIpv4('')).toBe(false); // empty
  });

  it('rejects IPv6 addresses', () => {
    expect(isValidIpv4('::1')).toBe(false);
  });

  it('rejects mixed separators', () => {
    expect(isValidIpv4('8.8.8:8')).toBe(false);
  });
});
