import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Mesh Topology', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-303-01: navigates to mesh topology page', async ({ page }) => {
    await page.goto('/mesh');
    await expect(page.locator('[data-testid="mesh-topology-page"]')).toBeVisible();
  });

  test('OAV-303-02: period selector buttons are visible', async ({ page }) => {
    await page.goto('/mesh');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="period-1h"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-24h"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-7d"]')).toBeVisible();
  });

  test('OAV-303-03: node detail panel opens on node click', async ({ page }) => {
    await page.goto('/mesh');
    await page.waitForLoadState('networkidle');
    const nodes = await page.locator('[data-testid="mesh-topology-node"]').count();
    if (nodes === 0) {
      test.skip();
      return;
    }
    await page.locator('[data-testid="mesh-topology-node"]').first().click();
    await expect(page.locator('[data-testid="mesh-node-panel"]')).toBeVisible();
  });
});
