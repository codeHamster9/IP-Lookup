import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalTime } from '../useLocalTime';
import { useClockStore } from '../../store/useClockStore';

describe('useLocalTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useClockStore.setState({ now: new Date(2025, 0, 1, 12, 0, 0).getTime() }); // Fixed reference time
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return formatted time for a valid timezone', () => {
        const utcTime = Date.UTC(2025, 0, 1, 12, 0, 0); // 12:00 UTC
        act(() => {
             useClockStore.setState({ now: utcTime });
        });

        const { result: resultUTC } = renderHook(() => useLocalTime('UTC'));
        expect(resultUTC.current).toBe('12:00:00');

        const { result: resultNY } = renderHook(() => useLocalTime('America/New_York'));
        // 12:00 UTC is 07:00 in NY (EST)
        expect(resultNY.current).toBe('07:00:00');
    });

    it('should return empty string if timezone is null', () => {
        const { result } = renderHook(() => useLocalTime(null));
        expect(result.current).toBe('');
    });

    it('should update when global clock ticks', () => {
        const utcTime = Date.UTC(2025, 0, 1, 12, 0, 0); // 12:00:00 UTC
        act(() => {
            useClockStore.setState({ now: utcTime });
        });

        const { result, rerender } = renderHook(() => useLocalTime('UTC'));
        expect(result.current).toBe('12:00:00');

        // Advance time by 1 second
        const newTime = utcTime + 1000;
        act(() => {
            useClockStore.setState({ now: newTime });
        });

        rerender();

        expect(result.current).toBe('12:00:01');
    });

    it('should handle invalid timezones gracefully', () => {
        expect(() => {
            renderHook(() => useLocalTime('Invalid/Timezone'));
        }).toThrow();
    });
});
