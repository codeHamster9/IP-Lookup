import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import IpLookupCard from '@/components/IpLookupCard.vue';
import AddButton from '@/components/AddButton.vue';
import IpRow from '@/components/IpRow.vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';

function createMountOptions() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
    },
  };
}

describe('IpLookupCard.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    expect(wrapper.find('h2').text()).toBe('IP Lookup');
    expect(wrapper.find('.subtitle').exists()).toBe(true);
    expect(wrapper.findComponent(AddButton).exists()).toBe(true);
  });

  it('starts with one empty row', () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    expect(wrapper.findAllComponents(IpRow).length).toBe(1);
    expect(wrapper.findComponent(IpRow).props('rowNumber')).toBe(1);
  });

  it('adds a row when AddButton is clicked', async () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    await wrapper.findComponent(AddButton).trigger('click');
    expect(wrapper.findAllComponents(IpRow).length).toBe(2);
    expect(wrapper.findAllComponents(IpRow)[1].props('rowNumber')).toBe(2);
  });

  it('clears all rows when Reset (close) button is clicked', async () => {
    const wrapper = mount(IpLookupCard, createMountOptions());
    // Add a few rows
    await wrapper.findComponent(AddButton).trigger('click');
    await wrapper.findComponent(AddButton).trigger('click');
    expect(wrapper.findAllComponents(IpRow).length).toBe(3);
    
    // Modification: simulate typing in a row to verify reset clears data too
    await wrapper.findAllComponents(IpRow)[0].vm.$emit('update:modelValue', '8.8.8.8');
    
    // Click reset
    await wrapper.find('.close-btn').trigger('click');
    
    expect(wrapper.findAllComponents(IpRow).length).toBe(1);
    expect(wrapper.findComponent(IpRow).props('modelValue')).toBe('');
  });
});
