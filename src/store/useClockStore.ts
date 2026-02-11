import { create } from 'zustand';

interface ClockState {
  now: number; // epoch ms
}

export const useClockStore = create<ClockState>(() => ({
  now: Date.now(),
}));

/**
 * Start the global clock tick.
 * Called once at app init (e.g. in main.tsx).
 * Every subscriber re-renders once per second.
 */
let clockInterval: ReturnType<typeof setInterval> | null = null;

export function startClock() {
  if (clockInterval) return;
  clockInterval = setInterval(() => {
    useClockStore.setState({ now: Date.now() });
  }, 1000);
}
