import { Page } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common methods shared across all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigation Methods
   */
  async goto(path: string = '') {
    await this.page.goto(`${this.page.context().baseURL}${path}`);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Element Interaction Methods
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  async fillInput(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  async typeText(selector: string, text: string) {
    await this.page.locator(selector).type(text, { delay: 50 });
  }

  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Element Visibility Methods
   */
  async isElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ timeout: 3000 });
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.locator(selector).waitFor({ timeout });
  }

  async verifyElementVisible(selector: string) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Form Operations
   */
  async selectOption(selector: string, value: string) {
    await this.page.locator(selector).selectOption(value);
  }

  async checkCheckbox(selector: string) {
    await this.page.locator(selector).check();
  }

  async uncheckCheckbox(selector: string) {
    await this.page.locator(selector).uncheck();
  }

  async isChecked(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isChecked();
  }

  async clearInput(selector: string) {
    await this.page.locator(selector).fill('');
  }

  async getInputValue(selector: string): Promise<string> {
    return await this.page.locator(selector).inputValue();
  }

  /**
   * Utility Methods
   */
  async hover(selector: string) {
    await this.page.locator(selector).hover();
  }

  async doubleClick(selector: string) {
    await this.page.locator(selector).dblclick();
  }

  async screenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
  }

  async waitFor(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  async reload() {
    await this.page.reload();
  }

  async pressKey(key: string) {
    await this.page.press('body', key);
  }

  async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  async waitForURL(urlPattern: string | RegExp, timeout: number = 10000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async expectURL(urlPattern: string | RegExp) {
    const currentUrl = this.page.url();
    if (typeof urlPattern === 'string') {
      const currentUrlWithoutQuery = currentUrl.split('?')[0];
      const expectedUrlWithoutQuery = urlPattern.split('?')[0];
      if (!currentUrlWithoutQuery.includes(expectedUrlWithoutQuery)) {
        throw new Error(`Expected URL to contain ${urlPattern}, but got ${currentUrl}`);
      }
    } else {
      if (!urlPattern.test(currentUrl)) {
        throw new Error(`Expected URL to match ${urlPattern.toString()}, but got ${currentUrl}`);
      }
    }
  }

  async expectText(selector: string, expectedText: string) {
    const actualText = await this.getText(selector);
    if (!actualText.includes(expectedText)) {
      throw new Error(`Expected text "${expectedText}" in element, but got "${actualText}"`);
    }
  }
}
