import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IpRow from '@/components/IpRow.vue';
import { ref } from 'vue';

// Mock composables
const mockLookup = vi.fn();
const mockData = ref<any>(undefined);
const mockIsLoading = ref(false);
const mockIsError = ref(false);
const mockError = ref<Error | null>(null);

vi.mock('@/composables/useIpLookup', () => ({
  useIpLookup: () => ({
    lookup: mockLookup,
    data: mockData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    error: mockError,
  }),
}));

const mockTime = ref('00:00:00');
vi.mock('@/composables/useLocalClock', () => ({
  useLocalClock: () => ({ time: mockTime }),
}));

describe('IpRow.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData.value = undefined;
    mockIsLoading.value = false;
    mockIsError.value = false;
    mockError.value = null;
    mockTime.value = '00:00:00';
  });

  it('renders input with correct initial value', () => {
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: 'Initial' },
    });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('Initial');
    expect(wrapper.find('.row-badge').text()).toBe('1');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '' },
    });
    await wrapper.find('input').setValue('8.8.8.8');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['8.8.8.8']);
  });

  it('triggers lookup on blur if valid', async () => {
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '8.8.8.8' },
    });
    await wrapper.find('input').trigger('blur');
    expect(mockLookup).toHaveBeenCalledWith('8.8.8.8');
  });

  it('does not trigger lookup if invalid', async () => {
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: 'invalid-ip' },
    });
    await wrapper.find('input').trigger('blur');
    expect(mockLookup).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Invalid IP address');
  });

  it('shows loading spinner when isLoading is true', async () => {
    mockIsLoading.value = true;
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '8.8.8.8' },
    });
    expect(wrapper.find('.spinner-icon').exists()).toBe(true);
    expect(wrapper.find('input').element.disabled).toBe(true);
  });

  it('shows result when data is present and searchedIp matches', async () => {
    mockData.value = { countryCode: 'US', timezone: 'America/New_York' };
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '8.8.8.8' },
    });
    
    // Simulate setting searchedIp via blur
    await wrapper.find('input').trigger('blur');
    
    expect(wrapper.find('.flag').exists()).toBe(true);
    expect(wrapper.find('.clock').text()).toBe('00:00:00');
  });

  it('hides result if input changes (mismatch)', async () => {
    mockData.value = { countryCode: 'US' };
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '8.8.8.8' },
    });
    
    // Set searchedIp
    await wrapper.find('input').trigger('blur');
    expect(wrapper.find('.flag').exists()).toBe(true);
    
    // Change props to simulate parent updating v-model
    await wrapper.setProps({ modelValue: '8.8.8.9' });
    
    // Result should be hidden
    expect(wrapper.find('.flag').exists()).toBe(false);
  });

  it('shows API error message', async () => {
    mockIsError.value = true;
    mockError.value = new Error('API Rate Limit');
    const wrapper = mount(IpRow, {
      props: { rowNumber: 1, modelValue: '8.8.8.8' },
    });
    
    // Set searchedIp
    await wrapper.find('input').trigger('blur');

    expect(wrapper.text()).toContain('API Rate Limit');
  });
});
