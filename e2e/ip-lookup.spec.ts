import { test, expect } from '@playwright/test';
import { mockIpApi } from './helpers';

test.describe('Core Functional', () => {
  test('happy path lookup shows flag and clock', async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');

    const input = page.locator('input').first();
    await input.fill('8.8.8.8');
    await input.blur();

    // Wait for the result to appear
    const result = page.locator('.result').first();
    await expect(result).toBeVisible({ timeout: 5000 });

    // Flag image should be present
    const flag = result.locator('.flag');
    await expect(flag).toBeVisible();
    await expect(flag).toHaveAttribute('src', /flagcdn\.com/);

    // Clock should show a time
    const clock = result.locator('.clock');
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(/\d{2}:\d{2}:\d{2}/);
  });

  test('invalid IP shows error without API call', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/ip-api.com/**', () => {
      apiCalled = true;
    });

    await page.goto('/');

    const input = page.locator('input').first();
    await input.fill('abc');
    await input.blur();

    await expect(page.locator('.error-msg')).toContainText('Invalid IP address');
    expect(apiCalled).toBe(false);
  });

  test('empty input is ignored on blur', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/ip-api.com/**', () => {
      apiCalled = true;
    });

    await page.goto('/');

    const input = page.locator('input').first();
    await input.focus();
    await input.blur();

    // No error, no API call
    await expect(page.locator('.error-msg')).toHaveCount(0);
    expect(apiCalled).toBe(false);
  });

  test('API failure shows error message', async ({ page }) => {
    await mockIpApi(page, {
      failIps: { '192.168.1.1': 'private range' },
    });

    await page.goto('/');

    const input = page.locator('input').first();
    await input.fill('192.168.1.1');
    await input.blur();

    await expect(page.locator('.api-error')).toContainText('private range', {
      timeout: 5000,
    });
  });

  test('Clear All resets to single empty row', async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');

    // Add extra rows
    await page.locator('.add-btn').click();
    await page.locator('.add-btn').click();
    expect(await page.locator('.ip-row').count()).toBe(3);

    // Enter an IP in the first row
    const input = page.locator('input').first();
    await input.fill('8.8.8.8');
    await input.blur();
    await expect(page.locator('.result').first()).toBeVisible({ timeout: 5000 });

    // Click Clear All (✕)
    await page.locator('.close-btn').click();

    // Should be back to one empty row
    expect(await page.locator('.ip-row').count()).toBe(1);
    await expect(page.locator('input').first()).toHaveValue('');
    await expect(page.locator('.result')).toHaveCount(0);
  });

  test('re-lookup with different IP updates result', async ({ page }) => {
    await mockIpApi(page, {
      overrides: {
        '8.8.8.8': {
          country: 'United States',
          countryCode: 'US',
          timezone: 'America/New_York',
        },
        '1.1.1.1': {
          country: 'Australia',
          countryCode: 'AU',
          timezone: 'Australia/Sydney',
        },
      },
    });

    await page.goto('/');
    const input = page.locator('input').first();

    // First lookup
    await input.fill('8.8.8.8');
    await input.blur();
    await expect(page.locator('.flag').first()).toHaveAttribute(
      'src',
      /\/us\.png/
    );

    // Second lookup — different IP
    await input.fill('1.1.1.1');
    await input.blur();
    await expect(page.locator('.flag').first()).toHaveAttribute(
      'src',
      /\/au\.png/,
      { timeout: 5000 }
    );
  });
});

test.describe('Multi-Row', () => {
  test('clicking Add creates a new row', async ({ page }) => {
    await page.goto('/');

    expect(await page.locator('.ip-row').count()).toBe(1);

    await page.locator('.add-btn').click();
    expect(await page.locator('.ip-row').count()).toBe(2);

    // Badge numbers should be 1 and 2
    const badges = page.locator('.row-badge');
    await expect(badges.nth(0)).toHaveText('1');
    await expect(badges.nth(1)).toHaveText('2');
  });

  test('multiple rows resolve independently', async ({ page }) => {
    await mockIpApi(page, {
      overrides: {
        '8.8.8.8': {
          country: 'United States',
          countryCode: 'US',
          timezone: 'America/New_York',
        },
        '1.1.1.1': {
          country: 'Australia',
          countryCode: 'AU',
          timezone: 'Australia/Sydney',
        },
        '9.9.9.9': {
          country: 'Germany',
          countryCode: 'DE',
          timezone: 'Europe/Berlin',
        },
      },
    });

    await page.goto('/');

    // Add 2 more rows (total 3)
    await page.locator('.add-btn').click();
    await page.locator('.add-btn').click();

    const inputs = page.locator('input');
    const ips = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];

    for (let i = 0; i < 3; i++) {
      await inputs.nth(i).fill(ips[i]);
      await inputs.nth(i).blur();
    }

    // Wait for all 3 results
    await expect(page.locator('.result')).toHaveCount(3, { timeout: 10000 });

    // Verify each flag
    const flags = page.locator('.flag');
    await expect(flags.nth(0)).toHaveAttribute('src', /\/us\.png/);
    await expect(flags.nth(1)).toHaveAttribute('src', /\/au\.png/);
    await expect(flags.nth(2)).toHaveAttribute('src', /\/de\.png/);
  });

  test('existing row result survives adding new rows', async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');

    // Lookup in row 1
    const input = page.locator('input').first();
    await input.fill('8.8.8.8');
    await input.blur();
    await expect(page.locator('.result').first()).toBeVisible({ timeout: 5000 });

    // Add a new row
    await page.locator('.add-btn').click();

    // Row 1 result should still be visible
    await expect(page.locator('.result').first()).toBeVisible();
    await expect(page.locator('.flag').first()).toBeVisible();
  });
});

test.describe('UX Polish', () => {
  test('loading spinner appears during lookup', async ({ page }) => {
    await mockIpApi(page, { delay: 500 });
    await page.goto('/');

    const input = page.locator('input').first();
    await input.fill('8.8.8.8');
    await input.blur();

    // Spinner should appear
    await expect(page.locator('.spinner').first()).toBeVisible({ timeout: 2000 });

    // Then result should replace it
    await expect(page.locator('.result').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.spinner')).toHaveCount(0);
  });

  test('clock ticks over time', async ({ page }) => {
    await mockIpApi(page);
    await page.goto('/');

    const input = page.locator('input').first();
    await input.fill('8.8.8.8');
    await input.blur();

    const clock = page.locator('.clock').first();
    await expect(clock).toBeVisible({ timeout: 5000 });

    const time1 = await clock.textContent();

    // Wait 2 seconds for clock to tick
    await page.waitForTimeout(2000);
    const time2 = await clock.textContent();

    expect(time1).not.toBe(time2);
  });
});
