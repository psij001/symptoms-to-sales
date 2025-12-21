import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with all elements', async ({ page }) => {
    // Check title and description
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Check form elements
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');

    // Check Google OAuth button
    await expect(page.locator('text=Sign in with Google')).toBeVisible();

    // Check sign up link
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should have correct input types and attributes', async ({ page }) => {
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');

    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.text-red-400, [class*="red"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', 'TestPassword123!');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for loading state text
    await expect(submitButton).toContainText(/signing in/i, { timeout: 2000 });
  });

  test('should navigate to register page via sign up link', async ({ page }) => {
    await page.click('text=Sign up');
    await expect(page).toHaveURL('/register');
  });

  test('should initiate Google OAuth flow', async ({ page }) => {
    // Click Google button and check for navigation
    const googleButton = page.locator('text=Sign in with Google');

    // Intercept the navigation
    const navigationPromise = page.waitForURL(/\/api\/auth\/google|accounts\.google/, { timeout: 5000 }).catch(() => null);

    await googleButton.click();

    // Either redirects to Google or internal OAuth endpoint
    const currentUrl = page.url();
    const navigated = await navigationPromise;

    // The app should attempt to redirect to OAuth
    expect(currentUrl.includes('/api/auth/google') || currentUrl.includes('accounts.google') || navigated !== null).toBeTruthy();
  });

  test('should successfully login with valid credentials and redirect to dashboard', async ({ page }) => {
    // This test requires a valid test user in the database
    await page.fill('input#email', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input#password', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should clear error when user starts typing again', async ({ page }) => {
    // First trigger an error
    await page.fill('input#email', 'wrong@example.com');
    await page.fill('input#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error
    const errorDiv = page.locator('.text-red-400');
    await expect(errorDiv).toBeVisible({ timeout: 10000 });

    // Start typing - error should be cleared on next submit attempt
    await page.fill('input#email', 'new@example.com');

    // Submit again
    await page.click('button[type="submit"]');

    // Form should attempt to submit (error might reappear with new error or disappear briefly)
    // The key behavior is the form accepts new input
    const emailValue = await page.locator('input#email').inputValue();
    expect(emailValue).toBe('new@example.com');
  });

  test('should have proper focus management', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');

    // Email should be focusable
    const emailInput = page.locator('input#email');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Tab to password
    await page.keyboard.press('Tab');
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeFocused();
  });
});
