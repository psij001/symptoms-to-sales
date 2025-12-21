import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('T1 Email Creator', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/t1-email');
  });

  test('should display page header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('T1 Email Creator');
    await expect(page.locator('text=Generate 3 high-converting email drafts')).toBeVisible();

    // Back to dashboard link
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
  });

  test('should display email type selection', async ({ page }) => {
    await expect(page.locator('text=Select Email Type')).toBeVisible();

    // Check that multiple email types are visible
    const emailTypeButtons = page.locator('button.w-full.text-left');
    const count = await emailTypeButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show input form after selecting email type', async ({ page }) => {
    // Select first email type
    await page.locator('button.w-full.text-left').first().click();

    // Input form should appear
    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#problem')).toBeVisible();

    // Change button should be visible
    await expect(page.locator('button:has-text("Change")')).toBeVisible();
  });

  test('should allow changing email type', async ({ page }) => {
    // Select first email type
    await page.locator('button.w-full.text-left').first().click();
    await expect(page.locator('textarea#audience')).toBeVisible();

    // Click Change button
    await page.click('button:has-text("Change")');

    // Should go back to type selection
    await expect(page.locator('text=Select Email Type')).toBeVisible();
  });

  test('should show Voice DNA section (collapsed by default)', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    // Voice DNA section should be visible (collapsed)
    await expect(page.locator('text=Voice DNA')).toBeVisible();
    await expect(page.locator('text=(Optional)').first()).toBeVisible();
  });

  test('should expand Voice DNA section', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    // Click to expand Voice DNA section
    await page.locator('button:has-text("Voice DNA")').click();

    // Should show uploader instructions
    await expect(page.locator('text=Upload your Voice DNA')).toBeVisible();
  });

  test('should show Triangle of Insight section (collapsed by default)', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    // Triangle section should be visible
    await expect(page.locator('button:has-text("Triangle of Insight")')).toBeVisible();
  });

  test('should expand Triangle of Insight section', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    // Click to expand
    await page.locator('button:has-text("Triangle of Insight")').click();

    // Should show symptom, wisdom, metaphor fields
    await expect(page.locator('textarea#symptom')).toBeVisible();
    await expect(page.locator('textarea#wisdom')).toBeVisible();
    await expect(page.locator('textarea#metaphor')).toBeVisible();
  });

  test('should disable generate button without required fields', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    const generateButton = page.locator('button:has-text("Generate 3 Email Drafts")');
    await expect(generateButton).toBeDisabled();
  });

  test('should enable generate button when required fields are filled', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    await page.fill('textarea#audience', 'Small business owners');
    await page.fill('textarea#problem', 'Struggling to get clients');

    const generateButton = page.locator('button:has-text("Generate 3 Email Drafts")');
    await expect(generateButton).toBeEnabled();
  });

  test('should show empty state in output panel', async ({ page }) => {
    await expect(page.locator('text=Create T1 Emails')).toBeVisible();
    await expect(page.locator('text=Select an email type')).toBeVisible();
  });

  test('should update empty state after selecting email type', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();

    // Empty state should update
    await expect(page.locator('text=Fill in your audience and problem')).toBeVisible();
  });

  test('should show loading state when generating', async ({ page }) => {
    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Coaches');
    await page.fill('textarea#problem', 'Not enough clients');

    await page.click('button:has-text("Generate 3 Email Drafts")');

    // Should show loading state
    await expect(page.locator('text=Generating 3 Drafts...')).toBeVisible({ timeout: 5000 });
  });

  test('should generate 3 email drafts', async ({ page }) => {
    test.slow(); // This test involves AI generation

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Marketing agencies');
    await page.fill('textarea#problem', 'Low client retention');

    await page.click('button:has-text("Generate 3 Email Drafts")');

    // Wait for drafts to be generated
    await page.waitForSelector('text=Your T1 Email Drafts', { timeout: 120000 });

    // Should have 3 draft tabs
    await expect(page.locator('button[role="tab"]:has-text("Draft 1")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Draft 2")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Draft 3")')).toBeVisible();
  });

  test('should show success message after generation', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Freelancers');
    await page.fill('textarea#problem', 'Inconsistent income');

    await page.click('button:has-text("Generate 3 Email Drafts")');

    // Wait for success
    await page.waitForSelector('text=3 drafts generated', { timeout: 120000 });
    await expect(page.locator('text=3 drafts generated')).toBeVisible();
  });

  test('should switch between draft tabs', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'SaaS founders');
    await page.fill('textarea#problem', 'High churn');

    await page.click('button:has-text("Generate 3 Email Drafts")');
    await page.waitForSelector('text=Your T1 Email Drafts', { timeout: 120000 });

    // Click Draft 2 tab
    await page.click('button[role="tab"]:has-text("Draft 2")');
    await expect(page.locator('button[role="tab"]:has-text("Draft 2")')).toHaveAttribute('data-state', 'active');

    // Click Draft 3 tab
    await page.click('button[role="tab"]:has-text("Draft 3")');
    await expect(page.locator('button[role="tab"]:has-text("Draft 3")')).toHaveAttribute('data-state', 'active');
  });

  test('should display subject line and body for each draft', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Consultants');
    await page.fill('textarea#problem', 'Time management');

    await page.click('button:has-text("Generate 3 Email Drafts")');
    await page.waitForSelector('text=Your T1 Email Drafts', { timeout: 120000 });

    // Should show subject line label
    await expect(page.locator('text=Subject Line')).toBeVisible();

    // Should have copy button
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });

  test('should copy draft to clipboard', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Real estate agents');
    await page.fill('textarea#problem', 'Slow market');

    await page.click('button:has-text("Generate 3 Email Drafts")');
    await page.waitForSelector('text=Your T1 Email Drafts', { timeout: 120000 });

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Should show copied feedback
    await expect(page.locator('text=Copied!')).toBeVisible();
  });

  test('should have Start Over and Regenerate buttons after generation', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'E-commerce owners');
    await page.fill('textarea#problem', 'Low conversions');

    await page.click('button:has-text("Generate 3 Email Drafts")');
    await page.waitForSelector('text=3 drafts generated', { timeout: 120000 });

    // Check for action buttons
    await expect(page.locator('button:has-text("Start Over")')).toBeVisible();
    await expect(page.locator('button:has-text("Regenerate")')).toBeVisible();
  });

  test('should reset form when clicking Start Over', async ({ page }) => {
    test.slow();

    await page.locator('button.w-full.text-left').first().click();
    await page.fill('textarea#audience', 'Coaches');
    await page.fill('textarea#problem', 'Client acquisition');

    await page.click('button:has-text("Generate 3 Email Drafts")');
    await page.waitForSelector('text=3 drafts generated', { timeout: 120000 });

    // Click Start Over
    await page.click('button:has-text("Start Over")');

    // Should return to type selection
    await expect(page.locator('text=Select Email Type')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('T1 Email Creator - Input Validation', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/t1-email');
    // Select first email type
    await page.locator('button.w-full.text-left').first().click();
  });

  test('should not generate with empty audience', async ({ page }) => {
    await page.fill('textarea#problem', 'Some problem');

    const generateButton = page.locator('button:has-text("Generate 3 Email Drafts")');
    await expect(generateButton).toBeDisabled();
  });

  test('should not generate with empty problem', async ({ page }) => {
    await page.fill('textarea#audience', 'Some audience');

    const generateButton = page.locator('button:has-text("Generate 3 Email Drafts")');
    await expect(generateButton).toBeDisabled();
  });
});
