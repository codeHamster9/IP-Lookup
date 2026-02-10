import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import AddButton from '@/components/AddButton.vue';

describe('AddButton.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(AddButton);
    expect(wrapper.text()).toContain('+ Add');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('emits click event', async () => {
    const wrapper = mount(AddButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted()).toHaveProperty('click');
  });
});
