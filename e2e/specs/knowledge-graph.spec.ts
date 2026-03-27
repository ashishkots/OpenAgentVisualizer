import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Knowledge Graph', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-304-01: navigates to knowledge graph page', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('[data-testid="knowledge-graph-page"]')).toBeVisible();
  });

  test('OAV-304-02: search input is visible', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('[data-testid="knowledge-search-input"]')).toBeVisible();
  });

  test('OAV-304-03: entity type filter buttons are visible', async ({ page }) => {
    await page.goto('/knowledge');
    await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-concept"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-fact"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-agent_memory"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-embedding"]')).toBeVisible();
  });

  test('OAV-304-04: entity detail panel opens on node click', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');
    const nodes = await page.locator('[data-testid="knowledge-graph-node"]').count();
    if (nodes === 0) {
      test.skip();
      return;
    }
    await page.locator('[data-testid="knowledge-graph-node"]').first().click();
    await expect(page.locator('[data-testid="entity-detail-panel"]')).toBeVisible();
  });
});
