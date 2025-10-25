# Playwright E2E Tests - Quick Reference

## ⚡ Quick Start

```bash
# Install
cd tests && npm install

# Run tests
npm test                    # Run all tests
npm run test:ui            # Interactive mode
npm run test:debug         # Debug mode
npm run test:headed        # See browser
npm run test:report        # View HTML report
```

## 📊 Test Statistics

| Metric | Count |
|--------|-------|
| Total Tests | 204 |
| Test Variations (5 browsers) | 1,020 |
| Test Suites | 3 |
| Page Objects | 4 |
| Selectors | 150+ |
| Helper Functions | 30+ |
| Test Data Sets | 15+ |

## 📁 Key Files

### Test Specs
- `specs/login.spec.ts` - 14 login tests
- `specs/pos.spec.ts` - 24 POS tests
- `specs/credits.spec.ts` - 30 credit tests

### Page Objects
- `pom/BasePage.ts` - Base class (25+ methods)
- `pom/LoginPage.ts` - Login interactions (9 methods)
- `pom/POSPage.ts` - POS interactions (30+ methods)
- `pom/CreditsPage.ts` - Credits interactions (25+ methods)

### Selectors
- `selectors/login.selectors.ts` - Login selectors (12)
- `selectors/pos.selectors.ts` - POS selectors (50+)
- `selectors/credits.selectors.ts` - Credits selectors (40+)
- `selectors/navigation.selectors.ts` - Navigation (25+)

### Utilities & Fixtures
- `utils/testHelpers.ts` - 30+ helper functions
- `fixtures/testFixtures.ts` - Pre-configured fixtures
- `data/testData.ts` - Test users, products, customers

## 🎯 Common Commands

```bash
# Run specific file
npx playwright test specs/login.spec.ts

# Run specific test
npx playwright test -g "should login"

# Run specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run mobile tests
npm run test:mobile

# Generate code
npm run test:codegen

# View report
npm run test:report
```

## 📖 Using Page Objects

```typescript
test('example', async ({ loginPage, posPage, authenticatedPage }) => {
  // Login page
  await loginPage.goto();
  await loginPage.login(username, password);

  // POS page
  await posPage.goto();
  await posPage.addProductToCart(productName, quantity);
  await posPage.completeCashPayment(amount);

  // Already logged in
  await posPage.processPayment();
});
```

## 🔍 Using Selectors

```typescript
// ✅ Good - Centralized
import { posSelectors } from '@selectors/pos.selectors';
await page.click(posSelectors.addToCartButton);

// ❌ Bad - Hardcoded
await page.click('button:has-text("Add to Cart")');
```

## 📋 Using Test Data

```typescript
import { testUsers, testProducts } from '@data/testData';

await loginPage.login(testUsers.cashier.username, testUsers.cashier.password);
await posPage.addProductToCart(testProducts.product1.name, 1);
```

## 🛠️ Using Fixtures

```typescript
// Pre-configured fixtures available:
test('example', async ({
  loginPage,         // LoginPage instance
  posPage,           // POSPage instance
  creditsPage,       // CreditsPage instance
  authenticatedPage  // Already logged in as cashier
}) => {
  // Test code
});
```

## 🎨 BasePage Methods

### Navigation
```typescript
await page.goto(path)
await page.getCurrentUrl()
await page.getTitle()
await page.reload()
```

### Interaction
```typescript
await page.click(selector)
await page.fillInput(selector, value)
await page.getText(selector)
await page.typeText(selector, text)
```

### Waiting
```typescript
await page.waitForElement(selector, timeout)
await page.waitForLocator(locator, timeout)
await page.verifyElementVisible(selector)
```

### Forms
```typescript
await page.selectOption(selector, value)
await page.checkCheckbox(selector)
await page.getInputValue(selector)
await page.clearInput(selector)
```

## �� Helper Utilities

### Assertions
```typescript
assertElementVisible(page, selector)
assertElementText(page, selector, text)
assertInputValue(page, selector, value)
assertElementEnabled(page, selector)
```

### Wait Functions
```typescript
waitAndClick(page, selector)
waitAndFill(page, selector, value)
waitForElementWithText(page, selector, text)
waitForAPIResponse(page, urlPattern)
```

### Utilities
```typescript
parseCurrency(value)              // "₱100.50" → 100.50
formatCurrency(value)             // 100.50 → "₱100.50"
generateRandomEmail()
generateRandomCustomerId()
takeScreenshot(page, name)
```

## 🔧 Configuration

### Playwright Config
```typescript
timeout: 30000              // Test timeout
expect.timeout: 5000        // Assertion timeout
baseURL: 'http://localhost:5173'
```

### TypeScript Paths
```typescript
"@pom/*": ["./pom/*"]
"@selectors/*": ["./selectors/*"]
"@fixtures/*": ["./fixtures/*"]
"@utils/*": ["./utils/*"]
"@data/*": ["./data/*"]
```

## 📱 Browsers

- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 📊 Test Suites

### Login Tests (14 tests)
- Form display & validation
- Authentication
- Error handling
- Security
- Session management

### POS Tests (24 tests)
- Session management (3)
- Product selection (6)
- Discounts (2)
- Payments (6)
- Receipts (4)
- Workflows (1)

### Credits Tests (30 tests)
- Customer search (4)
- Credit status (7)
- Transactions (4)
- Settlements (5)
- Navigation (3)
- Workflows (1)

## 🚀 Extending Tests

### Add New Page Object
```typescript
// pom/NewPage.ts
import { BasePage } from './BasePage';
export class NewPage extends BasePage {
  async goto() { await super.goto('/newpage'); }
  async doAction() { await this.click(newPageSelectors.button); }
}
```

### Add New Selectors
```typescript
// selectors/newpage.selectors.ts
export const newPageSelectors = {
  button: 'button:has-text("Do Something")',
  form: '[data-testid="form"]',
};
```

### Add New Test
```typescript
// specs/newpage.spec.ts
test('example', async ({ page }) => {
  const newPage = new NewPage(page);
  await newPage.goto();
  await newPage.doAction();
});
```

## 🐛 Debugging

```bash
# Debug mode - step through
npm run test:debug

# UI mode - interactive
npm run test:ui

# Headed mode - see browser
npm run test:headed

# Code generator
npm run test:codegen

# View failures
npm run test:report
```

## ⚙️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase `timeout` in config |
| App not found | Check `http://localhost:5173` |
| Selector not found | Use `npm run test:debug` |
| Flaky tests | Use `waitFor` instead of `waitForTimeout` |
| API failures | Check backend is running |

## 📚 Documentation

- [README.md](./README.md) - Detailed guide & best practices
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive reference
- [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) - Setup overview

## 🔗 Resources

- [Playwright Docs](https://playwright.dev)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)

---

**Status:** ✅ Ready to Use
**Framework:** Playwright 1.48.0
**Total Tests:** 204 (1,020 variations)
