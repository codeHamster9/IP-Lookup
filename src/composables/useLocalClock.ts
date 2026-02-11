import { ref, watch, type Ref } from 'vue';
import { useGlobalClock } from './useGlobalClock';

/**
 * Composable that formats the global clock time for a specific timezone.
 * Uses a shared global timer to minimize overhead when multiple instances are active.
 */
export function useLocalClock(timezone: Ref<string | null | undefined>) {
  const time = ref('');
  const { currentTime } = useGlobalClock();

  function formatTime() {
    if (!timezone.value) {
      time.value = '';
      return;
    }
    
    try {
      time.value = currentTime.value.toLocaleTimeString('en-GB', {
        timeZone: timezone.value,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (err) {
      console.error('Invalid timezone:', timezone.value, err);
      time.value = 'Invalid Timezone';
    }
  }

  // Watch timezone changes
  watch(timezone, formatTime, { immediate: true });

  // Watch global clock updates
  watch(currentTime, formatTime);

  return { time };
}
