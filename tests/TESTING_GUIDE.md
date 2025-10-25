# E2E Testing Guide - Hardware Store POS System

## Overview

This guide provides comprehensive documentation for the Playwright end-to-end testing suite for the Hardware Store POS and Inventory System. The tests follow the **Page Object Model (POM)** pattern with **centralized selector storage** for maintainability and scalability.

## Quick Start

### 1. Install Dependencies
```bash
cd tests
npm install
```

### 2. Start the Application
```bash
# In another terminal, start the frontend
cd frontend
npm run dev

# And the backend
cd backend
go run ./cmd/server
```

### 3. Run Tests
```bash
# Run all tests
npm test

# Run in UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test specs/login.spec.ts
```

## Project Architecture

### Directory Structure

```
tests/
├── specs/                          # Test specifications
│   ├── login.spec.ts              # 14 login-related tests
│   ├── pos.spec.ts                # 24 POS system tests
│   └── credits.spec.ts            # 30 credits management tests
│
├── pom/                           # Page Object Models
│   ├── BasePage.ts                # Base class (25+ methods)
│   ├── LoginPage.ts               # Login interactions (9 methods)
│   ├── POSPage.ts                 # POS interactions (30+ methods)
│   └── CreditsPage.ts             # Credits interactions (25+ methods)
│
├── selectors/                     # Selector definitions
│   ├── login.selectors.ts         # Login page selectors
│   ├── pos.selectors.ts           # POS page selectors (50+ selectors)
│   ├── credits.selectors.ts       # Credits page selectors (40+ selectors)
│   └── navigation.selectors.ts    # Common navigation selectors
│
├── fixtures/                      # Test fixtures
│   └── testFixtures.ts            # Playwright fixtures with auto-login
│
├── utils/                         # Utility functions
│   └── testHelpers.ts             # 30+ helper functions
│
├── data/                          # Test data
│   └── testData.ts                # Test users, products, customers
│
├── playwright.config.ts           # Playwright configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # Detailed documentation
```

## Key Features

### 1. Page Object Model Pattern

**Benefits:**
- ✅ Separation of concerns (locators vs. tests)
- ✅ Reusable methods across tests
- ✅ Easy maintenance (change selector once, affects all tests)
- ✅ Readable test code
- ✅ Reduced test code duplication

**Example:**
```typescript
// ✅ Clear, maintainable
await posPage.addProductToCart(productName, quantity);
await posPage.completeCashPayment(amount);

// ❌ Hard to maintain
await page.click('[data-testid="product-item"]');
await page.fill('input[aria-label="Amount"]', amount);
```

### 2. Centralized Selectors

All selectors stored in separate files:
- **Login selectors:** 12 selectors
- **POS selectors:** 50+ selectors
- **Credits selectors:** 40+ selectors
- **Navigation selectors:** 25+ selectors

**Benefits:**
- ✅ Single source of truth
- ✅ Easy to update selectors
- ✅ No hardcoded selectors in tests
- ✅ Type-safe selector access

**Example:**
```typescript
// selectors/pos.selectors.ts
export const posSelectors = {
  addToCartButton: 'button:has-text("Add to Cart")',
  cartTotal: '[data-testid="total"]',
  // ... 50+ more selectors
};

// In tests
await page.click(posSelectors.addToCartButton);
```

### 3. Smart Fixtures

Pre-configured test fixtures for common scenarios:

```typescript
test('example', async ({
  loginPage,           // LoginPage instance
  posPage,             // POSPage instance
  creditsPage,         // CreditsPage instance
  authenticatedPage    // Already logged in!
}) => {
  // Test code here
});
```

### 4. Comprehensive Test Data

Centralized test data for consistency:

```typescript
export const testUsers = {
  admin: { username: 'admin', password: 'admin123', ... },
  cashier: { username: 'cashier', password: 'cashier123', ... },
  // ... more users
};

export const testCustomers = {
  customer1: { id: 'CUST001', name: 'John Doe', ... },
  // ... more customers
};

export const testProducts = {
  product1: { name: 'Hammer', code: 'PROD001', price: 299.99, ... },
  // ... more products
};
```

