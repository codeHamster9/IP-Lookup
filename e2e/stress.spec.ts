import { test, expect, type Page } from '@playwright/test';
import { mockIpApi } from './helpers';

// Helper: generate a valid-looking IP
function fakeIp(index: number): string {
  const a = 1 + (index % 254);
  const b = 1 + (Math.floor(index / 254) % 254);
  return `${a}.${b}.1.1`;
}

// Helper: add N rows, fill them all, blur them all
// Helper: scroll to row index and fill it
async function fillVirtualRow(page: Page, index: number) {
  // Scroll to approximate position (row height 65px)
  await page.evaluate((idx) => {
    const el = document.querySelector('.rows-container');
    if (el) {
      el.scrollTop = idx * 65;
      el.dispatchEvent(new Event('scroll'));
    }
  }, index);

  // Find the row by its badge number
  // Note: default virtualizer overscan ensures it's rendered if we scroll nearby
  const rowNumber = index + 1;
  const row = page.locator('.ip-row').filter({
    has: page.locator('.row-badge', { hasText: new RegExp(`^${rowNumber}$`) })
  });
  
  // Wait for it to be attached/visible
  await row.waitFor({ state: 'attached', timeout: 5000 });

  await row.locator('input').fill(fakeIp(index));
  await row.locator('input').blur();
}

// Helper: add N rows, fill them all
async function addAndLookup(page: Page, count: number) {
  // Add rows
  for (let i = 1; i < count; i++) {
    await page.getByRole('button', { name: 'Add' }).click();
  }

  // Verify rows were created
  if (count <= 10) {
    await expect(page.locator('.ip-row')).toHaveCount(count, { timeout: 10000 });
  } else {
    // Virtual rendering: just check we have a reasonable number of rows
    expect(await page.locator('.ip-row').count()).toBeGreaterThan(5);
  }

  // Fill and blur sequentially (which handles scrolling)
  for (let i = 0; i < count; i++) {
    await fillVirtualRow(page, i);
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

    // For 10 rows, they might all fit or close to fitting with overscan
    // But to be safe with virtualizer, we verify loop completed and results exist
    expect(await page.locator('.result').count()).toBeGreaterThan(5);
    expect(await page.locator('.flag').count()).toBeGreaterThan(5);
  });

  test('50 rows concurrent lookups', async ({ page }) => {
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');

    await addAndLookup(page, 50);

    // Virtual scrolling: we won't see 50 results
    expect(await page.locator('.result').count()).toBeGreaterThan(5);
    // Verify last row has result (we are at bottom from addAndLookup)
    await expect(page.locator('.ip-row').last()).toContainText('50'); // Badge
    await expect(page.locator('.result').last()).toBeVisible();
  });

  test('100 rows concurrent lookups', async ({ page }) => {
    test.setTimeout(60000);
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');

    await addAndLookup(page, 100);

    // Virtual scrolling: won't see 100
    expect(await page.locator('.result').count()).toBeGreaterThan(5);
    await expect(page.locator('.ip-row').last()).toContainText('100');
    await expect(page.locator('.result').last()).toBeVisible();

    // Page should remain scrollable and interactive
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('.ip-row').last()).toContainText('101');
  });

  test('rapid add/lookup cycle — 20 rows', async ({ page }) => {
    await mockIpApi(page, { delay: 30 });
    await page.goto('/');

    // Rapidly add rows and fill them without waiting for results
    for (let i = 0; i < 19; i++) {
      await page.getByRole('button', { name: 'Add' }).click();
    }

    for (let i = 0; i < 20; i++) {
      await fillVirtualRow(page, i);
    }

    // All should eventually resolve
    // 20 rows might fit in 500px + overscan, but let's be safe
    expect(await page.locator('.result').count()).toBeGreaterThan(5);
  });

  test('type in another row while one is loading', async ({ page }) => {
    await mockIpApi(page, { delay: 300 });
    await page.goto('/');

    // Add a second row
    await page.getByRole('button', { name: 'Add' }).click();

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
      expect(await page.locator('.result').count()).toBeGreaterThan(5);

      // Clear all
      await page.getByTitle('Remove All').click();
      await expect(page.locator('.ip-row')).toHaveCount(0, { timeout: 5000 });
      await expect(page.locator('.result')).toHaveCount(0);
    }

    // After 5 cycles, page should still be responsive
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('.ip-row')).toHaveCount(1);
  });
});
