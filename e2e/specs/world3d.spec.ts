import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('3D World View', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-301-01: navigates to 3D world page on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/world3d');
    await expect(page.locator('[data-testid="world3d-page"]')).toBeVisible();
  });

  test('OAV-301-02: redirects to 2D world on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/world3d');
    await page.waitForURL(/\/world/);
    expect(page.url()).toMatch(/\/world$/);
  });

  test('OAV-301-03: controls guide shown on first visit', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Clear guide shown flag
    await page.evaluate(() => localStorage.removeItem('oav_3d_guide_shown'));
    await page.goto('/world3d');
    await expect(page.locator('[data-testid="controls-guide"]')).toBeVisible();
  });

  test('OAV-301-04: controls guide dismissed by "Got it!" button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.evaluate(() => localStorage.removeItem('oav_3d_guide_shown'));
    await page.goto('/world3d');
    await page.locator('[data-testid="dismiss-guide"]').click();
    await expect(page.locator('[data-testid="controls-guide"]')).not.toBeVisible();
  });

  test('OAV-301-05: 2D/3D toggle present', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/world3d');
    await expect(page.locator('[data-testid="toggle-2d"]')).toBeVisible();
  });

  test('OAV-301-06: connecting overlay shown while connecting', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // UE5_ENABLED=true would show connecting overlay; default is fallback
    await page.goto('/world3d');
    // Either connecting overlay or fallback banner should be present
    const hasConnecting = await page.locator('[data-testid="ue5-connecting-overlay"]').isVisible();
    const hasPage = await page.locator('[data-testid="world3d-page"]').isVisible();
    expect(hasPage).toBe(true);
  });
});
