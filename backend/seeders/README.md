# Database Seeder

This seeder populates your hardware store POS database with realistic test data for development and testing.

## Data Structure

All seed data is stored in JSON files for easy modification:

- **permissions.json** - System permissions and access controls
- **roles.json** - User roles with assigned permissions
- **staff.json** - Test staff members (users)
- **suppliers.json** - Product suppliers
- **categories.json** - Product category hierarchy
- **products.json** - Product catalog with attributes
- **inventory.json** - Inventory batches with stock levels
- **customers.json** - Customer records with credit limits

## Running the Seeder

### From Command Line

```bash
# Run seeder with default database and data paths
go run ./cmd/seeder/main.go

# Specify custom database path
go run ./cmd/seeder/main.go -db ./custom/path/inventory.db

# Specify custom data path
go run ./cmd/seeder/main.go -data ./custom/seeders/data

# Fresh start (drop all data first) - USE WITH CAUTION!
go run ./cmd/seeder/main.go -fresh
```

### Expected Output

```
🌱 Hardware Store POS Seeder
Database: ./database/inventory.db
Data path: ./seeders/data
Starting data seeding...
✓ Permissions seeded
✓ Roles seeded
✓ Staff seeded
✓ Suppliers seeded
✓ Categories seeded
✓ Products seeded
✓ Inventory batches seeded
✓ Customers seeded
✅ All data seeded successfully!

✨ Seeding complete! You can now use the application.

Default test accounts:
  Admin:      admin / Admin@123456
  Manager:    manager1 / Manager@123456
  Cashier:    cashier1 / Cashier@123456
```

## Test Data Overview

### Roles (5 predefined)
- **Admin** - Full system access
- **Manager** - Staff management, approvals, reports
- **Cashier** - Sales and customer management
- **Stock Manager** - Inventory management
- **Sales Associate** - Basic sales only

### Staff Members (6 test users)
All passwords follow pattern: `[Role]@123456` (e.g., `Admin@123456`)

### Products (27 sample items)
- Bike parts (wheels, tires, chains, brakes, etc.)
- Tricycle parts
- Tools and maintenance supplies
- Accessories and safety equipment

### Inventory (27 batches)
- Real cost and sale prices
- Multiple suppliers per product
- Various quantity levels
- Some items with expiry dates

### Customers (12 wholesale/bulk)
- Local businesses
- Educational institutions
- Government agencies
- Community organizations

## Customizing Seed Data

### 1. Modifying Existing Data

Edit the JSON files directly:

```bash
# Edit products
nano seeders/data/products.json

# Edit staff
nano seeders/data/staff.json

# Edit customers
nano seeders/data/customers.json
```

### 2. Adding New Items

Example: Adding a new product to `products.json`:

```json
{
  "code": "WHEEL-29-MTB",
  "description": "29 inch mountain bike wheel",
  "categoryId": 2,
  "attributes": {
    "size": "29 inch",
    "type": "mountain",
    "material": "aluminum alloy"
  }
}
```

Example: Adding a new supplier:

```json
{
  "name": "New Supplier Co.",
  "email": "sales@newsupplier.com",
  "phone": "+1-800-NEW-SUPP",
  "address": "123 Supplier Road, City",
  "isActive": true
}
```

### 3. Changing Staff Passwords

Edit `staff.json` to change default passwords:

```json
{
  "username": "admin",
  "password": "YourNewPassword@123",  // Change this
  "firstName": "System",
  "lastName": "Administrator",
  "email": "admin@hardware-store.local",
  "roleId": 1,
  "isActive": true
}
```

**Important**: After changing passwords in JSON, re-run the seeder with `-fresh` flag:

```bash
go run ./cmd/seeder/main.go -fresh
```

### 4. Adjusting Inventory Levels

Edit `inventory.json` to set stock levels:

