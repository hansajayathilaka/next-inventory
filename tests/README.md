# Hardware Store POS - E2E Test Suite

Comprehensive end-to-end testing for the Hardware Store POS and Inventory System using Playwright with Page Object Model pattern.

## Project Structure

```
tests/
├── specs/                 # Test specifications
│   ├── login.spec.ts     # Login functionality tests
│   ├── pos.spec.ts       # Point of Sale system tests
│   └── credits.spec.ts   # Credits management tests
├── pom/                  # Page Object Models
│   ├── BasePage.ts       # Base class with common methods
│   ├── LoginPage.ts      # Login page object
│   ├── POSPage.ts        # POS page object
│   └── CreditsPage.ts    # Credits page object
├── selectors/            # Selector storage
│   ├── login.selectors.ts
│   ├── pos.selectors.ts
│   ├── credits.selectors.ts
│   └── navigation.selectors.ts
├── fixtures/             # Test fixtures and setup
│   └── testFixtures.ts   # Playwright fixtures with POM instances
├── utils/                # Utility functions
│   └── testHelpers.ts    # Common helper functions
├── data/                 # Test data
│   └── testData.ts       # Test users, products, customers data
└── playwright.config.ts  # Playwright configuration
```

## Installation

### Prerequisites
- Node.js 16+ installed
- Frontend application running on `http://localhost:5173`
- Backend API available for authentication

### Setup

1. **Install dependencies:**
```bash
cd tests
npm install
```

2. **Configure environment (optional):**
Create `.env` file if needed for custom settings:
```
BASE_URL=http://localhost:5173
HEADLESS=true
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run tests with specific browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run mobile tests
```bash
npm run test:mobile
```

### Run tests in headed mode (visible browser)
```bash
npm run test:headed
```

### Run specific test file
```bash
npx playwright test specs/login.spec.ts
```

### Run tests matching pattern
```bash
npx playwright test --grep "should complete cash payment"
```

### View test report
```bash
npm run test:report
```

## Test Organization

### Test Suites

#### 1. **Login Tests** (`specs/login.spec.ts`)
- ✅ Login form display and validation
- ✅ Successful login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Form field clearing and manipulation
- ✅ Security tests (password masking, URL safety)
- ✅ Form validation rules
- ✅ Session token validation

**Test Categories:**
- Login Functionality (8 tests)
- Login Security (3 tests)
- Login Form Validation (3 tests)

#### 2. **POS Tests** (`specs/pos.spec.ts`)
- ✅ Multi-session management
- ✅ Product selection and cart operations
- ✅ Discount application (fixed and percentage)
- ✅ Payment processing (cash, card, credit)
- ✅ Receipt generation and management
- ✅ Warnings and alerts
- ✅ Complete transaction workflows

**Test Categories:**
- Session Management (3 tests)
- Product Selection and Cart (6 tests)
- Discounts (2 tests)
- Payment Processing - Cash (3 tests)
- Payment Processing - Card (1 test)
- Payment Processing - Credit (2 tests)
- Receipt Management (4 tests)
- Warnings and Alerts (2 tests)
- Complete Workflow (1 test)

#### 3. **Credits Tests** (`specs/credits.spec.ts`)
- ✅ Customer credit search
- ✅ Credit status display
- ✅ Credit transactions list
- ✅ Settlement form operations
- ✅ Full and partial settlements
- ✅ Different payment methods
- ✅ Tab navigation
- ✅ Success/error messages

**Test Categories:**
- Customer Credit Search (4 tests)
- Credit Status Display (7 tests)
- Credit Transactions List (4 tests)
- Settlement Form (4 tests)
- Settlement Operations (5 tests)
- Tab Navigation (3 tests)
- Messages and Alerts (2 tests)
- Complete Workflow (1 test)

## Page Object Model Pattern

### Base Page (`pom/BasePage.ts`)

Common methods available to all page objects:

**Navigation:**
- `goto(path)` - Navigate to path
- `getCurrentUrl()` - Get current URL
- `getTitle()` - Get page title

**Element Interaction:**
- `click(selector)` - Click element
- `fillInput(selector, value)` - Fill input field
- `typeText(selector, text)` - Type text slowly
- `getText(selector)` - Get text content
- `getAttribute(selector, attribute)` - Get attribute value

**Element Visibility:**
- `isElementVisible(selector)` - Check if visible
- `waitForElement(selector, timeout)` - Wait for element
- `verifyElementVisible(selector)` - Assert element visible

**Form Operations:**
- `selectOption(selector, value)` - Select dropdown option
- `checkCheckbox(selector)` - Check checkbox
- `uncheckCheckbox(selector)` - Uncheck checkbox
- `isChecked(selector)` - Check if checkbox is checked
- `clearInput(selector)` - Clear input field
- `getInputValue(selector)` - Get input value

**Utilities:**
- `hover(selector)` - Hover over element
- `doubleClick(selector)` - Double click element
- `screenshot(name)` - Take screenshot
- `waitFor(ms)` - Wait for milliseconds
- `reload()` - Reload page

### Page Objects

#### LoginPage
```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(username, password);
await loginPage.waitForLoginComplete();
```

#### POSPage
```typescript
const posPage = new POSPage(page);
await posPage.goto();
await posPage.createNewSession();
await posPage.addProductToCart(productName, quantity);
await posPage.completeCashPayment(amount);
```

#### CreditsPage
```typescript
const creditsPage = new CreditsPage(page);
await creditsPage.goto();
await creditsPage.searchCustomerById(customerId);
await creditsPage.completeFullSettlement(paymentMethod);
```

## Selectors Storage

All selectors are stored in separate files for easy maintenance:

- `selectors/login.selectors.ts` - Login page selectors
- `selectors/pos.selectors.ts` - POS page selectors
- `selectors/credits.selectors.ts` - Credits page selectors
- `selectors/navigation.selectors.ts` - Navigation selectors

Benefits:
- ✅ Single source of truth for selectors
- ✅ Easy to update selectors if UI changes
- ✅ Better maintainability
- ✅ No hardcoded selectors in tests

## Test Fixtures

Custom Playwright fixtures for common test setup:

```typescript
test('example', async ({ loginPage, posPage, authenticatedPage }) => {
  // loginPage - LoginPage instance
  // posPage - POSPage instance
  // authenticatedPage - Page already logged in as cashier
});
```

### Available Fixtures:
- `loginPage` - LoginPage instance
- `posPage` - POSPage instance
- `creditsPage` - CreditsPage instance
- `authenticatedPage` - Pre-authenticated page (logged in as cashier)

## Test Data

Centralized test data in `data/testData.ts`:

```typescript
import { testUsers, testCustomers, testProducts } from '@data/testData';

