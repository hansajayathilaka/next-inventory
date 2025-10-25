# Project Constitution: Hardware Store POS and Inventory System

## Overview

This document establishes the foundational principles, standards, and testing requirements for the Hardware Store POS and Inventory System project. All development must conform to these guidelines.

---

## I. Architectural Principles

### 1. Separation of Concerns
- **Frontend**: React/TypeScript with Vite (UI rendering, user interaction)
- **Backend**: Go with Gin framework (API, business logic, data persistence)
- **Database**: SQLite (single file, easy deployment)

### 2. Design Patterns
- **Page Object Model (POM)**: For test organization and maintainability
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Custom React Hooks**: State and side-effect management

### 3. Code Organization
- Backend: `internal/models`, `internal/services`, `internal/handlers`, `internal/repositories`
- Frontend: `src/components`, `src/pages`, `src/services`, `src/hooks`, `src/stores`
- Tests: `tests/specs`, `tests/pom`, `tests/selectors`, `tests/fixtures`, `tests/data`, `tests/utils`

---

## II. Testing Standards

### A. Test Philosophy

**Priority**: Happy path workflows first, then edge cases
- Focus on user workflows that demonstrate core functionality
- Tests should validate complete transactions from start to finish
- Simple, readable tests that don't require deep frontend/backend knowledge

### B. Testing Framework

**Frontend E2E Tests**: Playwright
- Framework: `@playwright/test` ^1.48.0
- Configuration: `tests/playwright.config.ts`
- Test Runner: `npm test` (from tests directory)
- Browser Support: Chromium (primary), Firefox/WebKit (optional)

### C. Page Object Model (POM) Requirements

All Playwright tests **MUST** use Page Object Model pattern:

```
tests/
├── pom/                      # Page objects
│   ├── BasePage.ts          # Base class with common methods
│   ├── LoginPage.ts
│   ├── POSPage.ts
│   ├── CreditsPage.ts
│   └── [Page]Page.ts        # One per major page
├── selectors/               # Centralized selectors
│   ├── login.selectors.ts
│   ├── pos.selectors.ts
│   ├── credits.selectors.ts
│   └── navigation.selectors.ts
├── specs/                   # Test specifications
│   ├── login.spec.ts        # Login workflow tests
│   ├── pos.spec.ts          # POS workflow tests
│   └── credits.spec.ts      # Credits workflow tests
├── fixtures/                # Playwright fixtures
│   └── testFixtures.ts      # Custom fixtures with POM instances
├── data/                    # Test data
│   └── testData.ts          # Users, customers, products
├── utils/                   # Helper utilities
│   └── testHelpers.ts       # Common functions
└── playwright.config.ts     # Playwright configuration
```

### D. Selector Management

**Rule**: No hardcoded selectors in test files
- All selectors stored in `tests/selectors/[page].selectors.ts`
- Selectors use: `data-testid`, `placeholder`, `aria-label`, semantic HTML
- Updates to selectors do not require test file changes

**Selector Priority** (in order):
1. `data-testid` attributes (most reliable)
2. `aria-label` (semantic, accessible)
3. `placeholder` (for form inputs)
4. CSS selectors (as fallback)
5. XPath (last resort only)

### E. Test Organization

