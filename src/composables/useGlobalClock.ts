import { onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useClockStore } from '@/stores/clockStore';

/**
 * Composable that provides access to the global clock via the Pinia clock store.
 * Automatically subscribes on use and unsubscribes on component unmount.
 */
export function useGlobalClock() {
  const clockStore = useClockStore();
  const { currentTime } = storeToRefs(clockStore);

  clockStore.subscribe();

  onUnmounted(() => {
    clockStore.unsubscribe();
  });

  return { currentTime };
}
