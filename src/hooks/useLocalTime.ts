// Hook to derive local time from timezone
import { useMemo } from 'react';
import { useClockStore } from '../store/useClockStore';

export function useLocalTime(timezone: string | null): string {
  const now = useClockStore((s) => s.now);

  return useMemo(() => {
    if (!timezone) return '';
    return new Date(now).toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [now, timezone]);
}
