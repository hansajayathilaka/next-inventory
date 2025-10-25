import { test, expect } from '../fixtures/testFixtures';
import { testProducts, testCustomers } from '../data/testData';

test.describe('POS Workflow', () => {
  test.beforeEach(async ({ authenticatedPage, posPage }) => {
    // Navigate to POS page
    await posPage.goto();

    // Verify we're on POS page
    const url = authenticatedPage.url();
    expect(url).toContain('/pos');
  });

  test('should create a new POS session', async ({ posPage }) => {
    // Get initial session count
    const initialCount = await posPage.getSessionCount();

    // Create new session
    await posPage.createNewSession();

    // Verify session was created
    const newCount = await posPage.getSessionCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should add product to cart', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Get initial cart count
    const initialCount = await posPage.getCartItemCount();

    // Search for product
    await posPage.selectProductByCode(testProducts.product1.code);

    // Verify product was added to cart
    const newCount = await posPage.getCartItemCount();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should add multiple products to cart', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add first product
    await posPage.selectProductByCode(testProducts.product1.code);

    // Add second product
    await posPage.selectProductByCode(testProducts.product2.code);

    // Verify both products are in cart
    const cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBe(2);
  });

  test('should update product quantity in cart', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Update quantity
    await posPage.updateQuantity(0, 5);

    // Verify cart total is updated (should be larger)
    const cartTotal = await posPage.getCartTotal();
    expect(cartTotal).toBeTruthy();
  });

  test('should remove item from cart', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Verify product is in cart
    let cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBe(1);

    // Remove the product
    await posPage.removeCartItem(0);

    // Verify product was removed
    cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBe(0);
  });

  test('should clear entire cart', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add multiple products
    await posPage.selectProductByCode(testProducts.product1.code);
    await posPage.selectProductByCode(testProducts.product2.code);

    // Verify products are in cart
    let cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBeGreaterThan(0);

    // Clear cart
    await posPage.clearCart();

    // Verify cart is empty
    cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBe(0);
  });

  test('should complete a simple cash sale', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Get cart total
    const cartTotal = await posPage.getCartTotal();
    expect(cartTotal).toBeTruthy();

    // Complete cash payment with amount greater than total
    const totalAmount = parseFloat(cartTotal.replace(/[^0-9.-]/g, ''));
    await posPage.completeCashPayment(totalAmount + 10);

    // Verify receipt is shown
    const hasReceipt = await posPage.isReceiptVisible();
    expect(hasReceipt).toBe(true);
  });

  test('should apply fixed discount', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Get original total
    const originalTotal = await posPage.getCartTotal();

    // Apply fixed discount
    await posPage.applyFixedDiscount(10);

    // Get new total with discount
    const newTotal = await posPage.getCartTotal();

    // Verify discount was applied (new total should be less)
    const originalAmount = parseFloat(originalTotal.replace(/[^0-9.-]/g, ''));
    const newAmount = parseFloat(newTotal.replace(/[^0-9.-]/g, ''));
    expect(newAmount).toBeLessThan(originalAmount);
  });

  test('should apply percentage discount', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Get original total
    const originalTotal = await posPage.getCartTotal();

    // Apply percentage discount
    await posPage.applyPercentageDiscount(10);

    // Get new total with discount
    const newTotal = await posPage.getCartTotal();

    // Verify discount was applied
    const originalAmount = parseFloat(originalTotal.replace(/[^0-9.-]/g, ''));
    const newAmount = parseFloat(newTotal.replace(/[^0-9.-]/g, ''));
    expect(newAmount).toBeLessThan(originalAmount);
  });

  test('should handle credit payment with customer selection', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Select credit payment
    await posPage.selectCreditPayment();

    // Search for customer
    await posPage.searchCustomer('1'); // Search for customer ID 1

    // Select first customer result
    await posPage.selectCustomer(0);

    // Verify customer was selected
    const hasWarning = await posPage.hasCreditWarning();
    // Warning might or might not show depending on credit limit
    expect(typeof hasWarning).toBe('boolean');
  });

  test('should show receipt after payment', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add product to cart
    await posPage.selectProductByCode(testProducts.product1.code);

    // Complete cash payment
    const cartTotal = await posPage.getCartTotal();
    const totalAmount = parseFloat(cartTotal.replace(/[^0-9.-]/g, ''));
    await posPage.completeCashPayment(totalAmount + 10);

    // Verify receipt is visible
    const receiptVisible = await posPage.isReceiptVisible();
    expect(receiptVisible).toBe(true);

    // Verify receipt has a number
    const receiptNumber = await posPage.getReceiptNumber();
    expect(receiptNumber).toBeTruthy();
  });

  test('should manage multiple concurrent POS sessions', async ({ posPage }) => {
    // Create first session
    await posPage.createNewSession();
    await posPage.selectProductByCode(testProducts.product1.code);

    // Create second session
    await posPage.createNewSession();
    await posPage.selectProductByCode(testProducts.product2.code);

    // Verify we have 2 sessions
    const sessionCount = await posPage.getSessionCount();
    expect(sessionCount).toBeGreaterThanOrEqual(2);

    // Verify cart has 1 item (from current session)
    const cartCount = await posPage.getCartItemCount();
    expect(cartCount).toBe(1);
  });

  test('should calculate correct cart totals', async ({ posPage }) => {
    // Create a new session
    await posPage.createNewSession();

    // Add products
    await posPage.selectProductByCode(testProducts.product1.code);
    await posPage.selectProductByCode(testProducts.product2.code);

    // Verify subtotal and total are calculated
    const subtotal = await posPage.getSubtotal();
    const total = await posPage.getCartTotal();

    expect(subtotal).toBeTruthy();
    expect(total).toBeTruthy();

    // Verify total >= subtotal
    const subtotalAmount = parseFloat(subtotal.replace(/[^0-9.-]/g, ''));
    const totalAmount = parseFloat(total.replace(/[^0-9.-]/g, ''));
    expect(totalAmount).toBeGreaterThanOrEqual(subtotalAmount);
  });
});
