<script setup lang="ts">
import { type Component } from 'vue';

interface Props {
  icon: Component;
  label?: string;
  size?: number;
  title?: string;
  variant?: 'ghost' | 'primary' | 'danger';
  color?: string;
  tabindex?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  title: '',
  variant: 'ghost'
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
  <button 
    class="btn" 
    :class="[`variant-${variant}`, { 'has-label': !!label }]"
    @click="emit('click', $event)" 
    :title="title || label" 
    type="button"
    :style="color ? { '--btn-color': color } : {}"
    :tabindex="tabindex"
  >
    <component :is="icon" :size="size" />
    <span v-if="label" class="btn-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  outline: none;
  font-family: inherit;
  font-weight: 500;
  gap: 8px;
}

/* Base styles for round icon button */
.btn:not(.has-label) {
  width: auto;
  padding: 8px;
  border-radius: 50%;
}

/* Base styles for labeled button */
.btn.has-label {
  padding: 8px 16px;
  border-radius: var(--radius-input, 8px);
  font-size: 0.95rem;
}

/* Variant: Ghost (Default - transparent bg) */
.variant-ghost {
  background: transparent;
  color: var(--btn-color, #90a4ae);
}

.variant-ghost:hover {
  background-color: rgba(0, 0, 0, 0.05);
  filter: brightness(0.8);
  transform: scale(1.1);
}

/* Variant: Primary (Solid bg) */
.variant-primary {
  background-color: var(--color-primary);
  color: white;
}

.variant-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.2);
}

/* Variant: Danger */
.variant-danger {
  background-color: transparent;
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
}

.variant-danger:hover {
  background-color: #ffebee;
  border-color: #ef5350;
  color: #ef5350;
}

.btn:active {
  transform: scale(0.95);
}

.btn:not(.has-label):hover {
  transform: scale(1.1);
}

.btn:not(.has-label):active {
  transform: scale(0.9);
}
</style>
