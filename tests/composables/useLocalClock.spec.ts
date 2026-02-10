import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLocalClock } from '@/composables/useLocalClock';
import { ref, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

function mountClock(timezoneRef: any) {
  let result: any;
  const Wrapper = defineComponent({
    setup() {
      result = useLocalClock(timezoneRef);
      return () => null;
    },
  });
  const wrapper = mount(Wrapper);
  return { wrapper, result };
}

describe('useLocalClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns formatted time for given timezone', async () => {
    const tz = ref('America/New_York'); // UTC-5
    const { result } = mountClock(tz);
    
    // 12:00 UTC = 07:00 NY
    // Note: depending on locale environment, might vary, but 'en-GB' format is HH:mm:ss
    expect(result.time.value).toBe('07:00:00');
  });

  it('ticks every second', async () => {
    const tz = ref('UTC');
    const { result } = mountClock(tz);
    
    expect(result.time.value).toBe('12:00:00');
    
    vi.advanceTimersByTime(3000);
    // await nextTick() might be needed if component updates are async
    // logic is synchronous in interval callback, but Vue updates are async
    // However, ref value is updated synchronously
    expect(result.time.value).toBe('12:00:03');
  });

  it('handles empty timezone', () => {
    const tz = ref<string | null>(null);
    const { result } = mountClock(tz);
    expect(result.time.value).toBe('');
    
    tz.value = 'UTC';
    // Watch triggers immediately?
    // immediate: true handles initial null
    // Update triggers watch callback
    // We might need nextTick for watch to fire?
    // Watch callback is usually sync if flush: 'pre' (default), but let's see
  });

  it('cleans up interval on unmount', () => {
    const tz = ref('UTC');
    const { wrapper } = mountClock(tz);
    
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    wrapper.unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
