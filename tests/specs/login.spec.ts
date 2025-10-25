import { test, expect } from '../fixtures/testFixtures';
import { testUsers } from '../data/testData';

test.describe('Login Workflow', () => {
  test.beforeEach(async ({ loginPage }) => {
    // Navigate to login page before each test
    await loginPage.goto();
  });

  test('should display login form', async ({ loginPage }) => {
    // Verify login form is visible
    const isFormVisible = await loginPage.isLoginFormVisible();
    expect(isFormVisible).toBe(true);
  });

  test('should login with valid credentials', async ({ loginPage, page }) => {
    // Fill in valid credentials
    await loginPage.fillUsername(testUsers.cashier.username);
    await loginPage.fillPassword(testUsers.cashier.password);

    // Submit the form
    await loginPage.submitForm();

    // Wait for successful login
    await loginPage.waitForLoginComplete();

    // Verify we're redirected away from login page
    const url = page.url();
    expect(!url.includes('/login')).toBe(true);
  });

  test('should display error on invalid password', async ({ loginPage }) => {
    // Fill in username and wrong password
    await loginPage.fillUsername(testUsers.cashier.username);
    await loginPage.fillPassword('WrongPassword123');

    // Submit the form
    await loginPage.submitForm();

    // Wait for error message to appear
    const errorMessage = loginPage.page.locator('[role="alert"]');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    // Verify error is displayed
    const hasError = await loginPage.hasFormError();
    expect(hasError).toBe(true);

    // Verify error text is not empty
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
  });

  test('should clear input fields on demand', async ({ loginPage }) => {
    // Fill in credentials
    await loginPage.fillUsername(testUsers.admin.username);
    await loginPage.fillPassword(testUsers.admin.password);

    // Verify fields are filled
    let usernameValue = await loginPage.getUsernameValue();
    expect(usernameValue).toBe(testUsers.admin.username);

    // Clear the fields
    await loginPage.clearUsername();
    await loginPage.clearPassword();

    // Verify fields are cleared
    usernameValue = await loginPage.getUsernameValue();
    expect(usernameValue).toBe('');

    const passwordValue = await loginPage.getPasswordValue();
    expect(passwordValue).toBe('');
  });

  test('should mask password input', async ({ loginPage }) => {
    // Fill in password
    await loginPage.fillPassword(testUsers.cashier.password);

    // Verify password is masked
    const isMasked = await loginPage.isPasswordMasked();
    expect(isMasked).toBe(true);
  });

  test('should submit form with Enter key', async ({ loginPage, page }) => {
    // Fill in credentials
    await loginPage.fillUsername(testUsers.cashier.username);
    await loginPage.fillPassword(testUsers.cashier.password);

    // Submit with Enter key
    await loginPage.loginWithEnter(testUsers.cashier.username, testUsers.cashier.password);

    // Wait for navigation
    await loginPage.waitForLoginComplete();

    // Verify we're logged in
    const url = page.url();
    expect(!url.includes('/login')).toBe(true);
  });

  test('should allow multiple login attempts', async ({ loginPage }) => {
    // First attempt with wrong password
    await loginPage.fillUsername(testUsers.cashier.username);
    await loginPage.fillPassword('WrongPassword');
    await loginPage.submitForm();

    // Wait for error message to appear
    const errorMessage = loginPage.page.locator('[role="alert"]');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    // Clear and try with correct password
    await loginPage.clearUsername();
    await loginPage.clearPassword();

    await loginPage.fillUsername(testUsers.cashier.username);
    await loginPage.fillPassword(testUsers.cashier.password);
    await loginPage.submitForm();

    // Wait for successful login
    await loginPage.waitForLoginComplete();

    // Verify successful login
    const url = loginPage.page.url();
    expect(!url.includes('/login')).toBe(true);
  });

  test('should work with different user roles - Admin', async ({ loginPage, page }) => {
    // Login as admin
    await loginPage.login(testUsers.admin.username, testUsers.admin.password);

    // Wait for login to complete
    await loginPage.waitForLoginComplete();

    // Verify we're logged in
    const url = page.url();
    expect(!url.includes('/login')).toBe(true);
  });

  test('should work with different user roles - Manager', async ({ loginPage, page }) => {
    // Login as manager
    await loginPage.login(testUsers.manager.username, testUsers.manager.password);

    // Wait for login to complete
    await loginPage.waitForLoginComplete();

    // Verify we're logged in
    const url = page.url();
    expect(!url.includes('/login')).toBe(true);
  });

  test('should display proper error for non-existent user', async ({ loginPage }) => {
    // Try to login with non-existent username
    await loginPage.fillUsername('nonexistentuser');
    await loginPage.fillPassword('SomePassword123');

    // Submit the form
    await loginPage.submitForm();

    // Wait for error message to appear
    const errorMessage = loginPage.page.locator('[role="alert"]');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    // Verify error is displayed
    const hasError = await loginPage.hasFormError();
    expect(hasError).toBe(true);

    // Verify error text is not empty
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
  });
});
