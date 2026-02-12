<script setup lang="ts">
import { ref } from 'vue';
import { Trash2, Plus } from 'lucide-vue-next';
import IpRow from './IpRow.vue';
import Button from './Button.vue';

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

function removeRow(id: number) {
  const index = rows.value.findIndex(r => r.id === id);
  if (index !== -1) {
    rows.value.splice(index, 1);
  }
}

function removeAll() {
  rows.value = [];
}
</script>

<template>
  <div class="card">
    <header class="card-header">
      <div class="header-content">
        <img src="@/assets/vue.svg" alt="Vue Logo" class="vue-logo" />
        <h2 class="card-title">ip-lookup vue version</h2>
      </div>
    </header>
    
    <div class="card-body">
      <p class="subtitle">
        Enter one or more IP addresses and get their country
      </p>

      <div class="controls">
        <Button 
          :icon="Plus" 
          label="Add" 
          variant="primary" 
          @click="addRow" 
        />
        <Button 
          v-if="rows.length > 0" 
          @click="removeAll" 
          :icon="Trash2"
          title="Remove All" 
          :size="18"
          color="#ff5252"
        />
      </div>

      <div class="rows-container">
        <IpRow
          v-for="(row, index) in rows"
          :key="row.id"
          :row-number="index + 1"
          v-model="row.ip"
          @remove="removeRow(row.id)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(66, 184, 131, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background-color: var(--color-primary); /* Vue Green instead of Dark Blue */
  color: white;
  border-bottom: 4px solid rgba(0,0,0,0.1); /* Slight depth */
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vue-logo {
  width: 32px;
  height: 32px;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.card-body {
  padding: 0; 
  background-color: #f0fdf4; /* Very light green tint */
  display: flex;
  flex-direction: column;
}

.subtitle {
  color: #2c3e50; /* Darker text for readability on light green */
  font-size: 0.95rem;
  padding: 24px 24px 0 24px; 
  margin: 0 0 20px 0;
  line-height: 1.5;
  opacity: 0.9;
}

.controls {
  padding: 0 24px 24px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rows-container {
  height: 500px; /* Fixed height for approx 8-10 rows */
  overflow-y: auto;
  border-top: 1px solid rgba(66, 184, 131, 0.2);
  padding: 0 24px;
  /* Green scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: #42b883 #e0f2f1;
}

.rows-container::-webkit-scrollbar {
  width: 8px;
}

.rows-container::-webkit-scrollbar-track {
  background: #e0f2f1;
}

.rows-container::-webkit-scrollbar-thumb {
  background-color: #42b883;
  border-radius: 4px;
  border: 2px solid #e0f2f1;
}

@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
</style>
