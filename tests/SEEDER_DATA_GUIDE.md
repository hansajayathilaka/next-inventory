# Seeder Data Guide - Using Backend Seeders in Tests

## Overview

Tests now fetch test data dynamically from backend seeders instead of using hardcoded values. This ensures tests always use real, up-to-date data that matches the backend database.

## Why Use Seeder Data?

✅ **Real Data** - Uses actual data seeded in the backend
✅ **Dynamic** - Tests don't break if data changes
✅ **Maintainable** - Single source of truth in backend seeders
✅ **Flexible** - Easy to add more test data
✅ **Scalable** - Works with any number of records

## Available Services

### SeederDataService

Location: `tests/services/seederDataService.ts`

Provides methods to fetch data from backend seeders:

#### Staff/Users
```typescript
import { seederDataService } from '@services/seederDataService';

// Get all staff
const allStaff = await seederDataService.getAllStaff(page);

// Get specific staff by username
const admin = await seederDataService.getStaffByUsername(page, 'admin');

// Get role-specific staff (shortcuts)
const admin = await seederDataService.getAdminStaff(page);
const cashier = await seederDataService.getCashierStaff(page);
const manager = await seederDataService.getManagerStaff(page);
```

#### Customers
```typescript
// Get all customers
const allCustomers = await seederDataService.getAllCustomers(page);

// Get customer by name
const customer = await seederDataService.getCustomerByName(page, 'Local Bike Shop');

// Get first customer
const firstCustomer = await seederDataService.getFirstCustomer(page);

// Get customer with high credit limit (for credit testing)
const highCreditCustomer = await seederDataService.getHighCreditCustomer(page);
```

#### Products
```typescript
// Get all products
const allProducts = await seederDataService.getAllProducts(page);

// Get product by code
const product = await seederDataService.getProductByCode(page, 'WHEEL-26-ROAD');

// Get first N products
const twoProducts = await seederDataService.getProducts(page, 2);
```

#### Categories
```typescript
// Get all categories
const categories = await seederDataService.getAllCategories(page);
```

#### Suppliers
```typescript
// Get all suppliers
const suppliers = await seederDataService.getAllSuppliers(page);
```

#### Data Summary
```typescript
// Get count of all data types
const summary = await seederDataService.getDataSummary(page);
console.log(summary);
// {
//   staffCount: 6,
//   customerCount: 12,
//   productCount: 50+,
//   categoryCount: 5,
//   supplierCount: 8
// }
```

## Usage Examples

### Login Tests

```typescript
import { test } from '@fixtures/testFixtures';
import { seederDataService } from '@services/seederDataService';

test('login with admin user', async ({ loginPage, page }) => {
  // Get admin from seeder data
  const admin = await seederDataService.getAdminStaff(page);

  await loginPage.goto();
  await loginPage.login(admin.username, admin.password);
  await loginPage.waitForLoginComplete();
});
```

### POS Tests

```typescript
test('add product to cart', async ({ posPage, page }) => {
  // Get real products from database
  const products = await seederDataService.getProducts(page, 2);

  if (products.length > 0) {
    const product = products[0];
    await posPage.addProductToCart(product.description, 1);

    const cartCount = await posPage.getCartItemsCount();
    expect(cartCount).toBe(1);
  }
});
```

### Credits Tests

```typescript
test('settle credit for customer', async ({ creditsPage, page }) => {
  // Get high credit customer
  const customer = await seederDataService.getHighCreditCustomer(page);

  if (customer) {
    await creditsPage.searchCustomerById(customer.id);
    await creditsPage.completeFullSettlement('cash');

    const isSuccess = await creditsPage.isSuccessMessageVisible();
    expect(isSuccess).toBeTruthy();
  }
});
```

## Seeded Data Available

### Staff (6 users)
- **admin** - System Administrator
- **manager1** - Manager
- **cashier1** - Cashier (Sarah Jones)
- **cashier2** - Cashier (Mike Smith)
- **stockmgr1** - Stock Manager
- **associate1** - Sales Associate

All use pattern: `password = "{Role}@123456"`
Example: admin uses `Admin@123456`, cashier1 uses `Cashier@123456`

### Customers (12 customers)
Business customers with varying credit limits:
- Local Bike Shop ($5,000 credit)
- Mountain Biking Club ($3,000 credit)
- City Cycle Rentals ($8,000 credit) - high credit
- And 9 more...

### Products (50+ products)
Organized by categories:
- Wheels (multiple sizes and types)
- Tires (road, mountain, etc.)
- Chains (various speeds)
- Brakes, Handlebars, Grips, etc.

