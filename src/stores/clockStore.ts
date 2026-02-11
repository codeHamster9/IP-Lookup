import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Global clock store – maintains a single `setInterval` timer that
 * is started on first use and cleaned up when the last subscriber leaves.
 */
export const useClockStore = defineStore('clock', () => {
  const currentTime = ref(new Date());
  let intervalId: number | null = null;
  let refCount = 0;

  function tick() {
    currentTime.value = new Date();
  }

  function subscribe() {
    refCount++;
    if (refCount === 1) {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }
  }

  function unsubscribe() {
    refCount--;
    if (refCount <= 0) {
      refCount = 0;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  }

  return { currentTime, subscribe, unsubscribe };
});
