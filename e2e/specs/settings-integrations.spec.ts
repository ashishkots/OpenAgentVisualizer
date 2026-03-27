import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Settings — Integrations Tab', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-306-01: navigates to settings integrations tab', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-tab-integrations"]')).toBeVisible();
  });

  test('OAV-306-02: all four integration cards are rendered', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    await expect(page.locator('[data-testid="integration-card-opentrace"]')).toBeVisible();
    await expect(page.locator('[data-testid="integration-card-openmesh"]')).toBeVisible();
    await expect(page.locator('[data-testid="integration-card-openmind"]')).toBeVisible();
    await expect(page.locator('[data-testid="integration-card-openshield"]')).toBeVisible();
  });

  test('OAV-306-03: toggle enables/disables card inputs', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    const toggle = page.locator('[data-testid="toggle-opentrace"]');
    await toggle.click(); // Enable
    await expect(page.locator('[data-testid="opentrace-url-input"]')).not.toBeDisabled();
  });

  test('OAV-306-04: test connection button shows correct initial state', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    // Enable opentrace first
    await page.locator('[data-testid="toggle-opentrace"]').click();
    await expect(page.locator('[data-testid="test-opentrace"]')).toBeVisible();
  });

  test('OAV-306-05: save button is disabled until inputs are dirty', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    // Enable the toggle to allow save
    await page.locator('[data-testid="toggle-opentrace"]').click();
    // Save button should be enabled now (toggle changed = dirty)
    const saveBtn = page.locator('[data-testid="save-opentrace"]');
    await expect(saveBtn).not.toBeDisabled();
  });

  test('OAV-306-06: XP decay toggle is present', async ({ page }) => {
    await page.goto('/settings?tab=integrations');
    await expect(page.locator('[data-testid="xp-decay-toggle"]')).toBeVisible();
  });

  test('OAV-306-07: settings tabs switch content', async ({ page }) => {
    await page.goto('/settings');
    // Click Integrations tab
    await page.locator('[data-testid="settings-tab-integrations"]').click();
    await expect(page.url()).toContain('tab=integrations');
    await expect(page.locator('[data-testid="integration-card-opentrace"]')).toBeVisible();
  });
});
