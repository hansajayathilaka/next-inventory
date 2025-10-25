import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pom/LoginPage';
import { POSPage } from '../pom/POSPage';
import { CreditsPage } from '../pom/CreditsPage';
import { testUsers } from '../data/testData';

/**
 * Custom Test Fixtures
 * Provides pre-configured page objects and authenticated pages for tests
 */

type TestFixtures = {
  loginPage: LoginPage;
  posPage: POSPage;
  creditsPage: CreditsPage;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  /**
   * LoginPage Fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * POSPage Fixture
   */
  posPage: async ({ page }, use) => {
    const posPage = new POSPage(page);
    await use(posPage);
  },

  /**
   * CreditsPage Fixture
   */
  creditsPage: async ({ page }, use) => {
    const creditsPage = new CreditsPage(page);
    await use(creditsPage);
  },

  /**
   * Authenticated Page Fixture
   * Pre-logs in as a cashier user
   */
  authenticatedPage: async ({ page, loginPage }, use) => {
    // Navigate to login page
    await loginPage.goto();

    // Wait for username input to be visible
    await loginPage.isLoginFormVisible();

    // Perform login with cashier credentials (using username, not email)
    await loginPage.login(testUsers.cashier.username, testUsers.cashier.password);

    // Wait for login to complete
    await loginPage.waitForLoginComplete();

    // Verify we're logged in (away from login page)
    const url = page.url();
    if (url.includes('/login')) {
      throw new Error('Login failed - still on login page');
    }

    // Use the authenticated page in tests
    await use(page);
  },
});

export { expect } from '@playwright/test';
