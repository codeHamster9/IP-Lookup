# Global Clock Optimization

## Problem
Previously, each `IpRow` component instance created its own `setInterval` timer in `useLocalClock`. With multiple rows (e.g., 5 rows), this resulted in:
- 5 separate timers running simultaneously
- 5 `Date` object creations per second
- 5 `toLocaleTimeString` calls per second
- Unnecessary overhead and resource consumption

## Solution
Implemented a **global clock singleton** pattern that:
1. Maintains a single `setInterval` timer shared across all component instances
2. Updates a reactive `Date` object once per second
3. Each component watches this shared clock and formats it for their specific timezone

## Architecture

### `useGlobalClock.ts`
- **GlobalClock class**: Singleton that manages the single timer
- **Reference counting**: Automatically starts/stops the timer based on active subscribers
- **Reactive state**: Provides a `currentTime` ref that updates every second

### `useLocalClock.ts` (refactored)
- Now uses `useGlobalClock()` internally
- Watches the global `currentTime` and formats it for the specific timezone
- Maintains the same API - no changes needed in components

## Benefits
1. **Performance**: Single timer instead of N timers (where N = number of rows)
2. **Memory**: Reduced memory footprint with shared state
3. **Scalability**: Scales better with many rows
4. **Maintainability**: Cleaner separation of concerns
5. **Backward compatible**: No changes needed to `IpRow.vue` or other consumers

## Implementation Details

### Before (per-instance timer):
```typescript
// Each instance creates its own interval
intervalId = window.setInterval(tick, 1000);
```

### After (shared global timer):
```typescript
// Single global timer, all instances watch the same reactive Date
const { currentTime } = useGlobalClock();
watch(currentTime, formatTime);
```

## Testing
The dev server should continue to work without any changes. All clocks should update synchronously every second.

## Branch
`feature/global-clock-optimization`