```json
{
  "productCode": "WHEEL-26-ROAD",
  "supplierId": 1,
  "batchNumber": "SHIMANO-WHEEL-26-001",
  "quantityInStock": 100,  // Change quantity
  "costPrice": 35.00,
  "salePrice": 85.00,
  "expiryDate": null
}
```

### 5. Setting Credit Limits

Edit `customers.json` to adjust credit limits:

```json
{
  "name": "Local Bike Shop",
  "email": "owner@localbikeshow.com",
  "phone": "+1-555-0101",
  "address": "123 Main Street, Downtown",
  "creditLimit": 10000.00,  // Change credit limit
  "isActive": true
}
```

## Production Use

The seeder is designed for both development and production initialization:

### Development
- Run with test data for feature development
- Use `-fresh` flag to reset between test runs
- Modify JSON to test edge cases

### Production
1. Prepare production JSON files with actual:
   - Staff members and roles
   - Real supplier information
   - Complete product catalog
   - Customer credit limits
   - Initial inventory levels

2. Run once during initial setup:
```bash
go run ./cmd/seeder/main.go -data ./seeders/data/production
```

3. **Keep backups** of your seed files for disaster recovery

## Data Validation

The seeder validates data as it loads:
- Permissions must exist before roles reference them
- Roles must exist before staff assignment
- Categories must exist before product assignment
- Products must exist before inventory batches
- Suppliers and customers are created independently

## Troubleshooting

### Error: "data already seeded"
The database already contains data. Use `-fresh` flag:
```bash
go run ./cmd/seeder/main.go -fresh
```

### Error: "permission not found"
A role is referencing a permission that doesn't exist. Check:
1. Permission name in `roles.json`
2. Exact spelling match in `permissions.json`

### Error: "product not found"
An inventory batch references a non-existent product code. Check:
1. `productCode` value in `inventory.json`
2. Exact spelling match in `products.json`

### Error: "category not found"
A product references a non-existent category. Check:
1. `categoryId` value in `products.json`
2. Category ID exists in database (depends on creation order)

## JSON Schema Reference

### permissions.json
```json
{
  "name": "permission_name",
  "resource": "resource_type",
  "action": "action_type",
  "description": "Human-readable description"
}
```

### roles.json
```json
{
  "name": "Role Name",
  "description": "Role description",
  "permissions": ["permission_name_1", "permission_name_2"]
}
```

### staff.json
```json
{
  "username": "username",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "roleId": 1,
  "isActive": true
}
```

### suppliers.json
```json
{
  "name": "Supplier Name",
  "email": "email@supplier.com",
  "phone": "+1-800-PHONE",
  "address": "Address",
  "isActive": true
}
```

### categories.json
```json
{
  "name": "Category Name",
  "parentId": null,  // null for root, or parent category ID
  "description": "Description"
}
```

### products.json
```json
{
  "code": "PRODUCT-CODE",
  "description": "Product description",
  "categoryId": 1,
  "attributes": {
    "key": "value",
    "custom_field": "custom_value"
  }
}
```

### inventory.json
```json
{
  "productCode": "PRODUCT-CODE",
  "supplierId": 1,
  "batchNumber": "BATCH-001",
  "quantityInStock": 100,
  "costPrice": 10.00,
  "salePrice": 25.00,
  "expiryDate": "2026-12-31"  // null if no expiry
}
```

### customers.json
```json
{
  "name": "Customer Name",
  "email": "customer@email.com",
  "phone": "+1-555-1234",
  "address": "Address",
  "creditLimit": 5000.00,
  "isActive": true
}
```

## Notes

- Passwords are hashed using bcrypt before storage
- All timestamps are auto-generated
- IDs are auto-incremented by database
- Soft deletes are supported via `is_active` flag
- JSON is case-sensitive for field names
- Category hierarchy is supported via `parentId`
- Product attributes are stored as JSON strings

## Support

For issues or questions about the seeder:
1. Check JSON syntax (validate with jsonlint)
2. Review error messages - they indicate which item failed
3. Ensure IDs/foreign keys reference existing records
4. Check field names match exactly (case-sensitive)
