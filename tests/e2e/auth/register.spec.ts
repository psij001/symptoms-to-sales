import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form with all elements', async ({ page }) => {
    // Check title and description
    await expect(page.locator('text=Create an account')).toBeVisible();
    await expect(page.locator('text=Start creating high-converting copy')).toBeVisible();

    // Check form elements
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#lastName')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toContainText('Create Account');

    // Check Google OAuth button
    await expect(page.locator('text=Sign up with Google')).toBeVisible();

    // Check sign in link
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('should have correct input types and attributes', async ({ page }) => {
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const confirmPasswordInput = page.locator('input#confirmPassword');

    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    await expect(confirmPasswordInput).toHaveAttribute('required', '');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.fill('input#email', 'newuser@example.com');
    await page.fill('input#password', 'Password123!');
    await page.fill('input#confirmPassword', 'DifferentPassword!');
    await page.click('button[type="submit"]');

    // Wait for error message about password mismatch
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('should show error for password less than 8 characters', async ({ page }) => {
    await page.fill('input#email', 'newuser@example.com');
    await page.fill('input#password', 'short');
    await page.fill('input#confirmPassword', 'short');
    await page.click('button[type="submit"]');

    // Wait for error message about password length
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to login page via sign in link', async ({ page }) => {
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.fill('input#firstName', 'Test');
    await page.fill('input#lastName', 'User');
    await page.fill('input#email', `test-${Date.now()}@example.com`);
    await page.fill('input#password', 'TestPassword123!');
    await page.fill('input#confirmPassword', 'TestPassword123!');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for loading state text
    await expect(submitButton).toContainText(/creating account/i, { timeout: 2000 });
  });

  test('should successfully register with valid details and redirect to dashboard', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.fill('input#firstName', 'Test');
    await page.fill('input#lastName', 'User');
    await page.fill('input#email', uniqueEmail);
    await page.fill('input#password', 'TestPassword123!');
    await page.fill('input#confirmPassword', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Try to register with an existing email
    await page.fill('input#firstName', 'Test');
    await page.fill('input#lastName', 'User');
    await page.fill('input#email', 'test@example.com'); // Assuming this exists
    await page.fill('input#password', 'TestPassword123!');
    await page.fill('input#confirmPassword', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.text-red-400')).toBeVisible({ timeout: 10000 });
  });

  test('should initiate Google OAuth flow', async ({ page }) => {
    const googleButton = page.locator('text=Sign up with Google');

    const navigationPromise = page.waitForURL(/\/api\/auth\/google|accounts\.google/, { timeout: 5000 }).catch(() => null);

    await googleButton.click();

    const currentUrl = page.url();
    const navigated = await navigationPromise;

    expect(currentUrl.includes('/api/auth/google') || currentUrl.includes('accounts.google') || navigated !== null).toBeTruthy();
  });

  test('should allow optional first and last name', async ({ page }) => {
    const uniqueEmail = `test-noname-${Date.now()}@example.com`;

    // Leave first and last name empty
    await page.fill('input#email', uniqueEmail);
    await page.fill('input#password', 'TestPassword123!');
    await page.fill('input#confirmPassword', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Should not show validation error for empty names
    // Should proceed to dashboard or show API error (not form validation error)
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });
});
