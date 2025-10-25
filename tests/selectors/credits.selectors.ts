/**
 * Credits Page Selectors
 * Centralized selectors for credits page elements
 */
export const creditsSelectors = {
  // Search section
  customerIdInput: 'input[placeholder*="Customer"]',
  customerNameInput: 'input[placeholder*="Name"]',
  searchButton: 'button:has-text("Search")',
  clearButton: 'button:has-text("Clear")',

  // Results section
  creditSearchResults: '[data-testid="credit-results"]',
  creditResultItem: '[data-testid="credit-result"]',

  // Credit status
  creditStatus: '[data-testid="credit-status"]',
  creditBalance: '[data-testid="credit-balance"]',
  creditLimit: '[data-testid="credit-limit"]',
  creditUsed: '[data-testid="credit-used"]',
  creditAvailable: '[data-testid="credit-available"]',
  lastTransactionDate: '[data-testid="last-transaction"]',

  // Transactions tab
  transactionsTab: '[data-testid="tab-transactions"]',
  transactionsList: '[data-testid="transactions-list"]',
  transactionItem: '[data-testid="transaction-item"]',
  transactionType: '[data-testid="transaction-type"]',
  transactionAmount: '[data-testid="transaction-amount"]',
  transactionDate: '[data-testid="transaction-date"]',

  // Settlement tab
  settlementTab: '[data-testid="tab-settlement"]',
  settlementForm: '[data-testid="settlement-form"]',
  settlementAmountInput: 'input[placeholder*="Amount"]',
  settlementMethodSelect: 'select[data-testid="payment-method"]',
  settlementReference: 'input[placeholder*="Reference"]',
  settleButton: 'button:has-text("Settle")',

  // Settlement methods
  settlementCash: 'label:has-text("Cash")',
  settlementCard: 'label:has-text("Card")',
  settlementCheck: 'label:has-text("Check")',

  // Messages and alerts
  successMessage: '[data-testid="success-message"]',
  errorMessage: '[data-testid="error-message"]',
  warningMessage: '[data-testid="warning-message"]',

  // Summary
  summaryContainer: '[data-testid="summary"]',
  totalTransactions: '[data-testid="total-transactions"]',
  totalAmount: '[data-testid="total-amount"]',
};