### 5. Rich Helper Utilities

30+ utility functions for common operations:

```typescript
// Assertions
assertElementVisible(page, selector)
assertElementText(page, selector, text)
assertInputValue(page, selector, value)

// Wait functions
waitAndClick(page, selector)
waitAndFill(page, selector, value)
waitForAPIResponse(page, urlPattern)

// Utilities
parseCurrency(value)           // "₱100.50" → 100.50
formatCurrency(value)          // 100.50 → "₱100.50"
generateRandomEmail()
generateRandomCustomerId()
```

## Test Suites

### Login Tests (14 tests)
```
✅ Display login form elements
✅ Successfully login with valid credentials
✅ Login as different user roles
✅ Error handling for invalid credentials
✅ Form field clearing
✅ Submit by pressing Enter
✅ Case sensitivity validation
✅ Redirect to login for protected routes
✅ Password masking
✅ No credentials in URL
✅ Invalid session token handling
✅ Form validation for empty fields
✅ Whitespace trimming
```

### POS Tests (24 tests)
```
Session Management:
  ✅ Create new session
  ✅ Switch between sessions
  ✅ Maintain separate carts

Product Selection & Cart:
  ✅ Add product to cart
  ✅ Add multiple products
  ✅ Update product quantity
  ✅ Remove product from cart
  ✅ Calculate cart totals
  ✅ Display empty cart message

Discounts:
  ✅ Apply fixed discount
  ✅ Apply percentage discount

Payment - Cash:
  ✅ Complete cash payment
  ✅ Calculate change correctly
  ✅ Validate sufficient payment

Payment - Card:
  ✅ Complete card payment

Payment - Credit:
  ✅ Complete credit payment
  ✅ Show credit warning for high balance

Receipts:
  ✅ Display receipt after payment
  ✅ Print receipt
  ✅ Download receipt
  ✅ Start new transaction

Warnings & Alerts:
  ✅ Show low stock warning
  ✅ Show credit limit warning

Complete Workflow:
  ✅ Full POS transaction workflow
```

### Credits Tests (30 tests)
```
Customer Search:
  ✅ Search customer by ID
  ✅ Clear search results
  ✅ Show empty state
  ✅ Handle multiple searches

Credit Status Display:
  ✅ Display credit status card
  ✅ Show outstanding balance
  ✅ Show total credit
  ✅ Show total settled amount
  ✅ Show transaction count
  ✅ Display settlement progress
  ✅ Show credit status text

Transactions List:
  ✅ Display credit transactions
  ✅ Count transactions
  ✅ Display transaction details
  ✅ Select transaction

Settlement Form:
  ✅ Display settlement form
  ✅ Enter settlement amount
  ✅ Select payment method
  ✅ Enter settlement notes

Settlement Operations:
  ✅ Complete full settlement with cash
  ✅ Complete full settlement with card
  ✅ Complete partial settlement
  ✅ Handle multiple payment methods
  ✅ Prevent invalid settlements

Tab Navigation:
  ✅ Switch to outstanding tab
  ✅ Switch to all transactions tab
  ✅ Switch to settled tab

Messages & Alerts:
  ✅ Show success message
  ✅ Handle loading state

Complete Workflow:
  ✅ Full credit settlement workflow
```

## Base Page Methods (25+ methods)

The `BasePage` class provides foundation for all page objects:

### Navigation
- `goto(path)` - Navigate to path
- `getCurrentUrl()` - Get current URL
- `waitForUrl(pattern)` - Wait for URL match
- `getTitle()` - Get page title
- `reload()` - Reload page
- `goBack()` - Go back in history

### Element Interaction
- `click(selector)` - Click element
- `clickLocator(locator)` - Click by locator
- `fillInput(selector, value)` - Fill input
- `fillLocator(locator, value)` - Fill by locator
- `typeText(selector, text, delay)` - Type slowly
- `getText(selector)` - Get text content
- `getTextLocator(locator)` - Get text by locator

### Element Queries
- `isElementVisible(selector)` - Is visible
- `isElementEnabled(selector)` - Is enabled
- `getAttribute(selector, attr)` - Get attribute
- `getAllText(selector)` - Get all text content
- `countElements(selector)` - Count elements

