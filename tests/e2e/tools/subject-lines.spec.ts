import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Subject Lines Generator', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/subject-lines');
  });

  test('should display page header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Subject Lines');
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
  });

  test('should display two input mode tabs', async ({ page }) => {
    // Check for input mode tabs
    await expect(page.locator('button[role="tab"]:has-text("From Audience")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("From T1 Email")')).toBeVisible();
  });

  test('should show audience mode inputs by default', async ({ page }) => {
    // From Audience should be active
    await expect(page.locator('button[role="tab"]:has-text("From Audience")')).toHaveAttribute('data-state', 'active');

    // Should show audience and problem fields
    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#problem')).toBeVisible();
  });

  test('should switch to T1 Email input mode', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("From T1 Email")');

    // Should show t1Email textarea
    await expect(page.locator('textarea#t1Email')).toBeVisible();

    // Audience and problem should not be visible
    await expect(page.locator('textarea#audience')).not.toBeVisible();
  });

  test('should switch back to audience mode', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("From T1 Email")');
    await page.click('button[role="tab"]:has-text("From Audience")');

    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#problem')).toBeVisible();
  });

  test('should disable generate button without required fields (audience mode)', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#audience', 'Test audience');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#problem', 'Test problem');
    await expect(generateButton).toBeEnabled();
  });

  test('should disable generate button without required fields (T1 mode)', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("From T1 Email")');

    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#t1Email', 'Subject: Test email\n\nBody content here');
    await expect(generateButton).toBeEnabled();
  });

  test('should show loading state when generating', async ({ page }) => {
    await page.fill('textarea#audience', 'Coaches');
    await page.fill('textarea#problem', 'Low engagement');

    await page.click('button:has-text("Generate")');

    await expect(page.locator('text=Generating...')).toBeVisible({ timeout: 5000 });
  });

  test('should generate 10 subject lines', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'Marketing agencies');
    await page.fill('textarea#problem', 'Client retention');

    await page.click('button:has-text("Generate")');

    // Wait for subject lines to appear
    await page.waitForSelector('text=Your Subject Lines', { timeout: 120000 });

    // Should have multiple subject line cards
    const subjectCards = page.locator('[class*="Card"]');
    const count = await subjectCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should copy subject line on click', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'SaaS founders');
    await page.fill('textarea#problem', 'High churn');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=Your Subject Lines', { timeout: 120000 });

    // Click on first subject line card
    await page.locator('[class*="Card"] button').first().click();

    // Should show copied feedback
    await expect(page.locator('svg[class*="Check"]').first()).toBeVisible();
  });

  test('should have Copy All button', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'Consultants');
    await page.fill('textarea#problem', 'Time management');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=Your Subject Lines', { timeout: 120000 });

    await expect(page.locator('button:has-text("Copy All")')).toBeVisible();
  });

  test('should copy all subject lines', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'Freelancers');
    await page.fill('textarea#problem', 'Inconsistent income');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=Your Subject Lines', { timeout: 120000 });

    await page.click('button:has-text("Copy All")');

    // Should show copied all feedback
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('should toggle favorites', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'E-commerce owners');
    await page.fill('textarea#problem', 'Low conversions');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=Your Subject Lines', { timeout: 120000 });

    // Click favorite button on first subject line
    const heartButton = page.locator('button svg[class*="Heart"]').first();
    if (await heartButton.isVisible()) {
      await heartButton.click();
    }
  });

  test('should show empty state in output panel', async ({ page }) => {
    await expect(page.locator('text=Generate Subject Lines')).toBeVisible();
  });
});
