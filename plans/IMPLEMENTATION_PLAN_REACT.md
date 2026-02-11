# Torq.io Frontend Home Assignment — Implementation Plan

## Assignment Summary

Build a web application that **translates IP addresses into countries**. Users can add multiple rows, enter IPs, and see the resolved country (with flag) and a **real-time local clock** for each result.

### Mock Reference

````carousel
![Phase 1 — Initial state with empty row](/home/idan/.gemini/antigravity/brain/7164e64c-2153-4ee8-bff7-30555cd0d000/mock_phase1.png)
<!-- slide -->
![Phase 2a — Text input focused](/home/idan/.gemini/antigravity/brain/7164e64c-2153-4ee8-bff7-30555cd0d000/mock_phase2a.png)
<!-- slide -->
![Phase 2b — Loading spinner while searching](/home/idan/.gemini/antigravity/brain/7164e64c-2153-4ee8-bff7-30555cd0d000/mock_phase2b.png)
<!-- slide -->
![Phase 3 — Result with country flag and real-time clock](/home/idan/.gemini/antigravity/brain/7164e64c-2153-4ee8-bff7-30555cd0d000/mock_phase3.png)
````

---

## Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **React 18** (functional components + hooks) | Industry-standard, excellent ecosystem |
| Language | **TypeScript** | Explicitly preferred by Torq |
| Build tool | **Vite** | Fastest DX, first-class React/TS support |
| Global Clock | **Zustand** | Single shared clock tick — one `setInterval` for the whole app |
| Data Fetching | **TanStack Query (React Query)** | Server-state management, caching, deduplication |
| Virtualization | **TanStack Virtual** (`@tanstack/react-virtual`) | Renders only visible rows — handles thousands of rows without DOM bloat |
| Styling | **CSS Modules** (`.module.css`) | Scoped styles, zero runtime, no extra deps |
| API | **ip-api.com** (`http://ip-api.com/json/{ip}`) | Free, no API key, returns `country`, `countryCode`, `timezone` |
| Testing | **Vitest + React Testing Library** | Native Vite integration, idiomatic React testing |
| CI/CD | **GitHub Actions** | Standard, free for public repos |

---

## User Review Required

> [!WARNING]
> **ip-api.com uses HTTP only** (no HTTPS on the free tier). This is fine for a home assignment but would not be acceptable in production. The app will need to be served over HTTP during dev, or we can use a CORS proxy / the batch endpoint. We'll handle this with a simple service wrapper around `fetch`.

> [!NOTE]
> **Rate limit**: ip-api.com allows 45 requests/minute. For the scope of this assignment that's more than enough. We'll still implement rate-limit awareness by reading the `X-Rl` / `X-Ttl` headers.

---

## Architecture Overview

```mermaid
graph TD
    A["App.tsx"] --> B["IpLookupCard.tsx"]
    B --> C["IpRow.tsx"]
    B --> D["AddButton.tsx"]
    C --> E["useIpLookup (React Query)"]
    C --> F["useLocalTime hook"]
    F --> I["useClockStore (Zustand)"]
    E --> G["ipApi service"]
    C --> H["IP Validation utils"]

    style A fill:#2d2d2d,stroke:#61dafb,color:#fff
    style B fill:#2d2d2d,stroke:#61dafb,color:#fff
    style C fill:#2d2d2d,stroke:#4caf50,color:#fff
    style D fill:#2d2d2d,stroke:#4caf50,color:#fff
    style E fill:#2d2d2d,stroke:#ff9800,color:#fff
    style F fill:#2d2d2d,stroke:#ff9800,color:#fff
    style I fill:#2d2d2d,stroke:#9c27b0,color:#fff
    style G fill:#2d2d2d,stroke:#e91e63,color:#fff
    style H fill:#2d2d2d,stroke:#e91e63,color:#fff
```

### Component Hierarchy

| Component | Responsibility |
|---|---|
| `App.tsx` | Root — mounts the card, provides global layout |
| `IpLookupCard.tsx` | Card container with header, subtitle, "+ Add" button, and **virtualized** list of rows |
| `IpRow.tsx` | Single row: row number badge, text input, spinner/flag/error indicator, real-time clock |
| `AddButton.tsx` | Simple styled "+ Add" button |

### Global Clock Store (Zustand)

| Store | Responsibility |
|---|---|
| `useClockStore` | Holds a single `now` timestamp that ticks every second via one shared `setInterval`. All rows subscribe to this store instead of each running its own timer. |

