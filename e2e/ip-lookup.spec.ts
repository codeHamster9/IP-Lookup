import { test, expect } from '@playwright/test';
import { mockIpApi, getRow, getResult, getError, clickAdd, getRowCount } from './helpers';

test.describe('Core Functional', () => {
  test.beforeEach(async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');
  });

  test('1 — Happy path lookup', async ({ page }) => {
    const input = getRow(page, 0);
    await input.fill('8.8.8.8');
    await input.blur();

    const result = getResult(page, 0);
    await expect(result).toBeVisible({ timeout: 5000 });
    await expect(result).toContainText('United States');
    // Flag emoji for US
    await expect(result).toContainText('🇺🇸');
    // Clock should be visible
    await expect(result.locator('[class*="time"]')).toBeVisible();
  });

  test('2 — Invalid IP shows error', async ({ page }) => {
    const input = getRow(page, 0);
    await input.fill('abc');
    await input.blur();

    const error = getError(page, 0);
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Invalid IPv4 address');
  });

  test('3 — Empty input ignored', async ({ page }) => {
    const input = getRow(page, 0);
    await input.focus();
    await input.blur();

    // No error, no result
    await expect(page.locator('[class*="error"]')).toHaveCount(0);
    await expect(page.locator('[class*="result"]')).toHaveCount(0);
  });

  test('4 — API failure shows error', async ({ page }) => {
    // Override with failing mock
    await page.unrouteAll();
    await mockIpApi(page, { fail: true });

    const input = getRow(page, 0);
    await input.fill('192.168.1.1');
    await input.blur();

    const error = getError(page, 0);
    await expect(error).toBeVisible({ timeout: 5000 });
    await expect(error).toHaveText('private range');
  });

  test('5 — Re-lookup different IP', async ({ page }) => {
    const input = getRow(page, 0);

    // First lookup
    await input.fill('8.8.8.8');
    await input.blur();
    await expect(getResult(page, 0)).toContainText('United States');

    // Change IP — should clear result and re-lookup on blur
    await input.fill('1.1.1.1');
    await input.blur();
    await expect(getResult(page, 0)).toContainText('Australia');
  });
});

test.describe('Multi-Row', () => {
  test.beforeEach(async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');
  });

  test('6 — Add row', async ({ page }) => {
    await expect(await getRowCount(page)).toBe(1);

    await clickAdd(page);
    await expect(await getRowCount(page)).toBe(2);

    // New row should have badge "2"
    const badges = page.locator('[class*="badge"]');
    await expect(badges.nth(1)).toHaveText('2');
  });

  test('7 — Multiple rows independent', async ({ page }) => {
    // Add 2 more rows (3 total)
    await clickAdd(page);
    await clickAdd(page);

    // Fill each with different IPs
    const row0 = getRow(page, 0);
    const row1 = getRow(page, 1);
    const row2 = getRow(page, 2);

    await row0.fill('8.8.8.8');
    await row0.blur();
    await row1.fill('1.1.1.1');
    await row1.blur();
    await row2.fill('9.9.9.9');
    await row2.blur();

    // Each row shows its own result
    await expect(getResult(page, 0)).toContainText('United States');
    await expect(getResult(page, 1)).toContainText('Australia');
    await expect(getResult(page, 2)).toContainText('United States');
  });

  test('8 — Rows survive other lookups', async ({ page }) => {
    // Lookup in row 1
    const row0 = getRow(page, 0);
    await row0.fill('8.8.8.8');
    await row0.blur();
    await expect(getResult(page, 0)).toContainText('United States');

    // Add row 2 and lookup
    await clickAdd(page);
    const row1 = getRow(page, 1);
    await row1.fill('1.1.1.1');
    await row1.blur();

    // Row 1 result preserved
    await expect(getResult(page, 0)).toContainText('United States');
    await expect(getResult(page, 1)).toContainText('Australia');
  });

  test('9 — Remove row', async ({ page }) => {
    await clickAdd(page);
    await expect(await getRowCount(page)).toBe(2);

    // Remove buttons should be visible when > 1 row
    const removeBtn = page.locator('button[aria-label="Remove row"]').first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    await expect(await getRowCount(page)).toBe(1);

    // Remove button hidden when only 1 row
    await expect(page.locator('button[aria-label="Remove row"]')).toHaveCount(0);
  });
});

test.describe('UX Polish', () => {
  test.beforeEach(async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');
  });

  test('10 — Loading spinner', async ({ page }) => {
    // Re-mock with delay
    await page.unrouteAll();
    await mockIpApi(page, { delay: 500 });

    const input = getRow(page, 0);
    await input.fill('8.8.8.8');
    await input.blur();

    // Spinner should be visible while loading
    const spinner = page.locator('[class*="spinner"]');
    await expect(spinner).toBeVisible();

    // Input should be disabled while loading
    await expect(input).toBeDisabled();

    // Eventually result appears
    await expect(getResult(page, 0)).toBeVisible({ timeout: 5000 });
    await expect(spinner).toBeHidden();
  });

  test('11 — Clock ticks', async ({ page }) => {
    const input = getRow(page, 0);
    await input.fill('8.8.8.8');
    await input.blur();

    const clock = getResult(page, 0).locator('[class*="time"]');
    await expect(clock).toBeVisible({ timeout: 5000 });

    // Read the initial time
    const time1 = await clock.textContent();

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Clock should have ticked
    const time2 = await clock.textContent();
    expect(time1).not.toBe(time2);
  });

  test('12 — Auto-focus on new row', async ({ page }) => {
    await clickAdd(page);

    // The new (2nd) input should be focused
    const row1 = getRow(page, 1);
    await expect(row1).toBeFocused();
  });
});
