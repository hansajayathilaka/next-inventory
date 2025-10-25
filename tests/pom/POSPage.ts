import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { posSelectors } from '@selectors/pos.selectors';

/**
 * POS Page Object
 * Handles all POS page interactions for multi-session sales
 */
export class POSPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/pos');
  }

  /**
   * Session Management Methods
   */
  async createNewSession() {
    await this.click(posSelectors.newSessionButton);
    await this.page.waitForTimeout(500);
  }

  async getActiveSessionTitle(): Promise<string> {
    return await this.getText(posSelectors.sessionTitle);
  }

  async closeCurrentSession() {
    await this.click(posSelectors.closeSessionButton);
  }

  async getSessionCount(): Promise<number> {
    return await this.getElementCount(posSelectors.sessionItem);
  }

  /**
   * Product Selection Methods
   */
  async searchProduct(productCode: string) {
    await this.fillInput(posSelectors.productSearch, productCode);
    await this.page.waitForTimeout(300);
  }

  async selectProduct(productName: string) {
    const product = this.page.locator(posSelectors.productItem, { has: this.page.locator(`text=${productName}`) });
    await product.click();
  }

  async selectProductByCode(code: string) {
    await this.searchProduct(code);
    const firstProduct = this.page.locator(posSelectors.productItem).first();
    await firstProduct.click();
  }

  /**
   * Cart Methods
   */
  async getCartItemCount(): Promise<number> {
    return await this.getElementCount(posSelectors.cartItem);
  }

  async getCartTotal(): Promise<string> {
    return await this.getText(posSelectors.totalAmount);
  }

  async getSubtotal(): Promise<string> {
    return await this.getText(posSelectors.subtotal);
  }

  async updateQuantity(itemIndex: number, quantity: number) {
    const quantityInputs = this.page.locator(posSelectors.cartItemQuantity);
    const input = quantityInputs.nth(itemIndex);
    await input.fill(quantity.toString());
    await this.page.keyboard.press('Enter');
  }

  async removeCartItem(itemIndex: number) {
    const removeButtons = this.page.locator(posSelectors.removeFromCartButton);
    await removeButtons.nth(itemIndex).click();
  }

  async clearCart() {
    await this.click(posSelectors.clearCartButton);
  }

  /**
   * Discount Methods
   */
  async applyFixedDiscount(amount: number) {
    await this.fillInput(posSelectors.discountInput, amount.toString());
    await this.selectOption(posSelectors.discountTypeSelect, 'fixed');
    await this.click(posSelectors.applyDiscountButton);
  }

  async applyPercentageDiscount(percentage: number) {
    await this.fillInput(posSelectors.discountInput, percentage.toString());
    await this.selectOption(posSelectors.discountTypeSelect, 'percentage');
    await this.click(posSelectors.applyDiscountButton);
  }

  async getDiscountAmount(): Promise<string> {
    return await this.getText(posSelectors.discountAmount);
  }

  /**
   * Payment Methods - Cash
   */
  async selectCashPayment() {
    await this.click(posSelectors.cashPaymentButton);
  }

  async enterCashAmount(amount: number) {
    await this.fillInput(posSelectors.cashAmountInput, amount.toString());
  }

  async processPayment() {
    await this.click(posSelectors.processPaymentButton);
  }

  async getChangeAmount(): Promise<string> {
    return await this.getText(posSelectors.changeAmount);
  }

  async completeCashPayment(amount: number) {
    await this.selectCashPayment();
    await this.enterCashAmount(amount);
    await this.processPayment();
  }

  /**
   * Payment Methods - Card
   */
  async selectCardPayment() {
    await this.click(posSelectors.cardPaymentButton);
  }

  /**
   * Payment Methods - Credit
   */
  async selectCreditPayment() {
    await this.click(posSelectors.creditPaymentButton);
  }

  async searchCustomer(customerId: string) {
    await this.fillInput(posSelectors.customerSearch, customerId);
    await this.page.waitForTimeout(300);
  }

  async selectCustomer(customerIndex: number = 0) {
    const options = this.page.locator(posSelectors.customerOption);
    await options.nth(customerIndex).click();
  }

  async hasCreditWarning(): Promise<boolean> {
    return await this.isElementVisible(posSelectors.creditLimitWarning);
  }

  /**
   * Receipt Methods
   */
  async isReceiptVisible(): Promise<boolean> {
    return await this.isElementVisible(posSelectors.receiptContainer);
  }

  async getReceiptNumber(): Promise<string> {
    return await this.getText(posSelectors.receiptNumber);
  }

  async printReceipt() {
    await this.click(posSelectors.printButton);
  }

  async downloadReceipt() {
    await this.click(posSelectors.downloadButton);
  }

  async closeReceipt() {
    await this.click(posSelectors.closeReceiptButton);
  }

  /**
   * Messages and Alerts
   */
  async getWarningMessage(): Promise<string> {
    return await this.getText(posSelectors.warningMessage);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getText(posSelectors.errorMessage);
  }

  async getSuccessMessage(): Promise<string> {
    return await this.getText(posSelectors.successMessage);
  }

  async hasWarning(): Promise<boolean> {
    return await this.isElementVisible(posSelectors.warningMessage);
  }

  async hasError(): Promise<boolean> {
    return await this.isElementVisible(posSelectors.errorMessage);
  }
}
