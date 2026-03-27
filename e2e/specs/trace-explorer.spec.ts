import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { TraceExplorerPageObject } from '../page-objects/TraceExplorerPage';

test.describe('Trace Explorer', () => {
  let loginPage: LoginPage;
  let tracePage: TraceExplorerPageObject;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tracePage = new TraceExplorerPageObject(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-302-01: navigates to trace explorer and shows search bar', async ({ page }) => {
    await tracePage.goto();
    await expect(page.locator('[data-testid="trace-explorer-page"]')).toBeVisible();
    await expect(tracePage.searchBar).toBeVisible();
    await expect(tracePage.searchButton).toBeVisible();
  });

  test('OAV-302-02: search bar shows time range options', async ({ page }) => {
    await tracePage.goto();
    await expect(page.locator('[data-testid="time-range-last_1h"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-range-last_24h"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-range-last_7d"]')).toBeVisible();
  });

  test('OAV-302-03: errors only checkbox is present and toggleable', async ({ page }) => {
    await tracePage.goto();
    await expect(tracePage.errorsOnlyCheckbox).toBeVisible();
    await tracePage.errorsOnlyCheckbox.check();
    await expect(tracePage.errorsOnlyCheckbox).toBeChecked();
  });

  test('OAV-302-04: span detail panel opens when span row is clicked', async ({ page }) => {
    await tracePage.goto();
    // Mock trace data — skip if no traces present
    const rows = await page.locator('[data-testid="trace-row"]').count();
    if (rows === 0) {
      test.skip();
      return;
    }
    await tracePage.expandFirstTrace();
    await tracePage.openFirstSpan();
    await expect(tracePage.spanDetailPanel).toBeVisible();
  });

  test('OAV-302-05: span detail panel closes on X button', async ({ page }) => {
    await tracePage.goto();
    const rows = await page.locator('[data-testid="trace-row"]').count();
    if (rows === 0) {
      test.skip();
      return;
    }
    await tracePage.expandFirstTrace();
    await tracePage.openFirstSpan();
    await tracePage.closePanel();
    await expect(tracePage.spanDetailPanel).not.toBeVisible({ timeout: 1000 });
  });

  test('OAV-302-06: span detail panel closes on Escape key', async ({ page }) => {
    await tracePage.goto();
    const rows = await page.locator('[data-testid="trace-row"]').count();
    if (rows === 0) {
      test.skip();
      return;
    }
    await tracePage.expandFirstTrace();
    await tracePage.openFirstSpan();
    await page.keyboard.press('Escape');
    await expect(tracePage.spanDetailPanel).not.toBeVisible({ timeout: 1000 });
  });
});
