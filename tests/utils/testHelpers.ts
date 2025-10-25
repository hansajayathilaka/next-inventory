import { Page, expect } from '@playwright/test';

/**
 * Test Helper Utilities
 * Common helper functions for test operations
 */

/**
 * Assertion Helpers
 */
export async function assertElementVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function assertElementText(page: Page, selector: string, text: string) {
  await expect(page.locator(selector)).toContainText(text);
}

export async function assertInputValue(page: Page, selector: string, value: string) {
  await expect(page.locator(selector)).toHaveValue(value);
}

export async function assertElementEnabled(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeEnabled();
}

export async function assertElementDisabled(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeDisabled();
}

export async function assertURL(page: Page, urlPattern: string | RegExp) {
  if (typeof urlPattern === 'string') {
    await expect(page).toHaveURL(new RegExp(urlPattern));
  } else {
    await expect(page).toHaveURL(urlPattern);
  }
}

/**
 * Wait and Action Helpers
 */
export async function waitAndClick(page: Page, selector: string, timeout: number = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.click();
}

export async function waitAndFill(page: Page, selector: string, value: string, timeout: number = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.fill(value);
}

export async function waitForElementWithText(page: Page, selector: string, text: string, timeout: number = 5000) {
  const element = page.locator(selector, { hasText: text });
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Network Helpers
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return await page.waitForResponse((response) => {
    if (typeof urlPattern === 'string') {
      return response.url().includes(urlPattern);
    } else {
      return urlPattern.test(response.url());
    }
  });
}

export async function waitForAPIRequest(page: Page, urlPattern: string | RegExp, timeout: number = 10000) {
  return await page.waitForRequest((request) => {
    if (typeof urlPattern === 'string') {
      return request.url().includes(urlPattern);
    } else {
      return urlPattern.test(request.url());
    }
  });
}

/**
 * Data Format Helpers
 */
export function parseCurrency(value: string): number {
  // Parse "₱100.50" or "$100.50" or "100.50"
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}

export function formatCurrency(value: number, currency: string = '₱'): string {
  return `${currency}${value.toFixed(2)}`;
}

export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test.user.${timestamp}.${random}@example.com`;
}

export function generateRandomCustomerId(): string {
  return `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function generateRandomPhone(): string {
  return `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

/**
 * File and Screenshot Helpers
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename });
  return filename;
}

/**
 * Retry Helper
 */
export async function retry<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new Error(`Retry failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Form Helper
 */
export async function fillForm(
  page: Page,
  fields: Array<{ selector: string; value: string | number }>
) {
  for (const field of fields) {
    const element = page.locator(field.selector);
    await element.fill(String(field.value));
  }
}

/**
 * Table Helper
 */
export async function getTableData(
  page: Page,
  tableSelector: string,
  headers: string[]
): Promise<Array<Record<string, string>>> {
  const rows = await page.locator(`${tableSelector} tbody tr`).all();
  const data: Array<Record<string, string>> = [];

  for (const row of rows) {
    const record: Record<string, string> = {};
    const cells = await row.locator('td').all();

    for (let i = 0; i < headers.length && i < cells.length; i++) {
      record[headers[i]] = await cells[i].textContent() || '';
    }

    data.push(record);
  }

  return data;
}

/**
 * Modal Helper
 */
export async function closeModal(page: Page, closeButtonSelector: string = 'button[aria-label="Close"]') {
  const closeButton = page.locator(closeButtonSelector);
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  }
}

/**
 * Dialog Helper
 */
export async function handleConfirmDialog(page: Page, accept: boolean = true) {
  page.on('dialog', async (dialog) => {
    if (accept) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  });
}
