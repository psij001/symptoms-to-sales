import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Project Management', () => {
  test.use({ storageState: STORAGE_STATE });

  test('should show create project prompt on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=No project selected yet')).toBeVisible();
    await expect(page.locator('text=Create a project to add Voice DNA and Offer Context')).toBeVisible();
  });

  test('should open create project modal', async ({ page }) => {
    await page.goto('/dashboard');

    // Click the create project button
    await page.click('text=Create Project');

    // Modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Project')).toBeVisible();
  });

  test('should display project form fields', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Project');

    // Wait for dialog to be fully visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Check form fields
    await expect(page.locator('input[name="name"], input#name')).toBeVisible();

    // Check project type selector exists (could be select dropdown or radio buttons)
    const typeSelector = page.locator('[role="dialog"] select, [role="dialog"] [role="combobox"], [role="dialog"] [role="radiogroup"]');
    await expect(typeSelector.first()).toBeVisible();
  });

  test('should close modal on cancel or outside click', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Project');

    // Wait for modal
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Modal should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should validate required project name', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Project');

    // Wait for dialog to be fully visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Try to submit without name - button should be disabled or show validation
    const submitButton = page.locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Create")');

    // Check if button is disabled (proper form validation)
    const isDisabled = await submitButton.isDisabled();
    if (!isDisabled) {
      // If not disabled, click and verify form stays open
      await submitButton.click({ force: true });
    }

    // Should show validation error or remain on form
    // At minimum, modal should still be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=Create Project');

    // Wait for dialog to be fully visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Fill in project details
    const nameInput = page.locator('input[name="name"], input#name');
    await nameInput.fill(`Test Project ${Date.now()}`);

    // Project type should already have a default selected (Personal)
    // No need to click if it's a select dropdown - default is fine

    // Submit - use force to bypass overlay interference in Playwright
    const submitButton = page.locator('[role="dialog"] button[type="submit"], [role="dialog"] button:has-text("Create")');
    await submitButton.click({ force: true });

    // Modal should close on success
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
  });
});
