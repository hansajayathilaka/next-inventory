import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { creditsSelectors } from '@selectors/credits.selectors';

/**
 * Credits Page Object
 * Handles all credits management page interactions
 */
export class CreditsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/credits');
  }

  /**
   * Search Methods
   */
  async searchByCustomerId(customerId: string) {
    await this.fillInput(creditsSelectors.customerIdInput, customerId);
  }

  async searchByCustomerName(name: string) {
    await this.fillInput(creditsSelectors.customerNameInput, name);
  }

  async clickSearch() {
    await this.click(creditsSelectors.searchButton);
    await this.page.waitForTimeout(500);
  }

  async clickClear() {
    await this.click(creditsSelectors.clearButton);
  }

  async search(customerId: string) {
    await this.searchByCustomerId(customerId);
    await this.clickSearch();
  }

  /**
   * Results Methods
   */
  async isResultVisible(): Promise<boolean> {
    return await this.isElementVisible(creditsSelectors.creditSearchResults);
  }

  async getResultCount(): Promise<number> {
    return await this.getElementCount(creditsSelectors.creditResultItem);
  }

  /**
   * Credit Status Methods
   */
  async getCreditBalance(): Promise<string> {
    return await this.getText(creditsSelectors.creditBalance);
  }

  async getCreditLimit(): Promise<string> {
    return await this.getText(creditsSelectors.creditLimit);
  }

  async getCreditUsed(): Promise<string> {
    return await this.getText(creditsSelectors.creditUsed);
  }

  async getCreditAvailable(): Promise<string> {
    return await this.getText(creditsSelectors.creditAvailable);
  }

  async getLastTransactionDate(): Promise<string> {
    return await this.getText(creditsSelectors.lastTransactionDate);
  }

  /**
   * Transactions Tab Methods
   */
  async goToTransactionsTab() {
    await this.click(creditsSelectors.transactionsTab);
    await this.page.waitForTimeout(300);
  }

  async getTransactionCount(): Promise<number> {
    return await this.getElementCount(creditsSelectors.transactionItem);
  }

  /**
   * Settlement Tab Methods
   */
  async goToSettlementTab() {
    await this.click(creditsSelectors.settlementTab);
    await this.page.waitForTimeout(300);
  }

  async isSettlementFormVisible(): Promise<boolean> {
    return await this.isElementVisible(creditsSelectors.settlementForm);
  }

  /**
   * Settlement Operations
   */
  async enterSettlementAmount(amount: number) {
    await this.fillInput(creditsSelectors.settlementAmountInput, amount.toString());
  }

  async selectSettlementMethod(method: 'cash' | 'card' | 'check') {
    switch (method) {
      case 'cash':
        await this.click(creditsSelectors.settlementCash);
        break;
      case 'card':
        await this.click(creditsSelectors.settlementCard);
        break;
      case 'check':
        await this.click(creditsSelectors.settlementCheck);
        break;
    }
  }

  async enterSettlementReference(reference: string) {
    await this.fillInput(creditsSelectors.settlementReference, reference);
  }

  async submitSettlement() {
    await this.click(creditsSelectors.settleButton);
    await this.page.waitForTimeout(500);
  }

  async settleCredit(amount: number, method: 'cash' | 'card' | 'check' = 'cash') {
    await this.goToSettlementTab();
    await this.enterSettlementAmount(amount);
    await this.selectSettlementMethod(method);
    await this.submitSettlement();
  }

  /**
   * Messages Methods
   */
  async getSuccessMessage(): Promise<string> {
    return await this.getText(creditsSelectors.successMessage);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(creditsSelectors.errorMessage);
  }

  async getWarningMessage(): Promise<string> {
    return await this.getText(creditsSelectors.warningMessage);
  }

  async hasSuccessMessage(): Promise<boolean> {
    return await this.isElementVisible(creditsSelectors.successMessage);
  }

  async hasErrorMessage(): Promise<boolean> {
    return await this.isElementVisible(creditsSelectors.errorMessage);
  }

  async hasWarningMessage(): Promise<boolean> {
    return await this.isElementVisible(creditsSelectors.warningMessage);
  }

  /**
   * Summary Methods
   */
  async getTotalTransactions(): Promise<string> {
    return await this.getText(creditsSelectors.totalTransactions);
  }

  async getTotalAmount(): Promise<string> {
    return await this.getText(creditsSelectors.totalAmount);
  }
}
