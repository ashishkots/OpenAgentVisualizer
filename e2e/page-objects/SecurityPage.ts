import { type Page, type Locator } from '@playwright/test';

export class SecurityPageObject {
  readonly page: Page;
  readonly agentRows: Locator;
  readonly securityDetailPanel: Locator;
  readonly closePanelButton: Locator;
  readonly violationsChart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.agentRows = page.locator('[data-testid="security-agent-row"]');
    this.securityDetailPanel = page.locator('[data-testid="security-detail-panel"]');
    this.closePanelButton = page.locator('[data-testid="slide-panel-close"]');
    this.violationsChart = page.locator('[data-testid="security-page"]');
  }

  async goto() {
    await this.page.goto('/security');
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstAgent() {
    await this.agentRows.first().click();
  }

  async closePanel() {
    await this.closePanelButton.click();
  }
}
