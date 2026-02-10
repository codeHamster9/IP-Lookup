<script setup lang="ts">
import { ref } from 'vue';
import IpRow from './IpRow.vue';
import AddButton from './AddButton.vue';

interface RowData {
  id: number;
  ip: string;
}

const rows = ref<RowData[]>([
  { id: Date.now(), ip: '' }
]);

function addRow() {
  rows.value.push({ id: Date.now(), ip: '' });
}

function reset() {
  // Clear all rows to a single empty row
  rows.value = [{ id: Date.now(), ip: '' }];
}
</script>

<template>
  <div class="card">
    <header class="card-header">
      <h2 class="card-title">IP Lookup</h2>
      <button class="close-btn" @click="reset" title="Clear All">✕</button>
    </header>
    
    <div class="card-body">
      <p class="subtitle">
        Enter one or more IP addresses and get their country
      </p>

      <div class="controls">
        <AddButton @click="addRow" />
      </div>

      <div class="rows-container">
        <IpRow
          v-for="(row, index) in rows"
          :key="row.id"
          :row-number="index + 1"
          v-model="row.ip"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background-color: #fff;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.2s, background-color 0.2s;
}

.close-btn:hover {
  color: var(--color-error);
  background-color: rgba(211, 47, 47, 0.05);
}

.card-body {
  padding: 24px;
  background-color: #fff;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.controls {
  margin-bottom: 24px;
}

.rows-container {
  border-top: 1px solid var(--color-border);
}
</style>
