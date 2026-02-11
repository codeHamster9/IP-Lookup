import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IpLookupCard } from '../IpLookupCard';

// Mock IpRow since it has its own logic and data fetching
vi.mock('../../IpRow/IpRow', () => ({
  IpRow: ({ id, rowNumber, onRemove }: { id: string; rowNumber: number; onRemove?: (id: string) => void }) => (
    <div data-testid="ip-row">
      <span>Row {rowNumber}</span>
      {onRemove && (
        <button onClick={() => onRemove(id)} aria-label="Remove row">
          Remove
        </button>
      )}
    </div>
  ),
}));

// Mock @tanstack/react-virtual
// We can use a simplified mock that just renders all items, or a partial mock.
// The library `useVirtualizer` returns an object with `getVirtualItems`, `getTotalSize`, `scrollToIndex`.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () => {
      // Return a fake list of items matching the count
      return Array.from({ length: count }).map((_, index) => ({
        index,
        start: index * 50,
        size: 50,
        key: index,
        measureElement: () => {},
      }));
    },
    getTotalSize: () => count * 50,
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}));

describe('IpLookupCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Start with a defined random UUID to avoid hydration mismatch if we were doing SSR, 
    // but here in unit tests it's fine.
    // However, crypto.randomUUID might not be available in JSDOM environment by default depending on version.
    // Let's mock it just in case.
    if (!global.crypto) {
        Object.defineProperty(global, 'crypto', {
            value: {
                randomUUID: () => 'test-uuid-' + Math.random(),
            }
        });
    } else if (!global.crypto.randomUUID) {
       global.crypto.randomUUID = () => 'test-uuid-' + Math.random();
    }
  });

  it('should render the card with one initial row', () => {
    render(<IpLookupCard />);
    expect(screen.getByText('IP Lookup')).toBeInTheDocument();
    expect(screen.getAllByTestId('ip-row')).toHaveLength(1);
    expect(screen.getByText('Row 1')).toBeInTheDocument();
  });

  it('should add a row when pressing Add', () => {
    render(<IpLookupCard />);
    const addBtn = screen.getByText(/\+ Add/i);
    
    fireEvent.click(addBtn);

    expect(screen.getAllByTestId('ip-row')).toHaveLength(2);
    expect(screen.getByText('Row 2')).toBeInTheDocument();
  });

  it('should remove a row when clicking remove', () => {
    render(<IpLookupCard />);
    const addBtn = screen.getByText(/\+ Add/i);
    
    // Add two rows (total 3)
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    expect(screen.getAllByTestId('ip-row')).toHaveLength(3);

    // Remove the second one
    const removeBtns = screen.getAllByLabelText('Remove row');
    fireEvent.click(removeBtns[1]); // Index 1 is the second row

    expect(screen.getAllByTestId('ip-row')).toHaveLength(2);
  });

  it('should not allow removing the last row', () => {
    render(<IpLookupCard />);
    const removeBtns = screen.queryAllByLabelText('Remove row');
    expect(removeBtns).toHaveLength(0); // Should be empty for single row
  });
});