### Categories
- Wheels & Tires
- Drive Train
- Brakes
- Control & Comfort
- Frames & Forks

### Suppliers (8 suppliers)
Various suppliers for inventory management

## Migration from Hardcoded Data

### Before (Hardcoded)
```typescript
import { testUsers, testProducts } from '@data/testData';

test('example', async ({ posPage }) => {
  // Using hardcoded data
  await posPage.addProductToCart(testProducts.product1.name, 1);
});
```

### After (Dynamic from Seeders)
```typescript
import { seederDataService } from '@services/seederDataService';

test('example', async ({ posPage, page }) => {
  // Using real data from backend
  const products = await seederDataService.getProducts(page, 1);
  if (products.length > 0) {
    await posPage.addProductToCart(products[0].description, 1);
  }
});
```

## Best Practices

### 1. Always Check if Data Exists
```typescript
const customer = await seederDataService.getFirstCustomer(page);
if (customer) {
  // Use customer
} else {
  // Skip test or use fallback
}
```

### 2. Use Role-Specific Shortcuts
```typescript
// ✅ Good - Clear intent
const cashier = await seederDataService.getCashierStaff(page);

// ❌ Bad - Hardcoded lookup
const cashier = await seederDataService.getStaffByUsername(page, 'cashier1');
```

### 3. Fetch Once in beforeEach
```typescript
test.beforeEach(async ({ page }, testInfo) => {
  // Fetch data once for all tests in this suite
  const products = await seederDataService.getProducts(page, 5);
});
```

### 4. Handle Missing Data Gracefully
```typescript
const customer = await seederDataService.getHighCreditCustomer(page);
if (!customer) {
  test.skip(); // Skip if data not available
}
```

## Updating Seeder Data

To add or modify test data:

1. Edit the JSON files in `backend/seeders/data/`
2. Run the seeder to populate database
3. Tests will automatically use new data

Files:
- `backend/seeders/data/staff.json`
- `backend/seeders/data/customers.json`
- `backend/seeders/data/products.json`
- `backend/seeders/data/categories.json`
- `backend/seeders/data/suppliers.json`
- `backend/seeders/data/roles.json`
- `backend/seeders/data/permissions.json`

## Troubleshooting

### Data Not Fetching
```
Issue: seederDataService returns empty arrays

Solutions:
1. Verify backend is running: http://localhost:8080
2. Run seeder to populate data: go run ./cmd/seeder
3. Check API endpoints are accessible
4. Check CORS configuration if using different origin
```

### Performance
```
Issue: Tests slow because fetching data every time

Solution:
Fetch once in beforeAll and reuse:

let staff: Staff[];
test.beforeAll(async ({ page }) => {
  staff = await seederDataService.getAllStaff(page);
});

test('example', async () => {
  const admin = staff.find(s => s.username === 'admin');
});
```

### Type Errors
```
Error: Property 'name' does not exist

Solution:
Check property names match seeded JSON:
- customers use 'name', not 'customerName'
- products use 'code' and 'description'
- staff use 'username' and 'firstName'
```

## API Endpoints Used

SeederDataService calls these backend endpoints:

```
GET /api/staff              - Get all staff
GET /api/customers          - Get all customers
GET /api/products           - Get all products
GET /api/categories         - Get all categories
GET /api/suppliers          - Get all suppliers
```

If any endpoint is not available, the service returns an empty array gracefully.

## Reference: Seeded Credentials

### Admin
```
Username: admin
Password: Admin@123456
Email: admin@hardware-store.local
```

### Cashier 1
```
Username: cashier1
Password: Cashier@123456
Email: sarah.jones@hardware-store.local
```

### Manager
```
Username: manager1
Password: Manager@123456
Email: john.manager@hardware-store.local
```

All other staff follow similar pattern with `{Role}@123456`

## Future Enhancements

Potential improvements:
- [ ] Caching to reduce API calls
- [ ] Batch fetching for multiple data types
- [ ] Filtering and sorting helpers
- [ ] Data generation for stress testing
- [ ] Custom seeder data for specific tests

## Summary

✅ Use `SeederDataService` for all test data
✅ Fetch from backend endpoints dynamically
✅ Check if data exists before using
✅ Reference guide for credentials in testData.ts
✅ No more hardcoded values - real data only!

---

For questions or issues, refer to:
- `tests/services/seederDataService.ts` - Service implementation
- `tests/data/testData.ts` - Reference data and credentials
- `backend/seeders/data/` - Source data files
