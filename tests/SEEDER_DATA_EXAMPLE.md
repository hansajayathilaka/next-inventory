# Seeder Data - Implementation Examples

Quick examples showing how to use `SeederDataService` in your tests.

## 1. Login Test with Seeded User

```typescript
import { test } from '@fixtures/testFixtures';
import { seederDataService } from '@services/seederDataService';

test.describe('Login with Seeded Data', () => {
  test('should login as admin', async ({ loginPage, page }) => {
    // Get admin from backend seeders
    const admin = await seederDataService.getAdminStaff(page);

    if (!admin) {
      test.skip(); // Skip if no admin found
    }

    // Login with seeded credentials
    await loginPage.goto();
    await loginPage.login(admin.username, admin.password);
    await loginPage.waitForLoginComplete();

    // Verify login successful
    const url = await loginPage.getCurrentUrl();
    expect(url).not.toContain('/login');
  });

  test('should login as cashier', async ({ loginPage, page }) => {
    // Get cashier from backend seeders
    const cashier = await seederDataService.getCashierStaff(page);

    if (!cashier) {
      test.skip();
    }

    await loginPage.goto();
    await loginPage.login(cashier.username, cashier.password);
    await loginPage.waitForLoginComplete();
  });
});
```

## 2. POS Test with Seeded Products

```typescript
import { test } from '@fixtures/testFixtures';
import { seederDataService } from '@services/seederDataService';

test.describe('POS with Seeded Products', () => {
  test('should add seeded product to cart', async ({ posPage, page }) => {
    // Get real products from backend
    const products = await seederDataService.getProducts(page, 3);

    if (products.length === 0) {
      test.skip(); // Skip if no products available
    }

    // Add first product to cart
    const product = products[0];
    await posPage.goto();
    await posPage.addProductToCart(product.description, 1);

    // Verify product added
    const itemsCount = await posPage.getCartItemsCount();
    expect(itemsCount).toBe(1);
  });

  test('should complete transaction with seeded data', async ({ posPage, page }) => {
    // Fetch all needed data
    const products = await seederDataService.getProducts(page, 2);
    const customer = await seederDataService.getFirstCustomer(page);

    if (products.length < 2 || !customer) {
      test.skip();
    }

    // Create POS transaction
    await posPage.goto();
    await posPage.createNewSession();

    // Add products
    await posPage.addProductToCart(products[0].description, 1);
    await posPage.addProductToCart(products[1].description, 2);

    // Complete payment
    await posPage.completeCashPayment('500.00');

    // Verify success
    const isReceipt = await posPage.isReceiptVisible();
    expect(isReceipt).toBeTruthy();
  });
});
```

## 3. Credits Test with Seeded Customers

```typescript
import { test } from '@fixtures/testFixtures';
import { seederDataService } from '@services/seederDataService';

test.describe('Credits with Seeded Customers', () => {
  test('should display credit status for customer', async ({
    creditsPage,
    page,
  }) => {
    // Get customer with good credit limit
    const customer = await seederDataService.getHighCreditCustomer(page);

    if (!customer) {
      test.skip();
    }

    // Search for customer
    await creditsPage.goto();
    await creditsPage.searchCustomerById(customer.id);

    // Verify credit status displayed
    const isCreditCard = await creditsPage.isCreditStatusCardVisible();
    expect(isCreditCard).toBeTruthy();

    // Verify customer info
    const balance = await creditsPage.getOutstandingBalance();
    expect(balance).toBeTruthy();
  });

  test('should settle credit with seeded payment method', async ({
    creditsPage,
    page,
  }) => {
    // Get customer for settlement
    const customer = await seederDataService.getFirstCustomer(page);

    if (!customer) {
      test.skip();
    }

    // Navigate to credits
    await creditsPage.goto();
    await creditsPage.searchCustomerById(customer.id);

    // Settle credit
    await creditsPage.completeFullSettlement('cash');

    // Verify settlement
    await creditsPage.waitFor(1000);
    const isSuccess = await creditsPage.isSuccessMessageVisible();
    expect(isSuccess).toBeTruthy();
  });

  test('should show all customers', async ({ creditsPage, page }) => {
    // Fetch all customers
    const allCustomers = await seederDataService.getAllCustomers(page);

    console.log(`Found ${allCustomers.length} customers`);
    allCustomers.forEach((customer) => {
      console.log(`- ${customer.name} (Credit: $${customer.creditLimit})`);
    });

    expect(allCustomers.length).toBeGreaterThan(0);
  });
});
```

## 4. Reusable Test Helpers

Create a file `tests/utils/seederHelpers.ts`:

