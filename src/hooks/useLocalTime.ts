import { useMemo } from 'react';
import { useClockStore } from '../store/useClockStore';

/**
 * Derives a formatted local time string from the global clock store.
 * No timer of its own — purely reactive to the Zustand `now` tick.
 *
 * @param timezone  IANA timezone string (e.g. "America/New_York"), or null
 * @returns         Formatted time "HH:MM:SS", or empty string if no timezone
 */
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