### Waiting & Visibility
- `waitForElement(selector, timeout)` - Wait for element
- `waitForLocator(locator, timeout)` - Wait for locator
- `waitForElements(selector, timeout)` - Wait for multiple
- `verifyElementVisible(selector)` - Assert visible

### Form Operations
- `selectOption(selector, value)` - Select dropdown
- `checkCheckbox(selector)` - Check checkbox
- `uncheckCheckbox(selector)` - Uncheck checkbox
- `isChecked(selector)` - Is checkbox checked
- `clearInput(selector)` - Clear input
- `getInputValue(selector)` - Get input value
- `focusElement(selector)` - Focus element

### Advanced
- `getLocator(selector)` - Get Playwright locator
- `hover(selector)` - Hover over element
- `doubleClick(selector)` - Double click
- `press(key)` - Press keyboard key
- `waitForNavigation(fn)` - Wait for navigation
- `screenshot(name)` - Take screenshot
- `scrollToElement(selector)` - Scroll to element
- `acceptDialog()` - Accept dialog
- `dismissDialog()` - Dismiss dialog
- `waitFor(ms)` - Wait milliseconds

## Running Tests

### Development Mode
```bash
# Interactive UI mode
npm run test:ui

# Debug mode with step-through
npm run test:debug

# Headed mode (see browser)
npm run test:headed
```

### CI/CD Mode
```bash
# Default (headless)
npm test

# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Mobile tests
npm run test:mobile
```

### Specific Tests
```bash
# Single file
npx playwright test specs/login.spec.ts

# By test name pattern
npx playwright test --grep "should complete cash payment"

# Specific test
npx playwright test specs/pos.spec.ts -g "Session Management"
```

## Test Reports

After running tests, view reports:

```bash
# View HTML report (interactive)
npm run test:report

# Reports generated in:
# - reports/html/        (HTML report)
# - reports/results.json (JSON results)
# - reports/junit.xml    (JUnit XML)
```

## Configuration

### Key Settings (`playwright.config.ts`)

```typescript
// Timeouts
timeout: 30000              // Test timeout (30s)
expect: { timeout: 5000 }   // Assertion timeout (5s)
actionTimeout: 10000        // Action timeout (10s)
navigationTimeout: 30000    // Navigation timeout (30s)

// Base URL
baseURL: 'http://localhost:5173'

// Retries
retries: 0              // No retries in dev
retries: 2              // 2 retries in CI

// Reports
reporter: ['html', 'json', 'junit', 'list']

// Browsers
projects: [
  'chromium',
  'firefox',
  'webkit',
  'Mobile Chrome',
  'Mobile Safari'
]
```

### TypeScript Paths (`tsconfig.json`)

```typescript
"paths": {
  "@pom/*": ["./pom/*"],
  "@selectors/*": ["./selectors/*"],
  "@fixtures/*": ["./fixtures/*"],
  "@utils/*": ["./utils/*"],
  "@data/*": ["./data/*"]
}
```

Usage:
```typescript
import { LoginPage } from '@pom/LoginPage';
import { posSelectors } from '@selectors/pos.selectors';
import { testUsers } from '@data/testData';
```

## Best Practices

### 1. Use Page Objects
```typescript
// ✅ Good - Clear and maintainable
await posPage.addProductToCart(productName, 1);
await posPage.completeCashPayment('500.00');

// ❌ Bad - Hard to maintain
await page.click('[data-testid="add-product"]');
await page.fill('input[name="amount"]', '500.00');
```

### 2. Separate Selectors
```typescript
// ✅ Good - Easy to update
export const posSelectors = {
  addToCartButton: 'button:has-text("Add to Cart")',
};

// ❌ Bad - Hardcoded
await page.click('button:has-text("Add to Cart")');
```

### 3. Use Test Data
```typescript
// ✅ Good - Consistent and maintainable
import { testUsers } from '@data/testData';
await loginPage.login(testUsers.cashier.username, testUsers.cashier.password);

// ❌ Bad - Hardcoded values
await loginPage.login('cashier', 'cashier123');
```