### Custom Hooks

| Hook | Responsibility |
|---|---|
| `useIpLookup` | Wraps `useQuery` to fetch IP data. Handles caching and row-specific lookup status. |
| `useLocalTime` | Reads `now` from `useClockStore` and formats it to `hh:mm:ss` for a given IANA timezone. Pure derivation, no timer. |

### Services & Utils

| File | Responsibility |
|---|---|
| `services/ipApi.ts` | Thin wrapper around `fetch('http://ip-api.com/json/{ip}')` with typed response |
| `utils/validateIp.ts` | IPv4 (+ optionally IPv6) regex validation |
| `types/index.ts` | Shared TypeScript interfaces (`IpLookupResult`, `IpRowState`, etc.) |

---

## Proposed Changes

### Project Scaffolding

#### [NEW] Project root (Vite + React + TypeScript)

Scaffold with:

```bash
npx -y create-vite@latest ./ --template react-ts
```

Then install main and test deps:

```bash
npm install zustand @tanstack/react-query @tanstack/react-virtual
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Final project structure:

```
torq/
├── src/
│   ├── App.tsx
│   ├── App.module.css
│   ├── main.tsx
│   ├── components/
│   │   ├── IpLookupCard.tsx
│   │   ├── IpLookupCard.module.css
│   │   ├── IpRow.tsx
│   │   ├── IpRow.module.css
│   │   ├── AddButton.tsx
│   │   └── AddButton.module.css
│   ├── hooks/
│   │   ├── useIpLookup.ts
│   │   └── useLocalTime.ts
│   ├── store/
│   │   └── useClockStore.ts
│   ├── services/
│   │   └── ipApi.ts
│   ├── utils/
│   │   └── validateIp.ts
│   ├── types/
│   │   └── index.ts
│   └── index.css
├── tests/
│   ├── components/
│   │   ├── IpLookupCard.test.tsx
│   │   └── IpRow.test.tsx
│   ├── hooks/
│   │   ├── useIpLookup.test.ts
│   │   └── useLocalClock.test.ts
│   ├── services/
│   │   └── ipApi.test.ts
│   └── utils/
│       └── validateIp.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

### Types

#### [NEW] [index.ts](file:///home/idan/workspaces/gemini/torq/src/types/index.ts)

- `IpApiResponse` — typed shape of ip-api.com JSON response (`status`, `country`, `countryCode`, `timezone`, `query`, `message`)
- `IpRowState` — per-row state (`id`, `ip`, `loading`, `result`, `error`, `isValid`)
- `LookupStatus` — union type `'idle' | 'loading' | 'success' | 'error'`

---

### Services

#### [NEW] [ipApi.ts](file:///home/idan/workspaces/gemini/torq/src/services/ipApi.ts)

```typescript
export async function lookupIp(ip: string): Promise<IpApiResponse> {
  const res = await fetch(
    `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,timezone,query`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: IpApiResponse = await res.json();
  if (data.status === 'fail') throw new Error(data.message ?? 'Unknown error');
  return data;
}
```

Key behaviors:
- Reads `X-Rl` header to warn if approaching rate limit
- Throws on HTTP errors and API-level `status: 'fail'`
- Returns strongly typed `IpApiResponse`

---

### Utils

#### [NEW] [validateIp.ts](file:///home/idan/workspaces/gemini/torq/src/utils/validateIp.ts)

```typescript
const IPV4_REGEX = /^((25[0-5]|(2[0-4]|1?\d)?\d)\.){3}(25[0-5]|(2[0-4]|1?\d)?\d)$/;

export function isValidIpv4(ip: string): boolean {
  return IPV4_REGEX.test(ip.trim());
}
```

- Validates IPv4 format (each octet 0-255)
- Optionally add IPv6 support

---

### Global Clock Store

#### [NEW] [useClockStore.ts](file:///home/idan/workspaces/gemini/torq/src/store/useClockStore.ts)

A single `setInterval` ticks every second and writes `Date.now()` to the store. Every component that subscribes (via `useLocalTime`) re-renders once per second.

```typescript
import { create } from 'zustand';

interface ClockState {
  now: number; // epoch ms
}

export const useClockStore = create<ClockState>(() => ({
  now: Date.now(),
}));

// Start the global tick — called once at app init (e.g. in main.tsx)
export function startClock() {
  setInterval(() => {
    useClockStore.setState({ now: Date.now() });
  }, 1000);
}
```

