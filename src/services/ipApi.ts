import type { IpApiResponse } from '@/types';

export async function lookupIp(ip: string): Promise<IpApiResponse> {
  const res = await fetch(
    `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,timezone,query`
  );

  // Simple rate limit check
  const remaining = res.headers.get('X-Rl');
  if (remaining && parseInt(remaining, 10) < 5) {
    console.warn(`Rate limit warning: ${remaining} requests remaining`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data: IpApiResponse = await res.json();

  if (data.status === 'fail') {
    throw new Error(data.message || 'Unknown error');
  }

  return data;
}
