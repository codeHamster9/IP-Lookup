# Torq IP Lookup

A high-performance Vue 3 + TypeScript application for looking up IP addresses, displaying their country flags, and tracking their local time in real-time.

## Features

- **Dynamic IP Lookup**: Fetches country and timezone data from [ip-api.com](http://ip-api.com).
- **Virtual Scrolling**: Optimized rendering using `@tanstack/vue-virtual` to handle hundreds of IP rows smoothly.
- **Real-time Clock**: Displays the current local time for each IP's timezone with per-row accuracy.
- **Autofocus & Auto-scroll**: Newly added rows automatically gain focus and the list scrolls to show them.
- **Validation**: Instant IPv4 validation before making API requests.
- **Developer Experience**: Integrated `z-vue-scan` in development mode to monitor component re-renders.

## Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Data Fetching**: [@tanstack/vue-query](https://tanstack.com/query/latest) (Caching, loading states, automatic retries)
- **Virtualization**: [@tanstack/vue-virtual](https://tanstack.com/virtual/latest)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **Styling**: Vanilla CSS with modern variables and animations.
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Setup & Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Type-check**:
   ```bash
   npm run build # or npx vue-tsc --noEmit
   ```

## Testing

The project maintains a high test coverage across unit, integration, and E2E levels.

### Unit & Integration (Vitest)
```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage
```

### End-to-End (Playwright)
```bash
# Run E2E tests
npm run test:e2e

# Run stress tests (benchmarking many rows)
npm run test:stress

# Open Playwright UI
npm run test:e2e:ui
```

## Project Structure

- `src/components/`: UI components (`IpLookupCard`, `IpRow`, `LocalClock`, `Button`).
- `src/composables/`: Reusable hooks for IP fetching and clock logic.
- `src/services/`: API integration layer.
- `src/utils/`: IP validation and formatting helpers.
- `tests/`: 
  - `unit/` & `integration/`: Vitest suites mirroring the `src` structure.
  - `e2e/`: Playwright suites for full flow and stress testing.
- `src/assets/`: Global styles and static assets.
