import { test, expect, type Page } from '@playwright/test';
import { mockIpApi } from './helpers';

// Helper: generate a valid-looking IP
function fakeIp(index: number): string {
  const a = 1 + (index % 254);
  const b = 1 + (Math.floor(index / 254) % 254);
  return `${a}.${b}.1.1`;
}

// Helper: add N rows, fill them all, blur them all
async function addAndLookup(page: Page, count: number) {
  // Add rows (first row already exists)
  for (let i = 1; i < count; i++) {
    await page.locator('.add-btn').click();
  }

  // Verify rows were created
  await expect(page.locator('.ip-row')).toHaveCount(count, { timeout: 10000 });

  // Fill all inputs
  const inputs = page.locator('input');
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill(fakeIp(i));
  }

  // Blur all inputs to trigger lookups
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).blur();
  }
}

// Catch uncaught page errors
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  // Attach errors array to page for later assertion
  (page as any).__pageErrors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = (page as any).__pageErrors as string[];
  expect(errors, 'Page should have no uncaught errors').toEqual([]);
});

test.describe('Stress Tests @stress', { tag: '@stress' }, () => {
  test('10 rows concurrent lookups', async ({ page }) => {
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');

    await addAndLookup(page, 10);

    await expect(page.locator('.result')).toHaveCount(10, { timeout: 15000 });
    await expect(page.locator('.flag')).toHaveCount(10);
  });

  test('50 rows concurrent lookups', async ({ page }) => {
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');

    await addAndLookup(page, 50);

    await expect(page.locator('.result')).toHaveCount(50, { timeout: 30000 });
    await expect(page.locator('.flag')).toHaveCount(50);
  });

  test('100 rows concurrent lookups', async ({ page }) => {
    test.setTimeout(60000);
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');

    await addAndLookup(page, 100);

    await expect(page.locator('.result')).toHaveCount(100, { timeout: 45000 });
    await expect(page.locator('.flag')).toHaveCount(100);

    // Page should remain scrollable and interactive
    await page.locator('.add-btn').click();
    await expect(page.locator('.ip-row')).toHaveCount(101);
  });

  test('rapid add/lookup cycle — 20 rows', async ({ page }) => {
    await mockIpApi(page, { delay: 30 });
    await page.goto('/');

    // Rapidly add rows and fill them without waiting for results
    for (let i = 0; i < 19; i++) {
      await page.locator('.add-btn').click();
    }

    const inputs = page.locator('input');
    for (let i = 0; i < 20; i++) {
      await inputs.nth(i).fill(fakeIp(i));
      await inputs.nth(i).blur();
    }

    // All should eventually resolve
    await expect(page.locator('.result')).toHaveCount(20, { timeout: 20000 });
  });

  test('type in another row while one is loading', async ({ page }) => {
    await mockIpApi(page, { delay: 300 });
    await page.goto('/');

    // Add a second row
    await page.locator('.add-btn').click();

    const inputs = page.locator('input');

    // Start lookup in row 1
    await inputs.nth(0).fill('8.8.8.8');
    await inputs.nth(0).blur();

    // Immediately type in row 2
    await inputs.nth(1).fill('1.1.1.1');
    await inputs.nth(1).blur();

    // Both should resolve independently
    await expect(page.locator('.result')).toHaveCount(2, { timeout: 10000 });
  });

  test('repeated clear and refill cycles', async ({ page }) => {
    test.setTimeout(60000);
    await mockIpApi(page, { delay: 30 });
    await page.goto('/');

    for (let cycle = 0; cycle < 5; cycle++) {
      // Add 10 rows and lookup
      await addAndLookup(page, 10);
      await expect(page.locator('.result')).toHaveCount(10, { timeout: 15000 });

      // Clear all
      await page.locator('.close-btn').click();
      await expect(page.locator('.ip-row')).toHaveCount(1, { timeout: 5000 });
      await expect(page.locator('.result')).toHaveCount(0);
    }

    // After 5 cycles, page should still be responsive
    await page.locator('.add-btn').click();
    await expect(page.locator('.ip-row')).toHaveCount(2);
  });
});
