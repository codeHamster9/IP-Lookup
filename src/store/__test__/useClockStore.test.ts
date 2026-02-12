import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useClockStore, subscribeClock } from '../useClockStore';

describe('useClockStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should initialize with current time', () => {
        const state = useClockStore.getState();
        expect(state.now).toBeDefined();
        expect(state.now).toBeCloseTo(Date.now(), -3); // Within 1s
    });

    it('should start ticking on first subscriber and update every second', () => {
        const initialTime = useClockStore.getState().now;

        const unsubscribe = subscribeClock();

        vi.advanceTimersByTime(1000);
        const timeAfter1s = useClockStore.getState().now;
        expect(timeAfter1s).toBeGreaterThan(initialTime);

        vi.advanceTimersByTime(1000);
        const timeAfter2s = useClockStore.getState().now;
        expect(timeAfter2s).toBeGreaterThan(timeAfter1s);

        unsubscribe();
    });

    it('should not start multiple intervals for multiple subscribers', () => {
        const setIntervalSpy = vi.spyOn(global, 'setInterval');

        const unsub1 = subscribeClock();
        const unsub2 = subscribeClock();

        expect(setIntervalSpy).toHaveBeenCalledTimes(1);

        unsub1();
        unsub2();
    });

    it('should stop the clock when all subscribers leave', () => {
        const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

        const unsub1 = subscribeClock();
        const unsub2 = subscribeClock();

        unsub1(); // still one subscriber left
        expect(clearIntervalSpy).not.toHaveBeenCalled();

        unsub2(); // last subscriber gone — clock should stop
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should restart the clock when a new subscriber appears after all left', () => {
        const setIntervalSpy = vi.spyOn(global, 'setInterval');

        const unsub1 = subscribeClock();
        unsub1(); // clock stops

        const unsub2 = subscribeClock(); // clock starts again
        expect(setIntervalSpy).toHaveBeenCalledTimes(2);

        unsub2();
    });
});

