import { memo } from 'react';
import { useLocalTime } from '../../hooks/useLocalTime';

interface LocalClockProps {
  timezone: string;
  className?: string;
}

/**
 * Isolated clock component — subscribes to the global clock store
 * so that only this <span> re-renders every second, not the entire row.
 */
export const LocalClock = memo(function LocalClock({
  timezone,
  className,
}: LocalClockProps) {
  const localTime = useLocalTime(timezone);
  return <span className={className}>{localTime}</span>;
});