### 4. Use Fixtures
```typescript
// ✅ Good - Already logged in
test('example', async ({ posPage, authenticatedPage }) => {
  await posPage.goto();
});

// ❌ Bad - Manual login in every test
test('example', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login(...);
});
```

### 5. Smart Waits
```typescript
// ✅ Good - Wait for specific element
await posPage.waitForElement(posSelectors.receiptViewer);

// ❌ Bad - Fixed wait
await page.waitForTimeout(2000);
```

## Extending Tests

### Add New Page Object

1. Create file in `pom/NewPage.ts`:
```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { newPageSelectors } from '@selectors/newpage.selectors';

export class NewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await super.goto('/newpage');
  }

  async doSomething(): Promise<void> {
    await this.click(newPageSelectors.button);
  }
}
```

2. Create selectors in `selectors/newpage.selectors.ts`:
```typescript
export const newPageSelectors = {
  button: 'button[aria-label="Do Something"]',
  form: '[data-testid="form"]',
  // ... more selectors
};
```

3. Add fixture in `fixtures/testFixtures.ts`:
```typescript
import { NewPage } from '@pom/NewPage';

newPage: async ({ page }, use) => {
  const newPage = new NewPage(page);
  await use(newPage);
},
```

4. Use in tests:
```typescript
test('example', async ({ newPage }) => {
  await newPage.goto();
  await newPage.doSomething();
});
```

### Add New Test Suite

1. Create file `specs/feature.spec.ts`:
```typescript
import { expect } from '@playwright/test';
import { test } from '@fixtures/testFixtures';
import { testData } from '@data/testData';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ somePage }) => {
    await somePage.goto();
  });

  test('should do something', async ({ somePage }) => {
    await somePage.doAction();
    expect(true).toBeTruthy();
  });
});
```

## Troubleshooting

### Tests Timeout
**Problem:** `Test timeout of 30000ms exceeded`

**Solutions:**
- Increase timeout in `playwright.config.ts`
- Check if app is running: `http://localhost:5173`
- Verify backend is responding
- Check network connectivity
- Reduce number of tests per file

### Selector Not Found
**Problem:** `locator.click: Timeout 10000ms exceeded waiting for locator`

**Solutions:**
```bash
# Use debug mode to inspect
npm run test:debug

# Run with headed mode
npm run test:headed

# Check selector in browser console
npx playwright codegen http://localhost:5173
```

### Flaky Tests
**Problem:** Tests pass sometimes, fail other times

**Solutions:**
- Use `waitFor` instead of `waitForTimeout`
- Check for race conditions in assertions
- Increase timeouts
- Use `retry()` helper for unstable operations
- Check app performance

### API Failures
**Problem:** API calls failing in tests

**Solutions:**
- Verify backend is running
- Check authentication token
- Review CORS settings
- Check network tab in browser
- Mock API if needed

### Screenshot/Video Missing
**Problem:** No screenshots/videos in reports

**Solutions:**
- Check file permissions
- Verify disk space
- Check `playwright.config.ts` settings:
  ```typescript
  screenshot: 'only-on-failure'  // Capture on failure
  video: 'retain-on-failure'     // Keep videos on failure
  ```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install frontend dependencies
        run: npm install
        working-directory: frontend

      - name: Build frontend
        run: npm run build
        working-directory: frontend

      - name: Install backend dependencies
        run: go mod download
        working-directory: backend

      - name: Install test dependencies
        run: npm install
        working-directory: tests

      - name: Run E2E Tests
        run: npm test
        working-directory: tests
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: tests/reports/
```

## Resources

- [Playwright Docs](https://playwright.dev)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Debug Guide](https://playwright.dev/docs/debug)

## Support

For issues or questions:
1. Check this guide and README.md
2. Review test examples in `specs/`
3. Check Playwright documentation
4. Review application code
5. Enable debug mode: `npm run test:debug`

---

**Last Updated:** 2025-10-24
**Test Framework:** Playwright 1.48.0
**Total Tests:** 68
**Page Objects:** 4
**Selectors:** 150+
**Test Data Sets:** 15+
