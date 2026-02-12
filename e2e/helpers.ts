import type { Page } from '@playwright/test';

interface MockOptions {
  /** Artificial delay in ms before responding */
  delay?: number;
  /** Override IP → response mapping */
  overrides?: Record<string, { country: string; countryCode: string; timezone: string }>;
  /** Simulate a fail response for these IPs */
  failIps?: Record<string, string>;
}

const DEFAULT_RESPONSE = {
  country: 'United States',
  countryCode: 'US',
  timezone: 'America/New_York',
};

export async function mockIpApi(page: Page, options: MockOptions = {}) {
  await page.route('**/ip-api.com/**', async (route) => {
    if (options.delay) {
      await new Promise((r) => setTimeout(r, options.delay));
    }

    const url = new URL(route.request().url());
    const ip = url.pathname.split('/').pop() || '';

    // Check for fail IPs
    if (options.failIps?.[ip]) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message: options.failIps[ip],
          query: ip,
        }),
      });
      return;
    }

    const data = options.overrides?.[ip] ?? DEFAULT_RESPONSE;

    await route.fulfill({
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
