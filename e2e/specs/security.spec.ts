import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { SecurityPageObject } from '../page-objects/SecurityPage';

test.describe('Security Dashboard', () => {
  let loginPage: LoginPage;
  let securityPage: SecurityPageObject;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    securityPage = new SecurityPageObject(page);
    await loginPage.goto();
    await loginPage.login();
  });

  test('OAV-305-01: navigates to security page', async ({ page }) => {
    await securityPage.goto();
    await expect(page.locator('[data-testid="security-page"]')).toBeVisible();
  });

  test('OAV-305-02: agent security detail panel opens on row click', async ({ page }) => {
    await securityPage.goto();
    const rows = await securityPage.agentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }
    await securityPage.clickFirstAgent();
    await expect(securityPage.securityDetailPanel).toBeVisible();
  });

  test('OAV-305-03: agent security detail panel closes on X button', async ({ page }) => {
    await securityPage.goto();
    const rows = await securityPage.agentRows.count();
    if (rows === 0) {
      test.skip();
      return;
    }
    await securityPage.clickFirstAgent();
    await securityPage.closePanel();
    await expect(securityPage.securityDetailPanel).not.toBeVisible({ timeout: 1000 });
  });
});
