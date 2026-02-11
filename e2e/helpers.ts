import { Page } from '@playwright/test';

/** Mock response data per IP */
const MOCK_DATA: Record<string, { country: string; countryCode: string; timezone: string }> = {
  '8.8.8.8': { country: 'United States', countryCode: 'US', timezone: 'America/New_York' },
  '1.1.1.1': { country: 'Australia', countryCode: 'AU', timezone: 'Australia/Sydney' },
  '9.9.9.9': { country: 'United States', countryCode: 'US', timezone: 'America/Chicago' },
};

/**
 * Intercept all ip-api.com requests and fulfill with deterministic mock data.
 * Accepts an optional delay to simulate network latency.
 */
export async function mockIpApi(page: Page, options?: { delay?: number; fail?: boolean }) {
  await page.route('**/ip-api.com/**', async (route) => {
    if (options?.delay) {
      await new Promise((r) => setTimeout(r, options.delay));
    }

    const url = new URL(route.request().url());
    const ip = url.pathname.split('/').pop() ?? '';

    if (options?.fail) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message: 'private range',
          query: ip,
        }),
      });
    }

    const data = MOCK_DATA[ip] ?? {
      country: 'Unknown',
      countryCode: 'XX',
      timezone: 'UTC',
    };

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        ...data,
        query: ip,
      }),
    });
  });
}

/** Get the nth IP row (0-indexed) */
export function getRow(page: Page, index: number) {
  return page.locator('input[placeholder*="Enter IP"]').nth(index);
}

/** Get the result container for the nth row */
export function getResult(page: Page, index: number) {
  // Each row is a virtual item, result div is inside the row
  return page.locator('[class*="result"]').nth(index);
}

/** Get error text for the nth row */
export function getError(page: Page, index: number) {
  return page.locator('[class*="error"]').nth(index);
}

/** Click the "+ Add" button */
export async function clickAdd(page: Page) {
  await page.getByRole('button', { name: '+ Add' }).click();
}

/** Get the count of visible input rows  */
export async function getRowCount(page: Page) {
  return page.locator('input[placeholder*="Enter IP"]').count();
}
