# IP Lookup App — Test Plan

> Derived from [IMPLEMENTATION_PLAN_VUE.md](file:///home/idan/workspaces/gemini/torq/IMPLEMENTATION_PLAN_VUE.md)

## Test Stack

| Tool | Purpose |
|---|---|
| **Vitest** | Test runner (native Vite integration, fast HMR) |
| **Vue Test Utils** | Component mounting, DOM queries, event simulation |
| **jsdom** | Browser-like DOM environment for Vitest |
| **vi.fn() / vi.mock()** | Mocking fetch, timers, modules |

---

## Test Structure

```
tests/
├── utils/
│   └── validateIp.spec.ts          # Pure functions — no mocking
├── services/
│   └── ipApi.spec.ts               # Mock global fetch
├── composables/
│   ├── useIpLookup.spec.ts         # Mock ipApi service + QueryClient wrapper
│   └── useLocalClock.spec.ts       # Fake timers
├── components/
│   ├── AddButton.spec.ts           # Click event emission
│   ├── IpRow.spec.ts               # Input, blur, loading, result, error states
│   └── IpLookupCard.spec.ts        # Row management, add/remove
└── integration/
    └── ipLookupFlow.spec.ts        # Full user flow (mount App, add row, search)
```

---

## 1. Utils — `validateIp.spec.ts`

> **File under test:** [validateIp.ts](file:///home/idan/workspaces/gemini/torq/src/utils/validateIp.ts)  
> **Mocking:** None (pure function)

### `isValidIpv4(ip: string): boolean`

| # | Test Case | Input | Expected |
|---|---|---|---|
| 1 | Valid standard IP | `"8.8.8.8"` | `true` |
| 2 | Valid IP — all zeros | `"0.0.0.0"` | `true` |
| 3 | Valid IP — max octets | `"255.255.255.255"` | `true` |
| 4 | Valid IP — mixed values | `"192.168.1.100"` | `true` |
| 5 | Leading/trailing spaces | `"  8.8.8.8  "` | `true` (should be trimmed) |
| 6 | ❌ Octet > 255 | `"256.1.1.1"` | `false` |
| 7 | ❌ Too few octets | `"8.8.8"` | `false` |
| 8 | ❌ Too many octets | `"8.8.8.8.8"` | `false` |
| 9 | ❌ Non-numeric chars | `"abc.def.ghi.jkl"` | `false` |
| 10 | ❌ Empty string | `""` | `false` |
| 11 | ❌ Just dots | `"..."` | `false` |
| 12 | ❌ Negative numbers | `"-1.0.0.0"` | `false` |
| 13 | ❌ Leading zeros (ambiguous) | `"08.08.08.08"` | `false` or `true` — document decision |
| 14 | ❌ IPv6 address | `"::1"` | `false` |
| 15 | ❌ Mixed separators | `"8.8.8:8"` | `false` |

> [!TIP]
> If IPv6 support is added via a separate `isValidIpv6()`, add a parallel test table for it.

---

## 2. Services — `ipApi.spec.ts`

> **File under test:** [ipApi.ts](file:///home/idan/workspaces/gemini/torq/src/services/ipApi.ts)  
> **Mocking:** `globalThis.fetch` via `vi.fn()`

### Setup

```typescript
beforeEach(() => {
  vi.restoreAllMocks();
});
```

### `lookupIp(ip: string): Promise<IpApiResponse>`

| # | Test Case | Mock Setup | Expected Behavior |
|---|---|---|---|
| 1 | **Successful lookup** | `fetch` returns `{ status: 'success', country: 'United States', countryCode: 'US', timezone: 'America/New_York', query: '8.8.8.8' }` | Resolves with typed `IpApiResponse` |
| 2 | **Correct URL construction** | Spy on `fetch` | Called with `http://ip-api.com/json/8.8.8.8?fields=status,message,country,countryCode,timezone,query` |
| 3 | **API returns `status: 'fail'`** | `fetch` returns `{ status: 'fail', message: 'invalid query' }` | Throws `Error('invalid query')` |
| 4 | **API returns `status: 'fail'` without message** | `fetch` returns `{ status: 'fail' }` | Throws `Error('Unknown error')` |
| 5 | **HTTP error (e.g. 429 rate limit)** | `fetch` returns `Response` with `ok: false, status: 429` | Throws `Error('HTTP 429')` |
| 6 | **Network error** | `fetch` rejects with `TypeError('Failed to fetch')` | Rejects with the same error |
| 7 | **Response shape validation** | `fetch` returns a valid response | Returned object contains all expected keys: `status`, `country`, `countryCode`, `timezone`, `query` |

### Edge Cases

| # | Test Case | Details |
|---|---|---|
| 8 | **Private/reserved IP** (e.g. `192.168.1.1`) | API returns `status: 'fail'` with `message: 'private range'` — verify error is thrown |
| 9 | **Rate-limit header awareness** | If implemented: verify `X-Rl` and `X-Ttl` headers are read correctly |

---

## 3. Composables — `useIpLookup.spec.ts`

> **File under test:** [useIpLookup.ts](file:///home/idan/workspaces/gemini/torq/src/composables/useIpLookup.ts)  
> **Mocking:** `vi.mock('@/services/ipApi')` + wrap component with `QueryClient`

### Test Wrapper Setup

```typescript
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { mount } from '@vue/test-utils';

function mountWithQuery(composable: () => any) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  let result: any;
  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  });

  const wrapper = mount(TestComponent, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });

  return { wrapper, result, queryClient };
}
```

### Test Cases

| # | Test Case | Expected Behavior |
|---|---|---|
| 1 | **Initial state** | `data` is `undefined`, `isLoading` is `false`, `isError` is `false` |
| 2 | **`lookup()` triggers loading state** | After calling `lookup('8.8.8.8')`, `isLoading` becomes `true` |
| 3 | **Successful lookup populates data** | After `lookup('8.8.8.8')` resolves, `data` contains the API response |
| 4 | **Failed lookup sets error state** | When `lookupIp` rejects, `isError` is `true` and `error` is populated |
| 5 | **Caching** — same IP returns cached result | Call `lookup('8.8.8.8')` twice → `lookupIp` is called once (within `staleTime`) |
| 6 | **Different IPs are not cached together** | `lookup('8.8.8.8')` then `lookup('1.1.1.1')` → `lookupIp` is called twice |
| 7 | **`enabled: false`** — no automatic fetch on mount | `lookupIp` is not called until `lookup()` is invoked |

---

## 4. Composables — `useLocalClock.spec.ts`

> **File under test:** [useLocalClock.ts](file:///home/idan/workspaces/gemini/torq/src/composables/useLocalClock.ts)  
> **Mocking:** `vi.useFakeTimers()`

### Setup

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-02-10T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

### Test Cases

| # | Test Case | Expected Behavior |
|---|---|---|
| 1 | **Returns formatted time for given timezone** | With timezone `'America/New_York'` (UTC-5), `time.value` equals `'07:00:00'` |
| 2 | **Ticks every second** | Advance timers by 3 seconds → `time.value` updates to `'07:00:03'` |
| 3 | **Null timezone → empty string** | Pass `ref(null)` → `time.value` is `''` |
| 4 | **Timezone change restarts the clock** | Change timezone from `'America/New_York'` to `'Europe/London'` → `time.value` updates to reflect new timezone |
| 5 | **Cleanup on unmount** | Unmount the component → verify `clearInterval` was called (no dangling timers) |
| 6 | **Format is `hh:mm:ss`** | Verify output matches `/^\d{2}:\d{2}:\d{2}$/` |

> [!IMPORTANT]
> The `onUnmounted` lifecycle hook requires the composable to be called within a component context. Tests must mount a wrapper component (similar to `useIpLookup` tests).

---

## 5. Components — `AddButton.spec.ts`

> **File under test:** [AddButton.vue](file:///home/idan/workspaces/gemini/torq/src/components/AddButton.vue)  
> **Mocking:** None

| # | Test Case | Expected Behavior |
|---|---|---|
| 1 | **Renders with correct text** | Button contains `"+ Add"` |
| 2 | **Emits click event** | `wrapper.trigger('click')` → emitted array has one entry |
| 3 | **Has correct styling** | Button has the primary color background (`#4FC3F7` or CSS variable) |

---

## 6. Components — `IpRow.spec.ts`

> **File under test:** [IpRow.vue](file:///home/idan/workspaces/gemini/torq/src/components/IpRow.vue)  
> **Mocking:** `vi.mock('@/composables/useIpLookup')`, `vi.mock('@/composables/useLocalClock')`

### Setup

```typescript
// Provide QueryClient globally for all IpRow tests
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function mountIpRow(props = {}) {
  return mount(IpRow, {
    props: { rowNumber: 1, modelValue: '', ...props },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
}
```

### Test Cases

| # | Test Case | Steps | Expected |
|---|---|---|---|
| 1 | **Renders row number badge** | Mount with `rowNumber: 3` | Badge shows `"3"` |
| 2 | **Renders text input** | Mount | Input element exists and is empty |
| 3 | **Input emits `update:modelValue`** | Type `"8.8.8.8"` | Emits `update:modelValue` with `"8.8.8.8"` |
| 4 | **Blur triggers lookup** | Set input value, trigger blur | `lookup()` from `useIpLookup` is called |
| 5 | **Blur with empty input does NOT trigger lookup** | Leave input empty, trigger blur | `lookup()` is **not** called |
| 6 | **Invalid IP shows validation error** | Enter `"999.999.999.999"`, trigger blur | Error message like `"Invalid IP address"` is shown |
| 7 | **Shows spinner during loading** | Mock `isLoading: true` | Spinner element is visible |
| 8 | **Input is disabled during loading** | Mock `isLoading: true` | Input has `disabled` attribute |
| 9 | **Shows flag emoji on success** | Mock `data: { countryCode: 'US', ... }` | Flag emoji `🇺🇸` is displayed |
| 10 | **Shows country name on success** | Mock `data: { country: 'United States', ... }` | Text `"United States"` is visible |
| 11 | **Shows real-time clock on success** | Mock successful result with timezone | Clock element displays time (e.g. `12:30:45`) |
| 12 | **Shows API error message** | Mock `isError: true, error: new Error('private range')` | Error text is visible |
| 13 | **Input re-enabled after result** | Mock successful result | Input is no longer `disabled` |
| 14 | **Can re-search after editing** | After result, change input, blur | `lookup()` is called again with new IP |

### `countryCodeToFlag` Helper

| # | Test Case | Input | Expected |
|---|---|---|---|
| 15 | US code | `"US"` | `"🇺🇸"` |
| 16 | GB code | `"GB"` | `"🇬🇧"` |
| 17 | Lowercase input | `"us"` | `"🇺🇸"` (should handle case) |

---

## 7. Components — `IpLookupCard.spec.ts`

> **File under test:** [IpLookupCard.vue](file:///home/idan/workspaces/gemini/torq/src/components/IpLookupCard.vue)  
> **Mocking:** `vi.mock('@/composables/useIpLookup')`, `vi.mock('@/composables/useLocalClock')`

### Setup

Requires `QueryClient` plugin in mount globals (same as `IpRow` tests).

### Test Cases

| # | Test Case | Steps | Expected |
|---|---|---|---|
| 1 | **Renders card header** | Mount | `"IP Lookup"` text visible |
| 2 | **Renders subtitle** | Mount | Subtitle text visible |
| 3 | **Close button (✕) present** | Mount | Close button exists in DOM |
| 4 | **Starts with one empty row** | Mount | One `IpRow` component rendered |
| 5 | **"+ Add" button adds a new row** | Click the add button | Two `IpRow` components rendered |
| 6 | **Multiple adds create sequential rows** | Click add 3 times | Four `IpRow` components (1 initial + 3 added) |
| 7 | **Row numbers are sequential** | Add 2 rows | Rows numbered **1**, **2**, **3** |
| 8 | **Remove row (if implemented)** | Click remove on row 2 | Row 2 removed, remaining rows re-numbered |

---

## 8. Integration — `ipLookupFlow.spec.ts`

> **Purpose:** Verify the entire user flow works end-to-end within a test environment  
> **Mocking:** Only `globalThis.fetch` is mocked — all Vue components, composables, and services are real

### Setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function mountApp() {
  return mount(App, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  });
}
```

### Test Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | **Happy path: Lookup a valid IP** | 1. Mount App<br>2. Type `"8.8.8.8"` in input<br>3. Blur the input<br>4. Wait for query to settle | Flag emoji + country name + ticking clock visible |
| 2 | **Add multiple rows and search** | 1. Mount App<br>2. Click "+ Add" twice<br>3. Enter different IPs in each row<br>4. Blur all | Each row shows correct country independently |
| 3 | **Invalid IP flow** | 1. Mount App<br>2. Type `"not-an-ip"`<br>3. Blur | Validation error displayed, no fetch call made |
| 4 | **API failure flow** | 1. Mock fetch to return `{ status: 'fail', message: 'reserved range' }`<br>2. Type `"192.168.1.1"`, blur | Error message displayed in the row |
| 5 | **Edit and re-search** | 1. Complete a successful lookup<br>2. Change the IP<br>3. Blur | New result replaces old result |

---

## 9. Coverage Goals

| Layer | Target | Rationale |
|---|---|---|
| **Utils** | 100% | Pure functions, easy to achieve |
| **Services** | 100% | All code paths (success, fail, network error) |
| **Composables** | ≥ 90% | Core logic; some edge cases may be hard to reach |
| **Components** | ≥ 80% | Cover all user-visible states; exclude pure styling |
| **Integration** | Key flows | Not a coverage target — validates wiring |

### Vitest Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/main.ts', 'src/types/**'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## 10. Mocking Strategy Summary

| Dependency | Mocking Approach | Used In |
|---|---|---|
| `globalThis.fetch` | `vi.fn()` returning mock `Response` objects | `ipApi.spec.ts`, integration tests |
| `@/services/ipApi` | `vi.mock()` the module | `useIpLookup.spec.ts` |
| `@/composables/useIpLookup` | `vi.mock()` returning reactive refs | `IpRow.spec.ts`, `IpLookupCard.spec.ts` |
| `@/composables/useLocalClock` | `vi.mock()` returning a static `time` ref | `IpRow.spec.ts` |
| Timers (`setInterval`) | `vi.useFakeTimers()` | `useLocalClock.spec.ts` |
| `@tanstack/vue-query` | Real — wrapped with a test `QueryClient` | All composable & component tests |

---

## 11. Running Tests

```bash
# Run all tests once
npm run test -- --run

# Run in watch mode during development
npm run test

# Run with coverage report
npm run test -- --run --coverage

# Run a specific test file
npm run test -- --run tests/utils/validateIp.spec.ts

# Run tests matching a pattern
npm run test -- --run -t "validates IPv4"
```

---

## 12. Pre-Merge Checklist

- [ ] All tests pass (`npm run test -- --run`)
- [ ] Coverage thresholds met (`npm run test -- --run --coverage`)
- [ ] TypeScript compiles cleanly (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] CI pipeline green on PR
- [ ] Manual browser verification completed (see [manual checklist](#13-manual-browser-verification))

---

## 13. Manual / Browser Verification

These items require visual/interactive verification and cannot be fully automated with unit tests:

| # | Check | How to Verify |
|---|---|---|
| 1 | Page loads with one empty row | `npm run dev` → open browser |
| 2 | "+ Add" button creates new rows | Click repeatedly, rows appear |
| 3 | Valid IP resolves correctly | Enter `8.8.8.8` → blur → see 🇺🇸 + clock |
| 4 | Clock ticks in real-time | Watch seconds increment for 5+ seconds |
| 5 | Clock matches the correct timezone | Compare with [timeanddate.com](https://timeanddate.com) |
| 6 | Invalid IP shows error inline | Enter `999.999.999.999` → blur |
| 7 | Private IP shows API error gracefully | Enter `192.168.1.1` → blur |
| 8 | Loading spinner appears during lookup | Use network throttling in DevTools |
| 9 | Input disabled during loading | Try to type while spinner is showing |
| 10 | Input re-enabled after result | Edit IP after successful lookup |
| 11 | Multiple simultaneous lookups | Add 3 rows, enter IPs, blur all quickly |
| 12 | Visual match with mocks | Compare UI against assignment mockups |
| 13 | Responsive on different screen sizes | Resize browser / use DevTools responsive mode |