### Custom Hooks

#### [NEW] [useIpLookup.ts](file:///home/idan/workspaces/gemini/torq/src/hooks/useIpLookup.ts)

Custom hook that wraps `useQuery` for IP lookups:

```typescript
import { useQuery } from '@tanstack/react-query';
import { lookupIp } from '../services/ipApi';

export function useIpLookup(ip: string, enabled: boolean) {
  return useQuery({
    queryKey: ['ipLookup', ip],
    queryFn: () => lookupIp(ip),
    enabled: enabled && !!ip,
    retry: false,
    staleTime: Infinity, // IP locations don't change often
  });
}
```

#### [NEW] [useLocalTime.ts](file:///home/idan/workspaces/gemini/torq/src/hooks/useLocalTime.ts)

Derives the formatted local time from the global clock — **no timer of its own**:

```typescript
import { useMemo } from 'react';
import { useClockStore } from '../store/useClockStore';

export function useLocalTime(timezone: string | null): string {
  const now = useClockStore((s) => s.now);

  return useMemo(() => {
    if (!timezone) return '';
    return new Date(now).toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [now, timezone]);
}
```

---

### Components

#### [NEW] [App.tsx](file:///home/idan/workspaces/gemini/torq/src/App.tsx)

- Minimal root: centers the `IpLookupCard` on screen
- Sets global font (Inter from Google Fonts) and a subtle background

#### [NEW] [IpLookupCard.tsx](file:///home/idan/workspaces/gemini/torq/src/components/IpLookupCard.tsx)

**Template structure:**
```
┌──────────────────────────────────┐
│  IP Lookup                    ✕  │  ← header
├──────────────────────────────────┤
│  Enter one or more IP addresses  │  ← subtitle
│  and get their country           │
│                                  │
│  [+ Add]                         │  ← AddButton
│ ─────────────────────────────── │  ← divider
│  ① [___________] 🔄              │  ← IpRow (repeated)
│  ② [___________] 🇺🇸 14:25:03    │
│  ③ [___________] ❌ Invalid IP   │
└──────────────────────────────────┘
```

**State management:**
- `rows` managed via local `useState<IpRowState[]>`
- `addRow()` / `removeRow(id)` are local handler functions

**Virtualization:**
- Uses `useVirtualizer` from `@tanstack/react-virtual` to render only visible rows
- The row list container has a fixed max-height with overflow scroll
- `estimateSize` returns the fixed row height; only rows in the viewport are mounted
- This lets the app scale to hundreds/thousands of rows without DOM performance issues

```typescript
const virtualizer = useVirtualizer({
  count: rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
});
```

**Behavior:**
- Starts with one empty row on mount
- "+ Add" appends a new row
- `main.tsx` calls `startClock()` once & wraps app in `QueryClientProvider`

**Auto-focus & auto-scroll on add:**
- `addRow()` sets a `focusRowId` state to the newly created row's id
- After state update, calls `virtualizer.scrollToIndex(rows.length - 1)` to scroll the new row into view
- `IpRow` receives an `autoFocus` prop; when `true`, its input is focused on mount via a `ref` callback (`el?.focus()`)
- `focusRowId` is cleared after the row mounts to avoid re-focusing on re-renders

#### [NEW] [IpRow.tsx](file:///home/idan/workspaces/gemini/torq/src/components/IpRow.tsx)

**Props:** `rowNumber`, `ip`, `onIpChange`, `onLookup`

**Behavior per phase:**

| Phase | Behavior |
|---|---|
| **Phase 1** | Row number badge + text input. On `onBlur` → trigger lookup |
| **Phase 2** | Disable input while loading. Show **spinner** during search. Validate IP client-side before calling API. Show **validation error** inline if invalid. |
| **Phase 3** | After result: re-enable input, show **country flag** (emoji from `countryCode`) + **real-time clock** (`hh:mm:ss`). User can edit and re-search. |

**Country flag:** Convert `countryCode` (e.g. `"US"`) to flag emoji using regional indicator symbols:

```typescript
function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0)))
    .join('');
}
```

#### [NEW] [AddButton.tsx](file:///home/idan/workspaces/gemini/torq/src/components/AddButton.tsx)

- Simple `<button>` with a "+ Add" label
- Light blue background matching the mock (`#4FC3F7` / similar)
- Receives `onClick` prop

---

### Styling

#### [NEW] [index.css](file:///home/idan/workspaces/gemini/torq/src/index.css)

