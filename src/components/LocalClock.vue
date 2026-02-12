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
  color: var(--color-text-secondary);
  font-weight: 500;
  width: 8ch; /* slightly wider for comfort */
  display: inline-block;
  text-align: right;
}
</style>