Each test file should follow this structure:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ fixture }) => {
    // Setup before each test
  });

  test('should do something specific', async ({ fixtures }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### F. Test Naming Conventions

- **Descriptive**: `should display login form` ✅
- **Not**: `test login` ❌
- Start with `should` for clarity
- Include expected behavior, not just action
- Be specific about what is being tested

### G. Test Data Management

**Rule**: Use centralized test data from `tests/data/testData.ts`
- No hardcoded credentials in tests
- Test data sourced from `backend/seeders/data/*.json`
- Keep test data realistic and representative

```typescript
import { testUsers, testCustomers, testProducts } from '@data/testData';

test('example', async ({ loginPage }) => {
  await loginPage.login(testUsers.cashier.email, testUsers.cashier.password);
});
```

### H. Fixture Usage

**Rule**: Use custom Playwright fixtures for common patterns

Available fixtures:
- `loginPage`: LoginPage instance
- `posPage`: POSPage instance
- `creditsPage`: CreditsPage instance
- `authenticatedPage`: Pre-logged-in page (as cashier)

```typescript
test('example', async ({ authenticatedPage, posPage }) => {
  // Page is already authenticated
  await posPage.goto();
});
```

### I. Test Coverage Requirements

**Minimum Coverage** (for MVP workflows):
- Login: Basic functionality, error cases, multiple user roles
- POS: Session management, cart operations, payments, discounts
- Credits: Customer search, credit status, settlement operations

**Workflow Testing** (happy path):
1. **Login Workflow**: Authenticate with valid credentials
2. **POS Workflow**: Create session → Add products → Apply discount → Complete payment → View receipt
3. **Credits Workflow**: Search customer → View credit status → Process settlement

### J. Assertion Standards

Use Playwright built-in assertions:

```typescript
// ✅ Good
expect(isVisible).toBe(true);
await expect(locator).toBeVisible();
await expect(locator).toContainText('Expected text');

// ❌ Avoid
if (someCondition) { /* manual check */ }
```

### K. Wait Strategies

**Use implicit waits**:
- `locator.waitFor({ state: 'visible', timeout: 5000 })`
- `page.waitForURL(pattern)`
- `page.waitForTimeout(milliseconds)` for specific scenarios

**Avoid**:
- Fixed delays without necessity
- Polling in tests

### L. Error Handling in Tests

**Rule**: Tests should fail with clear error messages

```typescript
test('example', async ({ loginPage, page }) => {
  const currentUrl = page.url();
  expect(currentUrl).not.toContain('/login');  // Clear expectation
});
```

---

## III. Test Execution

### A. Local Development

```bash
# Install dependencies
cd tests
npm install

# Run all tests
npm test

# Run specific test file
npx playwright test specs/login.spec.ts

# Run tests in UI mode
npm run test:ui

# Debug mode
npm run test:debug
```

### B. Test Configuration

Key settings in `playwright.config.ts`:
- **Base URL**: `http://localhost:5173` (frontend)
- **Test Directory**: `./specs`
- **Timeout**: 30 seconds per test
- **Expect Timeout**: 5 seconds per assertion
- **Screenshot**: On failure only
- **Video**: On failure only

### C. CI/CD Integration

Tests run automatically on:
- Pre-commit hooks (if configured)
- Pull requests
- Main branch commits

Test environment variables (if needed):
- `CI=true`: Enables retries and headless mode
- Custom `BASE_URL`: Can override default

---

## IV. Code Quality Standards

### A. TypeScript

- Strict mode enabled
- All page objects, fixtures, and utilities must be TypeScript
- Use interfaces for structured data
- No `any` types without justification

### B. Component Testing

Backend and frontend components:
- Must be testable in isolation
- Use dependency injection
- Provide proper error messages
- Include validation and edge cases

### C. API Contract Testing

- Tests validate API responses match expected types
- Response status codes verified
- Error scenarios covered

---

## V. Maintenance and Updates

### A. When Frontend UI Changes

1. Update selectors in `tests/selectors/[page].selectors.ts`
2. Page object methods stay the same if behavior unchanged
3. No test file changes needed if POM is used correctly

### B. When Test Data Changes

1. Update `tests/data/testData.ts`
2. Update seed data in `backend/seeders/data/`
3. Re-seed database if needed

### C. When Adding New Workflows

1. Create new page object in `tests/pom/[Page]Page.ts`
2. Add selectors to `tests/selectors/[page].selectors.ts`
3. Create test spec in `tests/specs/[feature].spec.ts`
4. Update test data if needed
5. Run tests to validate

---

## VI. Best Practices

### ✅ Do

- Write clear, descriptive test names
- Use page objects for all interactions
- Test complete user workflows
- Keep tests independent (can run in any order)
- Use fixtures for common setup
- Update selectors when UI changes (not test logic)
- Group related tests with `test.describe()`

### ❌ Don't

- Hardcode selectors in tests
- Create dependencies between tests
- Use fixed delays instead of waiting for elements
- Test implementation details (only test behavior)
- Ignore test failures in CI
- Commit broken tests
- Mix different concerns in one test file

---

## VII. Success Criteria

### For Test Implementation

- [ ] All tests use Page Object Model
- [ ] No hardcoded selectors in test files
- [ ] All test data centralized
- [ ] Tests are readable and descriptive
- [ ] Tests can run independently
- [ ] Tests validate happy path workflows
- [ ] Error cases are covered
- [ ] Tests pass consistently (no flakiness)

### For Coverage

- [ ] Login workflow: 8+ tests
- [ ] POS workflow: 10+ tests
- [ ] Credits workflow: 10+ tests
- [ ] All major features have happy path coverage
- [ ] Error handling validated

---

## VIII. Tools and Resources

### Documentation
- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Local Testing
- Playwright Inspector: `npm run test:debug`
- Test Reports: `npm run test:report`
- Code Generation: `npm run test:codegen`

### CI/CD
- All tests must pass before merge
- Tests run on multiple browsers
- Coverage reports generated

---

## Appendix A: Test Template

```typescript
import { test, expect } from '../fixtures/testFixtures';
import { testUsers, testCustomers } from '../data/testData';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to feature
  });

  test('should do something specific', async ({ page, posPage }) => {
    // Arrange - setup test data

    // Act - perform user action
    await posPage.performAction();

    // Assert - verify result
    expect(result).toBe(expected);
  });
});
```

---

## Appendix B: Page Object Template

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { pageSelectors } from '@selectors/page.selectors';

export class PageName extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/path');
  }

  // High-level methods describing user actions
  async performAction() {
    // Implementation
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Status**: Active
