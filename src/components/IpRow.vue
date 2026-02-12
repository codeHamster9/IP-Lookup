<script setup lang="ts">
import { computed, ref } from 'vue';
import { useIpLookup } from '@/composables/useIpLookup';
import { isValidIpv4 } from '@/utils/validateIp';
import LocalClock from './LocalClock.vue';

const props = defineProps<{
  rowNumber: number;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { data, isLoading, isError, error, lookup } = useIpLookup();
const searchedIp = ref('');

// Derived state
const isValid = computed(() => isValidIpv4(props.modelValue));
const showResult = computed(() => 
  !isLoading.value && 
  !isError.value && 
  data.value && 
  searchedIp.value === props.modelValue
);

// Watch for external model changes to reset if needed? 
// No, handled by showResult check (modelValue vs searchedIp).

async function onBlur() {
  const ip = props.modelValue.trim();
  if (!ip) return;
  
  if (isValid.value) {
    searchedIp.value = ip;
    await lookup(ip);
  } else {
    searchedIp.value = ''; // Hide previous results if now invalid
  }
}

function countryCodeToFlagUrl(code: string): string {
  if (!code) return '';
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}
</script>

<template>
  <div class="ip-row">
    <div class="row-badge">{{ rowNumber }}</div>
    
    <div class="row-content">
      <div class="input-wrapper">
        <input 
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @blur="onBlur"
          :disabled="isLoading"
          placeholder="Enter IP address (e.g. 8.8.8.8)"
          :class="{ 'has-error': !isValid && modelValue && !isLoading }"
        />
        
        <!-- Loading Spinner -->
        <span v-if="isLoading" class="spinner"></span>
        
        <!-- Result: Flag & Clock -->
        <div v-if="showResult" class="result">
          <img
            v-if="data?.countryCode"
            class="flag"
            :src="countryCodeToFlagUrl(data.countryCode)"
            :alt="data?.country || data?.countryCode"
            :title="data?.country"
            width="24"
            height="18"
          />
          <LocalClock :timezone="data?.timezone" />
        </div>
      </div>

      <!-- Error / Validation Message -->
      <div v-if="!isValid && modelValue && !isLoading" class="error-msg">
        Invalid IP address
      </div>
      <div v-if="isError && !isLoading && searchedIp === modelValue" class="error-msg api-error">
        {{ error?.message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.ip-row {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
}

.row-badge {
  background: #eee;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-right: 16px;
  margin-top: 4px;
  flex-shrink: 0;
}

.row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

input {
  flex: 0 1 290px; 
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: 1rem;
  outline: none;
  min-width: 0; /* flex fix */
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.2);
}

input.has-error {
  border-color: var(--color-error);
}

input:disabled {
  background-color: #fafafa;
  color: #999;
}

.spinner {
  margin-left: 12px;
}

.result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
  white-space: nowrap;
  animation: fadeIn 0.3s ease;
}

.flag {
  width: 24px;
  height: 18px;
  border-radius: 2px;
  object-fit: cover;
  cursor: help;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.15);
}



.error-msg {
  color: var(--color-error);
  font-size: 0.85rem;
  margin-top: 6px;
}

.api-error {
  color: #d32f2f;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
