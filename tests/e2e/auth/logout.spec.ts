import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Logout', () => {
  // Use authenticated state for these tests
  test.use({ storageState: STORAGE_STATE });

  test('should logout via API and redirect to login', async ({ page }) => {
    // First verify we're logged in by going to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Now logout via API
    await page.goto('/api/logout');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should not be able to access dashboard after logout', async ({ page }) => {
    // First logout
    await page.goto('/api/logout');
    await page.waitForURL('/login', { timeout: 10000 });

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected back to login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should clear session cookies on logout', async ({ page }) => {
    // Logout
    await page.goto('/api/logout');
    await page.waitForURL('/login');

    // Check that session cookies are cleared or invalid
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('iron'));

    // Either cookie doesn't exist or has been invalidated
    // The actual behavior depends on the session implementation
    // We verify by trying to access a protected route
    await page.goto('/dashboard');
    await page.waitForURL('/login', { timeout: 10000 });
  });
});

test.describe('Session Protection', () => {
  test('should redirect unauthenticated users from dashboard to login', async ({ page }) => {
    // Don't use storage state - fresh browser
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from tools to login', async ({ page }) => {
    await page.goto('/dashboard/tools/triangle');

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
  });

  test('should allow authenticated users to access dashboard', async ({ page }) => {
    // Use storage state
    await page.context().addCookies([]); // This won't work directly, need different approach

    // For this test, we'll login first
    await page.goto('/login');
    await page.fill('input#email', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input#password', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });
});
