import { create } from 'zustand';

interface ClockState {
  now: number; // epoch ms
}

export const useClockStore = create<ClockState>(() => ({
  now: Date.now(),
}));

let subscriberCount = 0;
let clockInterval: ReturnType<typeof setInterval> | null = null;

function startClock() {
  if (!clockInterval) {
    clockInterval = setInterval(() => {
      useClockStore.setState({ now: Date.now() });
    }, 1000);
  }
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

/**
 * Reference-counted clock subscription.
 * Starts the global 1-second tick when the first subscriber appears,
 * stops it when the last subscriber leaves.
 *
 * @returns cleanup function to call on unmount
 */
export function subscribeClock(): () => void {
  subscriberCount++;
  if (subscriberCount === 1) startClock();

  return () => {
    subscriberCount--;
    if (subscriberCount === 0) stopClock();
  };
}

