import { type Page, type Locator } from '@playwright/test';

export class TraceExplorerPageObject {
  readonly page: Page;
  readonly searchBar: Locator;
  readonly searchButton: Locator;
  readonly traceRows: Locator;
  readonly errorsOnlyCheckbox: Locator;
  readonly minDurationInput: Locator;
  readonly spanDetailPanel: Locator;
  readonly closePanelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBar = page.locator('[data-testid="trace-search-bar"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.traceRows = page.locator('[data-testid="trace-row"]');
    this.errorsOnlyCheckbox = page.locator('[data-testid="errors-only-checkbox"]');
    this.minDurationInput = page.locator('[data-testid="min-duration-input"]');
    this.spanDetailPanel = page.locator('[data-testid="span-detail-panel"]');
    this.closePanelButton = page.locator('[data-testid="slide-panel-close"]');
  }

  async goto() {
    await this.page.goto('/traces');
    await this.page.waitForLoadState('networkidle');
  }

  async searchWithTimeRange(range: 'last_1h' | 'last_24h' | 'last_7d') {
    await this.page.click(`[data-testid="time-range-${range}"]`);
    await this.searchButton.click();
  }

  async expandFirstTrace() {
    const firstRow = this.traceRows.first();
    await firstRow.click();
  }

  async openFirstSpan() {
    await this.page.locator('[data-testid="waterfall-span-row"]').first().click();
  }

  async closePanel() {
    await this.closePanelButton.click();
  }
}
