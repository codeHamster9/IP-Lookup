import { ref, onUnmounted } from 'vue';

/**
 * Global clock singleton that ticks once per second.
 * Shared across all components to minimize timer overhead.
 */
class GlobalClock {
  private static instance: GlobalClock | null = null;
  private intervalId: number | null = null;
  private refCount = 0;
  public currentTime = ref(new Date());

  private constructor() {
    this.tick();
    this.intervalId = window.setInterval(() => this.tick(), 1000);
  }

  private tick() {
    this.currentTime.value = new Date();
  }

  public static getInstance(): GlobalClock {
    if (!GlobalClock.instance) {
      GlobalClock.instance = new GlobalClock();
    }
    return GlobalClock.instance;
  }

  public subscribe(): void {
    this.refCount++;
  }

  public unsubscribe(): void {
    this.refCount--;
    if (this.refCount === 0 && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      GlobalClock.instance = null;
    }
  }
}

/**
 * Composable that provides access to the global clock.
 * Returns a reactive Date object that updates every second.
 */
export function useGlobalClock() {
  const clock = GlobalClock.getInstance();
  
  clock.subscribe();
  
  onUnmounted(() => {
    clock.unsubscribe();
  });

  return {
    currentTime: clock.currentTime,
  };
}