Design tokens inspired by the mocks:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#4FC3F7` | Add button background |
| `--color-text` | `#333` | Main text |
| `--color-text-secondary` | `#888` | Subtitle, hints |
| `--color-border` | `#e0e0e0` | Card border, input border |
| `--color-bg` | `#f5f5f5` | Page background |
| `--color-card` | `#ffffff` | Card surface |
| `--radius-card` | `12px` | Card border radius |
| `--radius-input` | `4px` | Input border radius |
| `--font-family` | `'Inter', sans-serif` | Global font |

Key UI details from the mocks:
- Card has a subtle **rounded border** and **drop shadow**
- Row numbers use a **circular gray badge**
- Input field has a **blue outline on focus**
- Loading spinner is a small **dotted circle animation**
- Error messages displayed in **red text** below the input
- Close button (✕) is top-right of the card

---

### Testing (Bonus)

#### [NEW] Test files

| Test file | What it covers |
|---|---|
| `validateIp.test.ts` | Valid IPs, invalid IPs, edge cases (empty, spaces, IPv6) |
| `ipApi.test.ts` | Mock `fetch` — success, fail response, network error |
| `useIpLookup.test.ts` | Loading state transitions, error handling (via `renderHook`) |
| `useLocalClock.test.ts` | Clock ticks, timezone changes, cleanup (via `renderHook`) |
| `IpRow.test.tsx` | Renders input, blur triggers lookup, shows spinner, shows result |
| `IpLookupCard.test.tsx` | Add button adds rows, initial row present |

---

### CI/CD (Bonus)

#### [NEW] [ci.yml](file:///home/idan/workspaces/gemini/torq/.github/workflows/ci.yml)

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --run
      - run: npm run build
```

---

## Implementation Order

```mermaid
graph LR
    S["1. Scaffold project"] --> T["2. Types & Utils"]
    T --> SVC["3. API Service"]
    SVC --> ST["4. Zustand Store"]
    ST --> HK["5. React Query Hooks"]
    HK --> UI["6. Components & Styling"]
    UI --> TST["7. Unit Tests"]
    TST --> CI["8. CI/CD"]
    CI --> POL["9. Polish & README"]

    style S fill:#1a1a2e,stroke:#61dafb,color:#fff
    style T fill:#1a1a2e,stroke:#61dafb,color:#fff
    style SVC fill:#1a1a2e,stroke:#4caf50,color:#fff
    style ST fill:#1a1a2e,stroke:#9c27b0,color:#fff
    style HK fill:#1a1a2e,stroke:#4caf50,color:#fff
    style UI fill:#1a1a2e,stroke:#ff9800,color:#fff
    style TST fill:#1a1a2e,stroke:#e91e63,color:#fff
    style CI fill:#1a1a2e,stroke:#e91e63,color:#fff
    style POL fill:#1a1a2e,stroke:#9c27b0,color:#fff
```

| Step | Details | Est. effort |
|---|---|---|
| **1. Scaffold** | `create-vite` + install deps (zustand, react-query) | 5 min |
| **2. Types & Utils** | TypeScript interfaces + IP validation | 10 min |
| **3. API Service** | `ipApi.ts` with fetch wrapper | 10 min |
| **4. Clock Store** | `useClockStore.ts` — global tick + `startClock()` | 5 min |
| **5. Hooks** | `useIpLookup` (React Query) + `useLocalTime` | 15 min |
| **6. Components** | `App`, `IpLookupCard`, `IpRow`, `AddButton` | 30 min |
| **7. Tests** | Unit & Hook tests | 20 min |
| **8. CI/CD** | GitHub Actions workflow | 5 min |
| **9. Polish** | QA, README | 10 min |

---

## Verification Plan

### Automated Tests

```bash
npm run test -- --run       # All Vitest unit tests
npm run build               # TypeScript compilation check
```

### Manual / Browser Verification

1. Run `npm run dev` and open in browser
2. Verify "+ Add" creates new rows
3. Enter a valid IP (e.g. `8.8.8.8`) → blur → see spinner → see 🇺🇸 United States + ticking clock
4. Enter an invalid IP (e.g. `999.999.999.999`) → blur → see validation error
5. Enter a private IP (e.g. `192.168.1.1`) → blur → see API error handled gracefully
6. Add multiple rows and search simultaneously
7. Edit a resolved IP and re-search
8. Verify the clock ticks in real-time and respects the timezone
9. Visual comparison against the provided mocks
