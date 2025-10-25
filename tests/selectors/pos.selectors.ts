/**
 * POS Page Selectors
 * Centralized selectors for POS page elements
 */
export const posSelectors = {
  // Session management
  newSessionButton: 'button:has-text("New Session")',
  sessionList: '[data-testid="session-list"]',
  sessionItem: '[data-testid="session-item"]',
  closeSessionButton: 'button:has-text("Close Session")',
  sessionTitle: '[data-testid="session-title"]',

  // Product selection
  productSearch: 'input[placeholder*="Search"]',
  productItem: '[data-testid="product-item"]',
  productName: '[data-testid="product-name"]',
  productPrice: '[data-testid="product-price"]',

  // Cart
  cartContainer: '[data-testid="cart"]',
  cartItem: '[data-testid="cart-item"]',
  cartItemQuantity: '[data-testid="quantity-input"]',
  cartItemTotal: '[data-testid="item-total"]',
  removeFromCartButton: 'button:has-text("Remove")',
  clearCartButton: 'button:has-text("Clear Cart")',

  // Cart totals
  subtotal: '[data-testid="subtotal"]',
  discountAmount: '[data-testid="discount-amount"]',
  taxAmount: '[data-testid="tax-amount"]',
  totalAmount: '[data-testid="total-amount"]',

  // Discounts
  discountInput: 'input[data-testid="discount-input"]',
  discountTypeSelect: 'select[data-testid="discount-type"]',
  applyDiscountButton: 'button:has-text("Apply Discount")',
  discountError: '[data-testid="discount-error"]',

  // Payment methods
  paymentMethodContainer: '[data-testid="payment-methods"]',
  cashPaymentButton: 'button:has-text("Cash")',
  cardPaymentButton: 'button:has-text("Card")',
  creditPaymentButton: 'button:has-text("Credit")',

  // Cash payment
  cashAmountInput: 'input[placeholder*="Amount"]',
  processPaymentButton: 'button:has-text("Process")',
  changeAmount: '[data-testid="change"]',

  // Credit payment
  customerSearch: 'input[placeholder*="Customer"]',
  customerOption: '[data-testid="customer-option"]',
  creditLimitWarning: '[data-testid="credit-warning"]',

  // Warnings and alerts
  warningMessage: '[data-testid="warning"]',
  errorMessage: '[data-testid="error"]',
  successMessage: '[data-testid="success"]',

  // Receipt
  receiptContainer: '[data-testid="receipt"]',
  printButton: 'button:has-text("Print")',
  downloadButton: 'button:has-text("Download")',
  closeReceiptButton: 'button:has-text("Close")',
  receiptNumber: '[data-testid="receipt-number"]',
};
