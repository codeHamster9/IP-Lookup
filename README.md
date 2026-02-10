# Torq IP Lookup

A Vue 3 + TypeScript application for looking up IP addresses and displaying their country and local time.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

## Testing

Run unit & integration tests:
```bash
npm test
```

## Features

- **Dynamic IP Lookup**: Fetches country and timezone data from ip-api.com.
- **Real-time Clock**: Displays the current local time for the looked-up IP's timezone.
- **Validation**: Client-side IPv4 validation before making API requests.
- **Responsive UI**: Clean interface with loading states and error handling.

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript**
- **Vite**
- **@tanstack/vue-query** for data fetching and caching
- **Vitest** & **Vue Test Utils** for testing

## Project Structure

- `src/components`: UI components (`IpLookupCard`, `IpRow`, `AddButton`)
- `src/composables`: Reusable logic (`useIpLookup`, `useLocalClock`)
- `src/services`: API integration (`ipApi.ts`)
- `src/utils`: Helper functions (`validateIp.ts`)
- `src/types`: TypeScript interfaces
- `tests/`: Unit and integration tests mirroring src structure
