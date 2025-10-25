import { test, expect } from '../fixtures/testFixtures';
import { testCustomers } from '../data/testData';

test.describe('Credits Workflow', () => {
  test.beforeEach(async ({ authenticatedPage, creditsPage }) => {
    // Navigate to credits page
    await creditsPage.goto();

    // Verify we're on credits page
    const url = authenticatedPage.url();
    expect(url).toContain('/credits');
  });

  test('should search for customer by ID', async ({ creditsPage }) => {
    // Search by customer ID
    await creditsPage.search('1');

    // Verify results are displayed
    const isResultVisible = await creditsPage.isResultVisible();
    expect(isResultVisible).toBe(true);
  });

  test('should display credit balance', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    // Verify credit balance is displayed
    const balance = await creditsPage.getCreditBalance();
    expect(balance).toBeTruthy();
  });

  test('should display credit limit', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    // Verify credit limit is displayed
    const limit = await creditsPage.getCreditLimit();
    expect(limit).toBeTruthy();
  });

  test('should display credit used and available', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    // Verify credit used is displayed
    const used = await creditsPage.getCreditUsed();
    expect(used).toBeTruthy();

    // Verify credit available is displayed
    const available = await creditsPage.getCreditAvailable();
    expect(available).toBeTruthy();
  });

  test('should navigate to transactions tab', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Navigate to transactions tab
    await creditsPage.goToTransactionsTab();

    // Verify transactions are displayed (if any)
    const count = await creditsPage.getTransactionCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to settlement tab', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Navigate to settlement tab
    await creditsPage.goToSettlementTab();

    // Verify settlement form is visible
    const isFormVisible = await creditsPage.isSettlementFormVisible();
    expect(isFormVisible).toBe(true);
  });

  test('should settle credit with cash payment', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Go to settlement tab
    await creditsPage.goToSettlementTab();

    // Enter settlement amount
    await creditsPage.enterSettlementAmount(100);

    // Select cash payment method
    await creditsPage.selectSettlementMethod('cash');

    // Submit settlement
    await creditsPage.submitSettlement();

    // Wait for response
    await creditsPage.page.waitForTimeout(500);

    // Verify success message or result
    const hasSuccess = await creditsPage.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
  });

  test('should settle credit with card payment', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('2');

    // Go to settlement tab
    await creditsPage.goToSettlementTab();

    // Enter settlement amount
    await creditsPage.enterSettlementAmount(50);

    // Select card payment method
    await creditsPage.selectSettlementMethod('card');

    // Submit settlement
    await creditsPage.submitSettlement();

    // Wait for response
    await creditsPage.page.waitForTimeout(500);

    // Verify success message or result
    const hasSuccess = await creditsPage.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
  });

  test('should clear search fields', async ({ creditsPage }) => {
    // Fill search fields
    await creditsPage.searchByCustomerId('1');
    await creditsPage.searchByCustomerName('Local Bike');

    // Click clear button
    await creditsPage.clickClear();

    // Wait for clear to complete
    await creditsPage.page.waitForTimeout(300);

    // Verify fields are cleared
    const idValue = await creditsPage.page.locator('input[placeholder*="Customer"]').first().inputValue();
    expect(idValue).toBe('');
  });

  test('should handle multiple customer searches in sequence', async ({ creditsPage }) => {
    // First search
    await creditsPage.search('1');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    let balance = await creditsPage.getCreditBalance();
    expect(balance).toBeTruthy();

    // Clear and search for different customer
    await creditsPage.clickClear();
    await creditsPage.page.waitForTimeout(300);

    // Second search
    await creditsPage.search('3');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    balance = await creditsPage.getCreditBalance();
    expect(balance).toBeTruthy();
  });

  test('should display last transaction date', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('1');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    // Verify last transaction date is displayed (might be empty for new customers)
    const date = await creditsPage.getLastTransactionDate();
    expect(typeof date).toBe('string');
  });

  test('should handle settlement with reference number', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('4');

    // Go to settlement tab
    await creditsPage.goToSettlementTab();

    // Fill in settlement details
    await creditsPage.enterSettlementAmount(75);
    await creditsPage.selectSettlementMethod('cash');
    await creditsPage.enterSettlementReference('REF-001');

    // Submit settlement
    await creditsPage.submitSettlement();

    // Wait for response
    await creditsPage.page.waitForTimeout(500);

    // Verify success
    const hasSuccess = await creditsPage.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
  });

  test('should display transaction summary', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('5');

    // Navigate to transactions tab
    await creditsPage.goToTransactionsTab();

    // Verify transaction data can be retrieved
    const totalTransactions = await creditsPage.getTotalTransactions();
    expect(typeof totalTransactions).toBe('string');

    const totalAmount = await creditsPage.getTotalAmount();
    expect(typeof totalAmount).toBe('string');
  });

  test('should complete full credit settlement workflow', async ({ creditsPage }) => {
    // Search for customer
    await creditsPage.search('2');

    // Wait for results
    await creditsPage.page.waitForTimeout(500);

    // Verify initial credit status
    let balance = await creditsPage.getCreditBalance();
    expect(balance).toBeTruthy();

    // Navigate to settlement
    await creditsPage.goToSettlementTab();

    // Settle credit
    await creditsPage.enterSettlementAmount(100);
    await creditsPage.selectSettlementMethod('cash');
    await creditsPage.submitSettlement();

    // Wait for response
    await creditsPage.page.waitForTimeout(500);

    // Verify settlement was successful
    const hasSuccess = await creditsPage.hasSuccessMessage();
    expect(hasSuccess).toBe(true);
  });
});
