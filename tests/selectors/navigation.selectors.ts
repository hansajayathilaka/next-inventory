/**
 * Navigation Selectors
 * Centralized selectors for navigation elements
 */
export const navigationSelectors = {
  // Main navigation
  sidebarNav: '[data-testid="sidebar"]',
  topNav: '[data-testid="topbar"]',
  logo: '[data-testid="logo"]',

  // Menu items
  dashboardLink: 'a:has-text("Dashboard")',
  posLink: 'a:has-text("POS")',
  staffLink: 'a:has-text("Staff")',
  rolesLink: 'a:has-text("Roles")',
  customersLink: 'a:has-text("Customers")',
  suppliersLink: 'a:has-text("Suppliers")',
  productsLink: 'a:has-text("Products")',
  categoriesLink: 'a:has-text("Categories")',
  inventoryLink: 'a:has-text("Inventory")',
  purchasesLink: 'a:has-text("Purchases")',
  creditsLink: 'a:has-text("Credits")',
  returnsLink: 'a:has-text("Returns")',

  // User menu
  userMenu: '[data-testid="user-menu"]',
  userMenuButton: '[data-testid="user-menu-button"]',
  logoutButton: 'button:has-text("Logout")',
  profileButton: 'button:has-text("Profile")',

  // Breadcrumb
  breadcrumb: '[data-testid="breadcrumb"]',
};
