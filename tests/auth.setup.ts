import { test as setup, expect } from '@playwright/test';
import { testUser, STORAGE_STATE } from './fixtures/auth.fixture';

/**
 * This setup file runs before all tests to authenticate once
 * and save the session state for reuse across tests.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  const emailInput = page.locator('input[type="email"], input[id="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[id="password"], input[name="password"]');

  await emailInput.fill(testUser.email);
  await passwordInput.fill(testUser.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for successful navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Verify we're authenticated by checking for dashboard content
  await expect(page.locator('body')).toContainText(/Good (morning|afternoon|evening)|Dashboard/i);

  // Save the storage state (cookies, localStorage)
  await page.context().storageState({ path: STORAGE_STATE });
});
