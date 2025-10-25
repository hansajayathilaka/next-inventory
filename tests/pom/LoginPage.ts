import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { loginSelectors } from '@selectors/login.selectors';

/**
 * Login Page Object
 * Handles all login page interactions
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/login');
  }

  async isLoginFormVisible(): Promise<boolean> {
    return await this.isElementVisible(loginSelectors.loginForm);
  }

  async fillUsername(username: string) {
    await this.fillInput(loginSelectors.usernameInput, username);
  }

  async fillPassword(password: string) {
    await this.fillInput(loginSelectors.passwordInput, password);
  }

  async clearUsername() {
    await this.clearInput(loginSelectors.usernameInput);
  }

  async clearPassword() {
    await this.clearInput(loginSelectors.passwordInput);
  }

  async getUsernameValue(): Promise<string> {
    return await this.getInputValue(loginSelectors.usernameInput);
  }

  async getPasswordValue(): Promise<string> {
    return await this.getInputValue(loginSelectors.passwordInput);
  }

  async submitForm() {
    await this.click(loginSelectors.submitButton);
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitForm();
  }

  async loginWithEnter(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.page.keyboard.press('Enter');
  }

  async waitForLoginComplete(timeout: number = 10000) {
    // Wait for navigation away from login page
    try {
      await this.page.waitForURL((url) => !url.includes('/login'), { timeout });
    } catch {
      // If redirect doesn't happen, just continue
      await this.page.waitForTimeout(1000);
    }
  }

  async isPasswordMasked(): Promise<boolean> {
    const passwordInput = this.page.locator(loginSelectors.passwordInput);
    const type = await passwordInput.getAttribute('type');
    return type === 'password';
  }

  async getEmailErrorMessage(): Promise<string> {
    return await this.getText(loginSelectors.emailError);
  }

  async getPasswordErrorMessage(): Promise<string> {
    return await this.getText(loginSelectors.passwordError);
  }

  async getFormErrorMessage(): Promise<string> {
    return await this.getText(loginSelectors.formError);
  }

  async hasEmailError(): Promise<boolean> {
    return await this.isElementVisible(loginSelectors.emailError);
  }

  async hasPasswordError(): Promise<boolean> {
    return await this.isElementVisible(loginSelectors.passwordError);
  }

  async hasFormError(): Promise<boolean> {
    return await this.isElementVisible(loginSelectors.formError);
  }

  async isLoginButtonDisabled(): Promise<boolean> {
    const button = this.page.locator(loginSelectors.submitButton);
    return await button.isDisabled();
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    const button = this.page.locator(loginSelectors.submitButton);
    return await button.isEnabled();
  }
}
