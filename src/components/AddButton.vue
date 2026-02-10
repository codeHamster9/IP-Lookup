<script setup lang="ts">
// Simple styled button component
const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>();
</script>

<template>
  <button class="add-btn" @click="emit('click', $event)">
    + Add
  </button>
</template>

<style scoped>
.add-btn {
  background-color: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-input);
  padding: 8px 16px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  opacity: 0.9;
}
</style>
