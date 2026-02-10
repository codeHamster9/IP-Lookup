import { ref, watch, onUnmounted, type Ref } from 'vue';

export function useLocalClock(timezone: Ref<string | null | undefined>) {
  const time = ref('');
  let intervalId: number | null = null;

  function tick() {
    if (!timezone.value) return;
    try {
      time.value = new Date().toLocaleTimeString('en-GB', {
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

  watch(
    timezone,
    (tz) => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (tz) {
        tick();
        intervalId = window.setInterval(tick, 1000);
      } else {
        time.value = '';
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { time };
}