// Access test data
testUsers.admin
testCustomers.customer1
testProducts.product1
```

### Test Data Available:
- **Test Users:** admin, cashier, manager, staff
- **Test Customers:** customer1, customer2, customer3
- **Test Products:** product1, product2, product3, product4
- **Test Payments:** cash, card, credit payment examples
- **Test Settlements:** full and partial settlement examples

## Helper Utilities

Common utilities in `utils/testHelpers.ts`:

**Assertions:**
- `assertElementVisible(page, selector)`
- `assertElementText(page, selector, text)`
- `assertInputValue(page, selector, value)`
- `assertElementEnabled(page, selector)`

**Wait Functions:**
- `waitAndClick(page, selector)`
- `waitAndFill(page, selector, value)`
- `waitForElementWithText(page, selector, text)`

**Network:**
- `waitForAPIResponse(page, urlPattern)`
- `waitForAPIRequest(page, urlPattern)`
- `mockAPIResponse(page, urlPattern, data)`

**Utilities:**
- `parseCurrency(value)` - Parse "₱100.50" to 100.50
- `formatCurrency(value)` - Format 100.50 to "₱100.50"
- `generateRandomEmail()` - Generate random email
- `generateRandomCustomerId()` - Generate random customer ID
- `takeScreenshot(page, name)` - Take screenshot with timestamp
- `retry(action, maxRetries)` - Retry action with backoff

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Base URL:** `http://localhost:5173`
- **Test Directory:** `./specs`
- **Test Timeout:** 30 seconds
- **Expect Timeout:** 5 seconds
- **Retry Policy:** 0 retries (1 on CI)
- **Report:** HTML, JSON, JUnit XML

### Browsers Configured:
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### Reporters:
- HTML report in `reports/html/`
- JSON results in `reports/results.json`
- JUnit XML in `reports/junit.xml`

## Best Practices

### 1. Use Page Object Model
```typescript
// ✅ Good
await posPage.addProductToCart(productName, quantity);

// ❌ Bad
await page.click('[data-testid="product-item"]');
```

### 2. Use Centralized Selectors
```typescript
// ✅ Good
import { posSelectors } from '@selectors/pos.selectors';
await page.click(posSelectors.addToCartButton);

// ❌ Bad
await page.click('[data-testid="add-to-cart"]');
```

### 3. Use Fixtures
```typescript
// ✅ Good
test('example', async ({ posPage, authenticatedPage }) => {
  // Page is already logged in
});

// ❌ Bad
test('example', async ({ page }) => {
  // Need to manually log in
});
```

### 4. Use Test Data
```typescript
// ✅ Good
import { testUsers } from '@data/testData';
await loginPage.login(testUsers.admin.username, testUsers.admin.password);

// ❌ Bad
await loginPage.login('hardcoded-user', 'hardcoded-password');
```

### 5. Wait for Elements Properly
```typescript
// ✅ Good
await page.locator(selector).waitFor({ timeout: 5000 });

// ❌ Bad
await page.waitForTimeout(2000); // Fixed wait
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if app is running on correct port
- Verify network connectivity

### Selector Not Found
- Check if selector is correct in selectors file
- Verify element exists in DOM
- Use `npx playwright test --debug` to inspect

### API Calls Failing
- Ensure backend is running
- Check CORS configuration
- Verify authentication tokens are valid

### Screenshots/Videos Not Generated
- Check reports directory permissions
- Verify config settings for screenshots/videos
- Ensure disk space available

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd tests
    npm install
    npm test
  env:
    CI: true
```

## Contributing

When adding new tests:

1. **Create new page object** if needed in `pom/`
2. **Add selectors** to `selectors/` (separate files)
3. **Create test spec** in `specs/`
4. **Use existing fixtures** and test data
5. **Follow naming conventions** (descriptive test names)
6. **Add comments** for complex test scenarios
7. **Update this README** with new test suite info

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debug Guide](https://playwright.dev/docs/debug)

## License

Same as main project
