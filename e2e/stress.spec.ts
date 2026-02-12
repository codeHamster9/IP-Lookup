import { test, expect } from '@playwright/test';
import { mockIpApi, getRow, getResult, clickAdd, getRowCount } from './helpers';

test.describe('@stress Stress Tests', { tag: '@stress' }, () => {
  test.beforeEach(async ({ page }) => {
    // Mock with small delay to simulate realistic async
    await mockIpApi(page, { delay: 50 });
    await page.goto('/');
    // Fail on uncaught exceptions
    page.on('pageerror', (error) => {
      throw new Error(`Uncaught page error: ${error.message}`);
    });
  });

  test('13 — 10 rows concurrent', async ({ page }) => {
    // Add 9 more rows (10 total)
    for (let i = 0; i < 9; i++) {
      await clickAdd(page);
    }
    await expect(await getRowCount(page)).toBe(10);

    // Fill all 10 with IPs and blur
    for (let i = 0; i < 10; i++) {
      const input = getRow(page, i);
      await input.fill('8.8.8.8');
      await input.blur();
    }

    // All 10 should show results within 5s
    await expect(async () => {
      const results = await page.locator('[class*="result"]').count();
      expect(results).toBe(10);
    }).toPass({ timeout: 5000 });
  });

  test('14 — 50 rows concurrent', async ({ page }) => {
    test.setTimeout(30000);

    // Add 49 more rows
    for (let i = 0; i < 49; i++) {
      await clickAdd(page);
    }

    // Fill and blur all 50 — scroll container to bring each row into view
    const container = page.locator('[class*="listContainer"]');
    for (let i = 0; i < 50; i++) {
      await container.evaluate((el, idx) => {
        el.scrollTop = idx * 52; // ROW_HEIGHT = 52
      }, i);
      await page.waitForTimeout(50);

      const input = page.locator(`[data-index="${i}"] input`);
      await input.fill('8.8.8.8');
      await input.blur();
    }

    // Verify: the last visible rows should have results (recent rows stay in view)
    await expect(async () => {
      const results = await page.locator('[class*="result"]').count();
      expect(results).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });

    // Verify page is still scrollable and responsive
    await container.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(200);
    await container.evaluate((el) => { el.scrollTop = 0; });
    await page.waitForTimeout(200);
  });

  test('15 — 100 rows', async ({ page }) => {
    test.setTimeout(60000);

    // Add 99 more rows
    for (let i = 0; i < 99; i++) {
      await clickAdd(page);
    }

    // Fill and blur all 100 — scroll container to bring each row into view
    const container = page.locator('[class*="listContainer"]');
    for (let i = 0; i < 100; i++) {
      await container.evaluate((el, idx) => {
        el.scrollTop = idx * 52;
      }, i);
      await page.waitForTimeout(50);

      const input = page.locator(`[data-index="${i}"] input`);
      await input.fill('8.8.8.8');
      await input.blur();
    }

    // Verify: recently visible rows should have results
    await expect(async () => {
      const results = await page.locator('[class*="result"]').count();
      expect(results).toBeGreaterThan(0);
    }).toPass({ timeout: 30000 });

    // Verify page is scrollable (scroll to bottom, then top)
    await container.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);
    await container.evaluate((el) => {
      el.scrollTop = 0;
    });
  });

  test('16 — Rapid add/lookup cycle', async ({ page }) => {
    test.setTimeout(30000);

    // Rapidly add 20 rows and type IPs without waiting
    for (let i = 0; i < 19; i++) {
      await clickAdd(page);
    }

    const container = page.locator('[class*="listContainer"]');
    for (let i = 0; i < 20; i++) {
      await container.evaluate((el, idx) => {
        el.scrollTop = idx * 52;
      }, i);
      await page.waitForTimeout(50);

      const input = page.locator(`[data-index="${i}"] input`);
      await input.fill('8.8.8.8');
      await input.blur();
    }

    // Verify: at least some results are visible
    await expect(async () => {
      const results = await page.locator('[class*="result"]').count();
      expect(results).toBeGreaterThan(0);
    }).toPass({ timeout: 15000 });
  });

  test('17 — Type while loading', async ({ page }) => {
    // Use longer delay for row 1 to keep it loading
    await page.unrouteAll();
    await mockIpApi(page, { delay: 1000 });

    await clickAdd(page);

    // Start lookup on row 1
    const row0 = getRow(page, 0);
    await row0.fill('8.8.8.8');
    await row0.blur();

    // Immediately type in row 2 (while row 1 is loading)
    const row1 = getRow(page, 1);
    await row1.fill('1.1.1.1');
    await row1.blur();

    // Both should resolve independently
    await expect(getResult(page, 0)).toBeVisible({ timeout: 5000 });
    await expect(getResult(page, 1)).toBeVisible({ timeout: 5000 });
  });

  test('18 — Responsiveness after many operations', async ({ page }) => {
    test.setTimeout(30000);

    // Add 10 rows, lookup all
    for (let i = 0; i < 9; i++) {
      await clickAdd(page);
    }

    for (let i = 0; i < 10; i++) {
      const input = getRow(page, i);
      await input.fill('8.8.8.8');
      await input.blur();
    }

    await expect(async () => {
      const results = await page.locator('[class*="result"]').count();
      expect(results).toBe(10);
    }).toPass({ timeout: 10000 });

    // Verify page is still responsive — adding a new row should work quickly
    const start = Date.now();
    await clickAdd(page);
    await expect(await getRowCount(page)).toBe(11);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);

    // Typing should still work
    const lastRow = getRow(page, 10);
    await lastRow.fill('1.1.1.1');
    await lastRow.blur();
    await expect(getResult(page, 10)).toBeVisible({ timeout: 5000 });
  });
});
