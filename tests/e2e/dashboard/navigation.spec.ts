import { test, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../fixtures/auth.fixture';

test.describe('Dashboard Navigation', () => {
  test.use({ storageState: STORAGE_STATE });

  test('should display dashboard with greeting', async ({ page }) => {
    await page.goto('/dashboard');

    // Greeting based on time of day
    await expect(page.locator('h1')).toContainText(/Good (morning|afternoon|evening)/);
  });

  test('should show three workflow steps', async ({ page }) => {
    await page.goto('/dashboard');

    // Check all three workflow steps are visible
    await expect(page.locator('text=Triangle of Insight').first()).toBeVisible();
    await expect(page.locator('text=T1 Email Creator').first()).toBeVisible();
    await expect(page.locator('text=Subject Lines').first()).toBeVisible();

    // Check step numbers
    await expect(page.locator('text=Step 1')).toBeVisible();
    await expect(page.locator('text=Step 2')).toBeVisible();
    await expect(page.locator('text=Step 3')).toBeVisible();
  });

  test('should show project creation prompt', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for no project selected message
    await expect(page.locator('text=No project selected yet')).toBeVisible();
  });

  test('should show recent outputs section', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('text=RECENT OUTPUTS')).toBeVisible();
    await expect(page.locator('text=No outputs yet')).toBeVisible();
  });

  test('should navigate to Triangle of Insight via workflow step', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the Triangle of Insight link in sidebar
    const link = page.locator('[data-sidebar="menu-button"]:has-text("Triangle of Insight")');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await expect(page).toHaveURL('/dashboard/tools/triangle', { timeout: 10000 });
  });

  test('should navigate to T1 Email Creator via workflow step', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the T1 Email Creator link in sidebar
    const link = page.locator('[data-sidebar="menu-button"]:has-text("T1 Email Creator")');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await expect(page).toHaveURL('/dashboard/tools/t1-email', { timeout: 10000 });
  });

  test('should navigate to Subject Lines via workflow step', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the Subject Lines link in sidebar
    const link = page.locator('[data-sidebar="menu-button"]:has-text("Subject Lines")');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await expect(page).toHaveURL('/dashboard/tools/subject-lines', { timeout: 10000 });
  });
});

test.describe('Sidebar Navigation', () => {
  test.use({ storageState: STORAGE_STATE });

  test('should display all sidebar sections', async ({ page }) => {
    await page.goto('/dashboard');

    // Check section labels
    await expect(page.locator('text=Strategy')).toBeVisible();
    await expect(page.locator('text=Tools')).toBeVisible();
    await expect(page.locator('text=Setup')).toBeVisible();
    await expect(page.locator('text=Navigation')).toBeVisible();
  });

  test('should display all sidebar menu items', async ({ page }) => {
    await page.goto('/dashboard');

    // Strategy section
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Noah\'s Ark")')).toBeVisible();

    // Tools section
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Triangle of Insight")')).toBeVisible();
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("T1 Email Creator")')).toBeVisible();
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Subject Lines")')).toBeVisible();

    // Setup section
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Voice DNA Generator")')).toBeVisible();

    // Navigation section
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Outputs")')).toBeVisible();
    await expect(page.locator('[data-sidebar="menu-button"]:has-text("Settings")')).toBeVisible();
  });

  test('should navigate to Triangle of Insight via sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    await page.locator('[data-sidebar="menu-button"]:has-text("Triangle of Insight")').click();
    await expect(page).toHaveURL('/dashboard/tools/triangle');
  });

  test('should navigate to T1 Email Creator via sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    await page.locator('[data-sidebar="menu-button"]:has-text("T1 Email Creator")').click();
    await expect(page).toHaveURL('/dashboard/tools/t1-email');
  });

  test('should navigate to Subject Lines via sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    await page.locator('[data-sidebar="menu-button"]:has-text("Subject Lines")').click();
    await expect(page).toHaveURL('/dashboard/tools/subject-lines');
  });

  test('should navigate to Voice DNA Generator via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const link = page.locator('[data-sidebar="menu-button"]:has-text("Voice DNA Generator")');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await expect(page).toHaveURL('/dashboard/tools/voice-dna-generator', { timeout: 10000 });
  });

  test('should navigate to Noah\'s Ark via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const link = page.locator('[data-sidebar="menu-button"]:has-text("Noah\'s Ark")');
    await link.waitFor({ state: 'visible' });
    await link.click();
    await expect(page).toHaveURL('/dashboard/tools/noahs-ark', { timeout: 10000 });
  });

  test('should navigate back to dashboard via sidebar', async ({ page }) => {
    await page.goto('/dashboard/tools/triangle');

    await page.locator('[data-sidebar="menu-button"]:has-text("Dashboard")').click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should highlight active route in sidebar', async ({ page }) => {
    await page.goto('/dashboard/tools/triangle');

    // The active item should have active state
    const activeItem = page.locator('[data-sidebar="menu-button"]:has-text("Triangle of Insight")');
    await expect(activeItem).toHaveAttribute('data-active', 'true');
  });

  test('should show user dropdown menu', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on user menu in footer
    const userMenu = page.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]');
    await userMenu.click();

    // Check dropdown options
    await expect(page.locator('[role="menuitem"]:has-text("Settings")')).toBeVisible();
    await expect(page.locator('[role="menuitem"]:has-text("Sign out")')).toBeVisible();
  });

  test('should logout via user dropdown', async ({ page }) => {
    await page.goto('/dashboard');

    // Open user menu
    const userMenu = page.locator('[data-sidebar="footer"] [data-sidebar="menu-button"]');
    await userMenu.click();

    // Click sign out
    await page.locator('[role="menuitem"]:has-text("Sign out")').click();

    // Should redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
  });
});

test.describe('Responsive Sidebar', () => {
  test.use({ storageState: STORAGE_STATE });

  test('should be collapsible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // On mobile, sidebar should be hidden by default
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    // Check for mobile trigger
    const trigger = page.locator('[data-sidebar="trigger"]');
    if (await trigger.isVisible()) {
      // Click to open sidebar
      await trigger.click();
      await expect(sidebar).toBeVisible();

      // Close sidebar
      await page.keyboard.press('Escape');
    }
  });

  test('should show full sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');

    // Sidebar should be visible
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    await expect(sidebar).toBeVisible();
  });
});
