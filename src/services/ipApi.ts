import type { IpApiResponse } from '../types';

const API_URL = 'http://ip-api.com/json';
const FIELDS = 'status,message,country,countryCode,timezone,query';

export async function lookupIp(ip: string): Promise<IpApiResponse> {
  const res = await fetch(`${API_URL}/${ip}?fields=${FIELDS}`);

  // Read rate-limit headers
  const remaining = res.headers.get('X-Rl');
  if (remaining !== null && Number(remaining) < 5) {
    console.warn(
      `[ip-api] Rate limit nearly exhausted — ${remaining} requests remaining`,
    );
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data: IpApiResponse = await res.json();

  if (data.status === 'fail') {
    throw new Error(data.message ?? 'Unknown error');
  }

  return data;
}
