import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe("Noah's Ark Campaign", () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/noahs-ark');
  });

  test('should display page header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText("Noah's Ark");
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
  });

  test('should display campaign input form', async ({ page }) => {
    // Required fields
    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#storm')).toBeVisible();
    await expect(page.locator('textarea#ark')).toBeVisible();

    // Optional field
    await expect(page.locator('textarea#scarcity')).toBeVisible();
  });

  test('should show field labels', async ({ page }) => {
    await expect(page.locator('label:has-text("Target Audience")')).toBeVisible();
    await expect(page.locator('label:has-text("Storm")')).toBeVisible();
    await expect(page.locator('label:has-text("Ark")')).toBeVisible();
  });

  test('should disable generate button without required fields', async ({ page }) => {
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#audience', 'Test audience');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#storm', 'Test storm');
    await expect(generateButton).toBeDisabled();

    await page.fill('textarea#ark', 'Test ark');
    await expect(generateButton).toBeEnabled();
  });

  test('should enable generate with required fields', async ({ page }) => {
    await page.fill('textarea#audience', 'E-commerce store owners');
    await page.fill('textarea#storm', 'AI is disrupting traditional marketing');
    await page.fill('textarea#ark', 'My AI-powered email marketing system');

    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeEnabled();
  });

  test('should show loading state when generating', async ({ page }) => {
    await page.fill('textarea#audience', 'Coaches');
    await page.fill('textarea#storm', 'Market saturation');
    await page.fill('textarea#ark', 'Unique positioning system');

    await page.click('button:has-text("Generate")');

    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 10000 });
  });

  test('should show progress during campaign generation', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'SaaS founders');
    await page.fill('textarea#storm', 'Rising competition');
    await page.fill('textarea#ark', 'Market differentiation framework');

    await page.click('button:has-text("Generate")');

    // Should show progress
    await expect(page.locator('[class*="Progress"], text=/\\d+ of 7/i')).toBeVisible({ timeout: 30000 });
  });

  test('should generate 7-email campaign', async ({ page }) => {
    test.setTimeout(600000); // 10 minute timeout for full campaign

    await page.fill('textarea#audience', 'Marketing agencies');
    await page.fill('textarea#storm', 'Client acquisition costs rising');
    await page.fill('textarea#ark', 'Automated lead generation system');
    await page.fill('textarea#scarcity', 'Only 10 spots available this month');

    await page.click('button:has-text("Generate")');

    // Wait for all 7 emails
    await page.waitForSelector('text=/7.?of.?7|7 emails|Day 7/i', { timeout: 600000 });

    // Should have day tabs
    for (let day = 1; day <= 7; day++) {
      await expect(page.locator(`button:has-text("Day ${day}")`)).toBeVisible();
    }
  });

  test('should switch between day tabs', async ({ page }) => {
    test.setTimeout(600000);

    await page.fill('textarea#audience', 'Consultants');
    await page.fill('textarea#storm', 'Economic uncertainty');
    await page.fill('textarea#ark', 'Recession-proof business model');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=/7.?of.?7|7 emails|Day 7/i', { timeout: 600000 });

    // Click Day 3 tab
    await page.click('button:has-text("Day 3")');
    await expect(page.locator('button:has-text("Day 3")')).toHaveAttribute('data-state', 'active');

    // Click Day 7 tab
    await page.click('button:has-text("Day 7")');
    await expect(page.locator('button:has-text("Day 7")')).toHaveAttribute('data-state', 'active');
  });

  test('should have copy button for each email', async ({ page }) => {
    test.setTimeout(600000);

    await page.fill('textarea#audience', 'Freelancers');
    await page.fill('textarea#storm', 'AI replacing jobs');
    await page.fill('textarea#ark', 'AI-enhanced service model');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=/7.?of.?7|7 emails|Day 7/i', { timeout: 600000 });

    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });

  test('should show empty state in output panel', async ({ page }) => {
    await expect(page.locator('text=/create|build|generate/i')).toBeVisible();
  });

  test('should have Start New Campaign button after generation', async ({ page }) => {
    test.setTimeout(600000);

    await page.fill('textarea#audience', 'Real estate agents');
    await page.fill('textarea#storm', 'Market downturn');
    await page.fill('textarea#ark', 'Virtual tour technology');

    await page.click('button:has-text("Generate")');
    await page.waitForSelector('text=/7.?of.?7|7 emails|Day 7/i', { timeout: 600000 });

    await expect(page.locator('button:has-text("Start New")')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL('/dashboard');
  });
});
