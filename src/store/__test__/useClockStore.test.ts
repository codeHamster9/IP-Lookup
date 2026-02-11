import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClockStore, startClock } from '../useClockStore';

describe('useClockStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(async () => {
        vi.clearAllTimers();
        vi.useRealTimers();
        const { stopClock } = await import('../useClockStore');
        stopClock();
    });

    it('should initialize with current time', () => {
        const state = useClockStore.getState();
        expect(state.now).toBeDefined();
        expect(state.now).toBeCloseTo(Date.now(), -3); // Within 1s
    });

    it('should update time every second when started', () => {
        const initialTime = useClockStore.getState().now;
        
        startClock();

        vi.advanceTimersByTime(1000); // 1s
        const timeAfter1s = useClockStore.getState().now;
        expect(timeAfter1s).toBeGreaterThan(initialTime);

        vi.advanceTimersByTime(1000); // 1s
        const timeAfter2s = useClockStore.getState().now;
        expect(timeAfter2s).toBeGreaterThan(timeAfter1s);
    });

    it('should not start multiple intervals if called twice', () => {
        const setIntervalSpy = vi.spyOn(global, 'setInterval');
        startClock();
        startClock();
        
        // Should be called once (or kept as is if implementation checks for existing interval)
        // With vi.useFakeTimers(), global.setInterval is a mock.
        expect(setIntervalSpy).toHaveBeenCalledTimes(1); 
    });
});