```typescript
import { Page } from '@playwright/test';
import { seederDataService, Staff, Customer, Product } from '@services/seederDataService';

/**
 * Helper to get random staff from seeded data
 */
export async function getRandomStaff(page: Page): Promise<Staff | null> {
  const allStaff = await seederDataService.getAllStaff(page);
  if (allStaff.length === 0) return null;
  return allStaff[Math.floor(Math.random() * allStaff.length)];
}

/**
 * Helper to get random customer
 */
export async function getRandomCustomer(page: Page): Promise<Customer | null> {
  const allCustomers = await seederDataService.getAllCustomers(page);
  if (allCustomers.length === 0) return null;
  return allCustomers[Math.floor(Math.random() * allCustomers.length)];
}

/**
 * Helper to verify seeded data exists
 */
export async function ensureSeededData(page: Page): Promise<boolean> {
  return await seederDataService.hasSeededData(page);
}
```

Then use in tests:

```typescript
import { getRandomStaff, getRandomCustomer } from '@utils/seederHelpers';

test('test with random seeded user', async ({ page }) => {
  const randomStaff = await getRandomStaff(page);
  if (!randomStaff) test.skip();

  // Use random staff
  console.log(`Testing with: ${randomStaff.firstName}`);
});
```

## 5. Data Validation Tests

```typescript
test.describe('Seeded Data Validation', () => {
  test('should have valid seeded data', async ({ page }) => {
    // Get all data
    const summary = await seederDataService.getDataSummary(page);

    // Verify data exists
    expect(summary.staffCount).toBeGreaterThan(0);
    expect(summary.customerCount).toBeGreaterThan(0);
    expect(summary.productCount).toBeGreaterThan(0);

    console.log('Seeded Data:');
    console.log(`  Staff: ${summary.staffCount}`);
    console.log(`  Customers: ${summary.customerCount}`);
    console.log(`  Products: ${summary.productCount}`);
    console.log(`  Categories: ${summary.categoryCount}`);
    console.log(`  Suppliers: ${summary.supplierCount}`);
  });

  test('all staff have valid credentials', async ({ page }) => {
    const allStaff = await seederDataService.getAllStaff(page);
    expect(allStaff.length).toBeGreaterThan(0);

    allStaff.forEach((staff) => {
      expect(staff.username).toBeTruthy();
      expect(staff.password).toBeTruthy();
      expect(staff.email).toBeTruthy();
    });
  });

  test('all products have codes', async ({ page }) => {
    const products = await seederDataService.getProducts(page, 10);

    products.forEach((product) => {
      expect(product.code).toBeTruthy();
      expect(product.description).toBeTruthy();
    });
  });
});
```

## 6. Before/After Setup with Seeded Data

```typescript
test.describe('Suite with Seeded Setup', () => {
  let testStaff: Staff;
  let testCustomers: Customer[];
  let testProducts: Product[];

  test.beforeAll(async ({ page }) => {
    // Fetch all data once before tests
    const admin = await seederDataService.getAdminStaff(page);
    testStaff = admin!;

    testCustomers = await seederDataService.getAllCustomers(page);
    testProducts = await seederDataService.getProducts(page, 5);

    // Verify we have data
    if (!testStaff || testCustomers.length === 0 || testProducts.length === 0) {
      test.skip();
    }
  });

  test('use prefetched staff', async () => {
    console.log(`Admin: ${testStaff.firstName} ${testStaff.lastName}`);
    expect(testStaff.username).toBe('admin');
  });

  test('use prefetched customers', async () => {
    console.log(`Total customers: ${testCustomers.length}`);
    expect(testCustomers.length).toBeGreaterThan(0);
  });

  test('use prefetched products', async () => {
    testProducts.forEach((product) => {
      console.log(`Product: ${product.code} - ${product.description}`);
    });
    expect(testProducts.length).toBe(5);
  });
});
```

## Key Takeaways

1. **Always check if data exists** before using it
2. **Use role-specific shortcuts** like `getCashierStaff()`
3. **Fetch once** in `beforeAll` if using same data multiple times
4. **Handle missing data** with `test.skip()`
5. **Use real data** - no more hardcoded values!

## Running Examples

To run these examples:

```bash
# 1. Start backend and run seeder
cd backend
go run ./cmd/seeder

# 2. Start frontend
cd ../frontend
npm run dev

# 3. Run tests
cd ../tests
npm test

# 4. Run specific example
npx playwright test -g "should login as admin"
npx playwright test -g "should add seeded product"
npx playwright test -g "Credits with Seeded"
```

## Common Patterns

### Pattern 1: Skip if no data
```typescript
const data = await seederDataService.getFirstCustomer(page);
if (!data) test.skip();
```

### Pattern 2: Use data summary
```typescript
const summary = await seederDataService.getDataSummary(page);
if (summary.productCount === 0) test.skip();
```

### Pattern 3: Fetch specific data type
```typescript
const admin = await seederDataService.getStaffByUsername(page, 'admin');
const customers = await seederDataService.getAllCustomers(page);
const products = await seederDataService.getProducts(page, 3);
```

### Pattern 4: Error handling
```typescript
try {
  const data = await seederDataService.getAllProducts(page);
  // Use data
} catch (error) {
  console.log('Failed to fetch products:', error);
  test.skip();
}
```

---

**Ready to use seeded data in your tests!** 🎉
