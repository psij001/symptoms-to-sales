import { test as base, Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Default test user credentials
export const testUser: TestUser = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

// Path where authenticated session is stored
export const STORAGE_STATE = 'playwright/.auth/user.json';

// Extended test fixture with authenticated page
export const authenticatedTest = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Use storage state if available
    await use(page);
  },
});

// Helper to perform login via UI
export async function loginViaUI(page: Page, email?: string, password?: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="email"], input[id="email"], input[name="email"]', email || testUser.email);
  await page.fill('input[type="password"], input[id="password"], input[name="password"]', password || testUser.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

// Helper to check if user is logged in
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/auth/user');
    return response.ok();
  } catch {
    return false;
  }
}

// Helper to logout
export async function logout(page: Page): Promise<void> {
  await page.goto('/api/logout');
  await page.waitForURL('/login');
}

// Export test for API tests that don't need auth
export { test } from '@playwright/test';
export { expect } from '@playwright/test';
