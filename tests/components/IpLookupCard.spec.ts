import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { computed } from 'vue';
import IpLookupCard from '@/components/IpLookupCard.vue';
import Button from '@/components/Button.vue';
import IpRow from '@/components/IpRow.vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { createPinia } from 'pinia';

function createMountOptions() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }], createPinia()],
    },
  };
}

// Mock Virtualizer
vi.mock('@tanstack/vue-virtual', () => ({
  useVirtualizer: (options: any) => {
    return computed(() => ({
      getVirtualItems: () => {
        // Access the value of the computed options passed in
        const count = options.value.count;
        return Array.from({ length: count }, (_, i) => ({
          index: i,
          key: i,
          size: 65,
          start: i * 65,
        }));
      },
      getTotalSize: () => options.value.count * 65,
    }));
  },
}));

describe('IpLookupCard.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    expect(wrapper.find('h2').text()).toBe('ip-lookup vue version');
    expect(wrapper.find('.subtitle').exists()).toBe(true);
    // Find button with text 'Add'
    const addBtn = wrapper.findAllComponents(Button).find(b => b.text().includes('Add'));
    expect(addBtn?.exists()).toBe(true);
  });

  it('starts with one empty row', () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    expect(wrapper.findAllComponents(IpRow).length).toBe(1);
    expect(wrapper.findComponent(IpRow).props('rowNumber')).toBe(1);
  });

  it('adds a row when AddButton is clicked', async () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    const addBtn = wrapper.findAllComponents(Button).find(b => b.text().includes('Add'));
    await addBtn?.trigger('click');
    expect(wrapper.findAllComponents(IpRow).length).toBe(2);
    expect(wrapper.findAllComponents(IpRow)[1].props('rowNumber')).toBe(2);
  });

  it('clears all rows when Reset (remove all) button is clicked', async () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    // Add a few rows
    const addBtn = wrapper.findAllComponents(Button).find(b => b.text().includes('Add'));
    await addBtn?.trigger('click');
    await addBtn?.trigger('click');
    expect(wrapper.findAllComponents(IpRow).length).toBe(3);
    
    // Modification: simulate typing in a row to verify reset clears data too
    await wrapper.findAllComponents(IpRow)[0].vm.$emit('update:modelValue', '8.8.8.8');
    
    // Click remove all (trash icon button)
    // It only appears if rows > 0, which is true
    // It has title "Remove All"
    const removeAllBtn = wrapper.findAllComponents(Button).find(b => b.attributes('title') === 'Remove All');
    await removeAllBtn?.trigger('click');
    
    expect(wrapper.findAllComponents(IpRow).length).toBe(0);
  });
});
