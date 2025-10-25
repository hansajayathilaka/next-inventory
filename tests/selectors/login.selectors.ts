/**
 * Login Page Selectors
 * Centralized selectors for login page elements
 */
export const loginSelectors = {
  // Form elements
  usernameInput: 'input[placeholder="Enter username"]',
  passwordInput: 'input[placeholder="Enter password"]',
  loginButton: 'button[type="submit"]',
  submitButton: 'button[type="submit"]',

  // Form validation
  emailError: '[role="alert"]',
  passwordError: '[role="alert"]',
  formError: '[role="alert"]',

  // Container and sections
  loginForm: 'form',
  loginContainer: 'div.bg-white',
  loginPage: 'body',

  // Success/navigation indicators
  loadingMessage: '[role="status"]',
  welcomeMessage: 'text=/POS System/',
};
