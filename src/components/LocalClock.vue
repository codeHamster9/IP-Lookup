<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useLocalClock } from '@/composables/useLocalClock';

const props = defineProps<{
  timezone: string | null | undefined;
}>();

const timezoneRef = toRef(props, 'timezone');
const { time } = useLocalClock(timezoneRef);
</script>

<template>
  <span class="clock">{{ time }}</span>
</template>

<style scoped>
.clock {
  font-family: 'Roboto Mono', monospace;
  color: #333;
  width: 7ch; /* approx width for 00:00:00 */
  display: inline-block;
}
</style>
