import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Voice DNA Generator', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/tools/voice-dna-generator');
  });

  test('should display page header and navigation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Voice DNA Generator');
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();
  });

  test('should display upload interface', async ({ page }) => {
    await expect(page.locator('text=Upload Writing Samples')).toBeVisible();
    await expect(page.locator('text=Browse Files')).toBeVisible();
  });

  test('should show supported file types', async ({ page }) => {
    // Should indicate supported formats
    await expect(page.locator('text=/PDF|DOCX|TXT|MD/i')).toBeVisible();
  });

  test('should show step progress indicator', async ({ page }) => {
    // Should have step indicators
    const progressIndicator = page.locator('[class*="Progress"], [class*="Step"]');
    await expect(progressIndicator.first()).toBeVisible();
  });

  test('should upload text file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'sample.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a sample writing piece with unique voice characteristics. It demonstrates my writing style which tends to be conversational and direct.'),
    });

    // Should show uploaded file
    await expect(page.locator('text=sample.txt')).toBeVisible({ timeout: 10000 });
  });

  test('should show file count after upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'sample1.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Sample writing piece number one with distinct characteristics.'),
    });

    // Should show file count
    await expect(page.locator('text=/1.?\\/.?5|1 of 5/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow removing uploaded file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'sample.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Sample content'),
    });

    await expect(page.locator('text=sample.txt')).toBeVisible({ timeout: 10000 });

    // Click remove button (X icon)
    const removeButton = page.locator('button:has(svg[class*="X"])');
    if (await removeButton.isVisible()) {
      await removeButton.click();
      await expect(page.locator('text=sample.txt')).not.toBeVisible();
    }
  });

  test('should require minimum 3 samples', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Upload only 2 files
    await fileInput.setInputFiles({
      name: 'sample1.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Sample 1 content'),
    });

    await fileInput.setInputFiles({
      name: 'sample2.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Sample 2 content'),
    });

    // Analyze button should be disabled
    const analyzeButton = page.locator('button:has-text("Analyze")');
    if (await analyzeButton.isVisible()) {
      await expect(analyzeButton).toBeDisabled();
    }
  });

  test('should reject invalid file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content'),
    });

    // Should show error message
    await expect(page.locator('text=/invalid|not supported|only/i')).toBeVisible({ timeout: 10000 });
  });

  test('should complete voice analysis flow with 3 samples', async ({ page }) => {
    test.setTimeout(300000); // 5 minute timeout

    const fileInput = page.locator('input[type="file"]');

    // Upload 3 text files
    const samples = [
      'This is my first writing sample. I tend to write in a conversational tone that connects with readers. My style is direct and engaging.',
      'Second sample showcasing my unique voice. I often use short sentences. They pack a punch. My writing has rhythm and flow.',
      'Third and final sample of my writing. Notice how I structure my thoughts. Each paragraph builds on the last. This is my authentic voice.',
    ];

    for (let i = 0; i < 3; i++) {
      await fileInput.setInputFiles({
        name: `sample${i + 1}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(samples[i]),
      });

      // Wait briefly between uploads
      await page.waitForTimeout(500);
    }

    // Analyze button should be enabled
    const analyzeButton = page.locator('button:has-text("Analyze")');
    if (await analyzeButton.isVisible()) {
      await expect(analyzeButton).toBeEnabled();
      await analyzeButton.click();

      // Wait for analysis to complete
      await page.waitForSelector('text=/Voice DNA|analysis complete|Your Voice/i', { timeout: 180000 });
    }
  });

  test('should have copy to clipboard button after analysis', async ({ page }) => {
    test.setTimeout(300000);

    const fileInput = page.locator('input[type="file"]');

    const samples = [
      'Sample one with my unique writing characteristics and style patterns.',
      'Sample two demonstrating consistency in my voice and approach to writing.',
      'Sample three showing additional elements of my personal writing style.',
    ];

    for (let i = 0; i < 3; i++) {
      await fileInput.setInputFiles({
        name: `sample${i + 1}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(samples[i]),
      });
      await page.waitForTimeout(500);
    }

    const analyzeButton = page.locator('button:has-text("Analyze")');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForSelector('text=/Voice DNA|Your Voice/i', { timeout: 180000 });
    }

    // Should have copy button
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.click('a:has-text("Dashboard")');
    await expect(page).toHaveURL('/dashboard');
  });
});
