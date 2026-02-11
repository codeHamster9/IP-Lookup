import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IpRow } from '../IpRow';
import { useIpLookup } from '../../../hooks/useIpLookup';

// Mock the hook and components
vi.mock('../../../hooks/useIpLookup');
vi.mock('../../LocalClock/LocalClock', () => ({
  LocalClock: ({ timezone }: { timezone: string }) => <div data-testid="local-clock">{timezone}</div>,
}));

describe('IpRow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (useIpLookup as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  const defaultProps = {
    id: '1',
    rowNumber: 1,
  };

  it('should render input and row number', () => {
    render(<IpRow {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter IP address/i)).toBeInTheDocument();
  });

  it('should handle input change', () => {
    render(<IpRow {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Enter IP address/i) as HTMLInputElement;
    
    fireEvent.change(input, { target: { value: '8.8.8.8' } });
    expect(input.value).toBe('8.8.8.8');
  });

  it('should validate IP on blur', () => {
    render(<IpRow {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Enter IP address/i);

    fireEvent.change(input, { target: { value: 'invalid-ip' } });
    fireEvent.blur(input);

    expect(screen.getByText(/Invalid IPv4 address/i)).toBeInTheDocument();
  });

  it('should clear validation error on subsequent valid input blur', () => {
    render(<IpRow {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Enter IP address/i);

    // First invalid
    fireEvent.change(input, { target: { value: 'invalid-ip' } });
    fireEvent.blur(input);
    expect(screen.getByText(/Invalid IPv4 address/i)).toBeInTheDocument();

    // Then valid
    fireEvent.change(input, { target: { value: '8.8.8.8' } });
    fireEvent.blur(input);
    expect(screen.queryByText(/Invalid IPv4 address/i)).not.toBeInTheDocument();
  });

  it('should show spinner when loading', () => {
    (useIpLookup as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<IpRow {...defaultProps} />);
    // Check for spinner class or element. In the component it's <div className={styles.spinner} />
    // Using container query or selecting by class helper would be needed since it has no text.
    // However, since we are using CSS modules, the classname is hashed.
    // But typically in tests without real CSS processing it might just be the name or consistent.
    // A better way is to check that the input is disabled, which happens on loading.
    const input = screen.getByPlaceholderText(/Enter IP address/i);
    expect(input).toBeDisabled();
  });

  it('should display error from hook', () => {
      (useIpLookup as any).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('API Error'),
      });
  
      render(<IpRow {...defaultProps} />);
      expect(screen.getByText('API Error')).toBeInTheDocument();
  });

  it('should display result data when successful', () => {
    const mockData = {
      country: 'United States',
      countryCode: 'US',
      timezone: 'America/New_York',
    };

    (useIpLookup as any).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<IpRow {...defaultProps} />);
    
    expect(screen.getByText('United States')).toBeInTheDocument();
    // Flag is derived from US -> 🇺🇸. Simple check for existence of some element
    expect(screen.getByText(/🇺🇸/)).toBeInTheDocument();
    expect(screen.getByTestId('local-clock')).toHaveTextContent('America/New_York');
  });
});
