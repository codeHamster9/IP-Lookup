<script setup lang="ts">
import { computed, ref } from 'vue';
import { Loader2, Trash2 } from 'lucide-vue-next';
import { useIpLookup } from '@/composables/useIpLookup';
import { isValidIpv4 } from '@/utils/validateIp';
import LocalClock from './LocalClock.vue';
import Button from './Button.vue';

const props = defineProps<{
  rowNumber: number;
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'remove'): void;
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

const errorMessage = computed(() => {
  if (props.modelValue && !isValid.value && !isLoading.value) {
    return 'Invalid IP address';
  }
  if (isError.value && !isLoading.value && searchedIp.value === props.modelValue) {
    return error.value?.message;
  }
  return null;
});

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
          :class="{ 'has-error': errorMessage }"
        />
        
        <Button 
          @click="emit('remove')" 
          :icon="Trash2" 
          title="Remove row" 
          :size="16" 
          tabindex="-1"
        />

        <!-- Loading Spinner -->
        <Loader2 v-if="isLoading" class="spinner-icon" :size="20" />
        
        <!-- Result: Flag & Clock -->
        <div v-else-if="showResult" class="result">
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

        <!-- Error / Validation Message (Inline) -->
        <div v-else-if="errorMessage" class="error-inline">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ip-row {
  display: flex;
  align-items: center; /* Align center vertically now */
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  width: 100%;
}

.row-badge {
  background: #eef5f0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #42b883;
  margin-right: 16px;
  flex-shrink: 0;
}

.row-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  /* Wraps input + results */
  gap: 4px;
}

/* Wraps input + results */

input {
  /* FIXED WIDTH as requested */
  width: 290px;
  flex: 0 0 290px; 
  padding: 10px 14px; /* Standard padding */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
  background: #fff;
}

.spinner-icon {
  margin-left: 12px;
  color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.15);
}

input.has-error {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

input:disabled {
  background-color: #fafafa;
  color: #999;
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



.error-inline {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-left: 12px;
  animation: fadeIn 0.3s ease;
  white-space: nowrap;
}
</style>
