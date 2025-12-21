import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Triangle of Insight Tool', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/triangle');
  });

  test('should display page header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Triangle of Insight');
    await expect(page.locator('text=Build powerful nurture content')).toBeVisible();

    // Back to dashboard link
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
  });

  test('should display step indicators', async ({ page }) => {
    await expect(page.locator('text=Symptom')).toBeVisible();
    await expect(page.locator('text=Wisdom')).toBeVisible();
    await expect(page.locator('text=Metaphor')).toBeVisible();
  });

  test('should display initial input form', async ({ page }) => {
    // Check form elements
    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#problem')).toBeVisible();

    // Check labels
    await expect(page.locator('label[for="audience"]')).toContainText('Target Audience');
    await expect(page.locator('label[for="problem"]')).toContainText('Biggest Problem');

    // Generate button should be visible but disabled
    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeDisabled();
  });

  test('should enable generate button when form is filled', async ({ page }) => {
    await page.fill('textarea#audience', 'Small business owners');
    await page.fill('textarea#problem', 'Struggling to get clients');

    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await expect(generateButton).toBeEnabled();
  });

  test('should show empty state in output panel initially', async ({ page }) => {
    await expect(page.locator('text=Build Your Triangle')).toBeVisible();
    await expect(page.locator('text=Enter your audience and their biggest problem')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show loading state when generating', async ({ page }) => {
    await page.fill('textarea#audience', 'Freelance designers');
    await page.fill('textarea#problem', 'Constantly undercharging');

    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await generateButton.click();

    // Should show loading state
    await expect(page.locator('text=Generating...')).toBeVisible({ timeout: 5000 });
  });

  test('should generate symptoms and display options', async ({ page }) => {
    test.slow(); // This test involves AI generation

    await page.fill('textarea#audience', 'Freelance designers who want more clients');
    await page.fill('textarea#problem', 'Constantly undercharging and overworking');

    await page.click('button:has-text("Generate Symptoms")');

    // Wait for generation to complete - symptoms should appear as selectable buttons
    await page.waitForSelector('button:has-text("Use Selected")', { timeout: 90000 });

    // Should have multiple symptom options (numbered)
    const symptomButtons = page.locator('button.w-full.text-left');
    const count = await symptomButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow symptom selection', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'Coaches struggling with pricing');
    await page.fill('textarea#problem', 'Fear of rejection');
    await page.click('button:has-text("Generate Symptoms")');

    // Wait for symptoms to appear
    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });

    // Click first symptom option
    await page.locator('button.w-full.text-left').first().click();

    // Use Selected button should be enabled
    const useSelectedButton = page.locator('button:has-text("Use Selected")');
    await expect(useSelectedButton).toBeEnabled();
  });

  test('should proceed to wisdom generation after symptom selection', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'E-commerce store owners');
    await page.fill('textarea#problem', 'Low conversion rates');
    await page.click('button:has-text("Generate Symptoms")');

    // Wait and select first symptom
    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();

    // Click Use Selected to generate wisdom
    await page.click('button:has-text("Use Selected")');

    // Should now show wisdom selection
    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });
    await expect(page.locator('text=Select Your Wisdom')).toBeVisible();
  });

  test('should show back button during wisdom selection', async ({ page }) => {
    test.slow();

    await page.fill('textarea#audience', 'SaaS founders');
    await page.fill('textarea#problem', 'High churn rates');
    await page.click('button:has-text("Generate Symptoms")');

    // Wait and select symptom
    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    // Wait for wisdom phase
    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });

    // Back button should be visible
    await expect(page.locator('button:has-text("Back")')).toBeVisible();
  });

  test('should complete full triangle flow', async ({ page }) => {
    test.setTimeout(300000); // 5 minute timeout

    await page.fill('textarea#audience', 'Marketing agencies');
    await page.fill('textarea#problem', 'Clients ghosting after proposals');
    await page.click('button:has-text("Generate Symptoms")');

    // Step 1: Select symptom
    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    // Step 2: Select wisdom
    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    // Step 3: Select metaphor
    await page.waitForSelector('text=Select Your Metaphor', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();

    // Click Complete Triangle
    await page.click('button:has-text("Complete Triangle")');

    // Verify complete result
    await expect(page.locator('text=Your Triangle of Insight')).toBeVisible();
    await expect(page.locator('text=SYMPTOM')).toBeVisible();
    await expect(page.locator('text=WISDOM')).toBeVisible();
    await expect(page.locator('text=METAPHOR')).toBeVisible();
  });

  test('should have copy and start over buttons in result', async ({ page }) => {
    test.setTimeout(300000);

    await page.fill('textarea#audience', 'Consultants');
    await page.fill('textarea#problem', 'Not enough leads');
    await page.click('button:has-text("Generate Symptoms")');

    // Complete the flow
    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Metaphor', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Complete Triangle")');

    // Check for action buttons
    await expect(page.locator('button:has-text("Copy All")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Over")')).toBeVisible();
  });

  test('should copy result to clipboard', async ({ page }) => {
    test.setTimeout(300000);

    // Complete the flow first
    await page.fill('textarea#audience', 'Freelancers');
    await page.fill('textarea#problem', 'Time management');
    await page.click('button:has-text("Generate Symptoms")');

    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Metaphor', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Complete Triangle")');

    // Click copy
    await page.click('button:has-text("Copy All")');

    // Should show "Copied!" feedback
    await expect(page.locator('text=Copied!')).toBeVisible();
  });

  test('should reset and start over', async ({ page }) => {
    test.setTimeout(300000);

    // Complete the flow
    await page.fill('textarea#audience', 'Coaches');
    await page.fill('textarea#problem', 'Low engagement');
    await page.click('button:has-text("Generate Symptoms")');

    await page.waitForSelector('button.w-full.text-left', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Wisdom', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Use Selected")');

    await page.waitForSelector('text=Select Your Metaphor', { timeout: 90000 });
    await page.locator('button.w-full.text-left').first().click();
    await page.click('button:has-text("Complete Triangle")');

    // Click Start Over
    await page.click('button:has-text("Start Over")');

    // Should be back to initial state
    await expect(page.locator('textarea#audience')).toBeVisible();
    await expect(page.locator('textarea#problem')).toBeVisible();
    await expect(page.locator('text=Build Your Triangle')).toBeVisible();
  });

  test('should show streaming content during generation', async ({ page }) => {
    await page.fill('textarea#audience', 'Real estate agents');
    await page.fill('textarea#problem', 'Market is slow');
    await page.click('button:has-text("Generate Symptoms")');

    // Should see streaming indicator
    await expect(page.locator('text=Generating...')).toBeVisible({ timeout: 10000 });

    // Streaming content area should show text appearing
    // The exact content varies, but we should see the output panel updating
    await page.waitForSelector('.prose-generated', { timeout: 30000 });
  });
});

test.describe('Triangle of Insight - Input Validation', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/triangle');
  });

  test('should not generate with empty audience', async ({ page }) => {
    await page.fill('textarea#problem', 'Some problem');

    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await expect(generateButton).toBeDisabled();
  });

  test('should not generate with empty problem', async ({ page }) => {
    await page.fill('textarea#audience', 'Some audience');

    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await expect(generateButton).toBeDisabled();
  });

  test('should not generate with whitespace-only inputs', async ({ page }) => {
    await page.fill('textarea#audience', '   ');
    await page.fill('textarea#problem', '   ');

    const generateButton = page.locator('button:has-text("Generate Symptoms")');
    await expect(generateButton).toBeDisabled();
  });
});
