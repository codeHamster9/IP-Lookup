import { useEffect, useMemo } from 'react';
import { useClockStore, subscribeClock } from '../store/useClockStore';

/**
 * Derives a formatted local time string from the global clock store.
 * No timer of its own — purely reactive to the Zustand `now` tick.
 * Manages clock subscription lifecycle via reference counting.
 *
 * @param timezone  IANA timezone string (e.g. "America/New_York"), or null
 * @returns         Formatted time "HH:MM:SS", or empty string if no timezone
 */
export function useLocalTime(timezone: string | null): string {
  // Subscribe to the global clock when we have a timezone;
  // the clock starts on first subscriber and stops on last unsubscribe.
  useEffect(() => {
    if (!timezone) return;
    const unsubscribe = subscribeClock();
    return unsubscribe;
  }, [timezone]);

  // Only subscribe to the clock if we have a timezone
  const now = useClockStore((s) => (timezone ? s.now : 0));

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

