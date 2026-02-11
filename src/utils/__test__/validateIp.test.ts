import { describe, it, expect } from 'vitest';
import { isValidIpv4 } from '../validateIp';

describe('isValidIpv4', () => {
  it('should return true for valid IPv4 addresses', () => {
    expect(isValidIpv4('8.8.8.8')).toBe(true);
    expect(isValidIpv4('192.168.1.1')).toBe(true);
    expect(isValidIpv4('127.0.0.1')).toBe(true);
    expect(isValidIpv4('0.0.0.0')).toBe(true);
    expect(isValidIpv4('255.255.255.255')).toBe(true);
  });

  it('should return false for invalid IPv4 addresses', () => {
    expect(isValidIpv4('256.256.256.256')).toBe(false);
    expect(isValidIpv4('1.2.3')).toBe(false);
    expect(isValidIpv4('1.2.3.4.5')).toBe(false);
    expect(isValidIpv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIpv4('')).toBe(false);
    expect(isValidIpv4(' ')).toBe(false);
    expect(isValidIpv4('...')).toBe(false);
  });

  it('should handle whitespace correctly', () => {
    expect(isValidIpv4(' 8.8.8.8 ')).toBe(true);
  });
});
