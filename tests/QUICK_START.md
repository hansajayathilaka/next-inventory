# Playwright E2E Tests - Quick Start Guide

## Overview

This directory contains Playwright E2E tests for the Hardware Store POS system using the Page Object Model pattern.

## File Structure

```
tests/
├── specs/
│   ├── happy-path.spec.ts      # Simple happy-path workflow tests (START HERE)
│   ├── login.spec.ts           # Login functionality tests (needs selector fixes)
│   ├── pos.spec.ts             # POS operations tests (needs selector fixes)
│   └── credits.spec.ts         # Credits management tests (needs selector fixes)
├── pom/
│   ├── BasePage.ts             # Base page object with common methods
│   ├── LoginPage.ts            # Login page object
│   ├── POSPage.ts              # POS page object
│   └── CreditsPage.ts          # Credits page object
├── selectors/
│   ├── login.selectors.ts      # Fixed selectors for login page
│   ├── pos.selectors.ts        # POS page selectors
│   ├── credits.selectors.ts    # Credits page selectors
│   └── navigation.selectors.ts # Navigation selectors
├── fixtures/
│   └── testFixtures.ts         # Custom Playwright fixtures
├── data/
│   └── testData.ts             # Test data (users, customers, products)
├── utils/
│   └── testHelpers.ts          # Helper utilities
└── playwright.config.ts        # Playwright configuration
```

## Quick Start

### 1. Install Dependencies

```bash
cd tests
npm install
npx playwright install  # Install Chromium browser
```

### 2. Start the Application

In separate terminals:

```bash
# Terminal 1 - Start frontend
cd frontend
npm run dev

# Terminal 2 - Start backend (if needed)
cd backend
go run ./cmd/server
```

### 3. Run Tests

```bash
# From tests directory
cd tests

# Run happy-path tests (RECOMMENDED FIRST)
npx playwright test specs/happy-path.spec.ts

# Run all tests
npm test

# Run in UI mode (recommended for development)
npm run test:ui

# Run specific test file
npx playwright test specs/login.spec.ts

# Debug mode
npm run test:debug
```

## Test Coverage

### Happy Path Tests (9 tests - WORKING)
Located in `specs/happy-path.spec.ts`
- Load login page
- Display login form elements
- Show error on invalid login
- Login with valid cashier credentials ✅
- Access POS page after login
- Display POS interface components
- Allow logout
- Maintain session after refresh
- Handle different user roles (admin, manager)

### Login Tests (9 tests - NEEDS SELECTOR UPDATES)
Located in `specs/login.spec.ts`
- Currently failing due to selector mismatches
- Selectors updated in `selectors/login.selectors.ts`
- Need to verify against running UI

### POS Tests (12 tests - NEEDS SELECTOR UPDATES)
Located in `specs/pos.spec.ts`
- Currently failing due to selector mismatches
- Need selectors for product selector, cart, etc.

### Credits Tests (16 tests - NEEDS SELECTOR UPDATES)
Located in `specs/credits.spec.ts`
- Currently failing due to selector mismatches
- Need selectors for credit search, settlement, etc.

## Test Data

Default test users (from `backend/seeders/data/staff.json`):

```
Admin:
  Email: admin@hardware-store.local
  Password: Admin@123456

Manager:
  Email: john.manager@hardware-store.local
  Password: Manager@123456

Cashier:
  Email: sarah.jones@hardware-store.local
  Password: Cashier@123456
```

## Debugging Selectors

The original tests use Page Object Models with selectors from `tests/selectors/`. If tests fail due to selector mismatches:

### Option 1: Interactive UI Mode (RECOMMENDED)
```bash
npm run test:ui
```
This opens an interactive browser where you can:
- Inspect elements in real-time
- Pause test execution
- See which selectors fail
- Update selectors in real-time

### Option 2: Debug Mode
```bash
npm run test:debug
```
Opens Playwright Inspector with the ability to:
- Step through tests
- Inspect elements
- View network requests

### Option 3: Codegen
```bash
npm run test:codegen
```
Records your actions and generates test code automatically.

## Fixing Failing Tests

When tests fail, they're usually due to selector mismatches. To fix:

1. **Run in UI mode**: `npm run test:ui`
2. **Inspect the failing element** in the browser
3. **Note the actual selector** (data-testid, class name, placeholder, etc.)
4. **Update the selector** in the appropriate file under `tests/selectors/`
5. **Re-run the test** to verify fix

### Updated Selectors (already fixed in code):

**Login Page** (`tests/selectors/login.selectors.ts`):
```typescript
usernameInput: 'input[placeholder="Enter username"]'
passwordInput: 'input[placeholder="Enter password"]'
submitButton: 'button[type="submit"]'
formError: '[role="alert"]'
```

## Running Tests in CI/CD

Set environment variable `CI=true` before running:

```bash
CI=true npm test
```

This enables:
- Automatic retries (2 attempts)
- Headless mode
- HTML reports

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npm run test:report
```

This opens an interactive HTML report showing:
- Test results
- Screenshots (on failure)
- Videos (on failure)
- Detailed error messages

## Troubleshooting

### Tests Won't Run
1. Verify frontend is running: `http://localhost:5173`
2. Check Chromium is installed: `npx playwright install chromium`
3. Clear node_modules: `rm -rf node_modules && npm install`

### Selectors Not Found
1. Open UI mode: `npm run test:ui`
2. Inspect the element in browser
3. Update selector in corresponding `tests/selectors/*.ts` file
4. Re-run test

### Timeouts
- Increase timeout in `playwright.config.ts`
- Check if application is responding slowly
- Verify network connectivity

### Port Already in Use
If port 5173 is already in use:
1. Kill the process: `lsof -i :5173` and `kill -9 <PID>`
2. Or change base URL in `playwright.config.ts`

## Next Steps

1. **Start with happy-path tests**: `npx playwright test specs/happy-path.spec.ts`
2. **Fix selector mismatches** in failing tests using UI mode
3. **Create new tests** following the POM pattern
4. **Integrate into CI/CD** pipeline

## Page Object Model Pattern

All tests use POM for maintainability:

```typescript
// Don't do this (direct selectors):
await page.click('input[name="email"]');

// Do this (page object methods):
const loginPage = new LoginPage(page);
await loginPage.fillEmail('user@example.com');
```

Benefits:
- Selectors centralized in one place
- Easy to maintain when UI changes
- Tests are more readable
- Easy to reuse across test files

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Questions?

Check the comprehensive documentation:
- `../specs/001-initial-pos-system/constitution.md` - Testing standards
- `../PLAYWRIGHT_TESTING_IMPLEMENTATION.md` - Implementation details

---

**Last Updated**: 2025-10-24
