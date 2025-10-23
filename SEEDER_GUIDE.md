# Hardware Store POS - Database Seeder Guide

## Overview

Your project now includes a comprehensive database seeder system that provides realistic test data for development and production initialization. All data is stored in JSON files, making it easy to customize for your specific needs.

## Quick Start

### 1. Build the Seeder
```bash
cd backend
go build ./cmd/seeder -o seeder
```

### 2. Run the Seeder
```bash
# Run with default settings
./seeder

# Or use Go directly
go run ./cmd/seeder/main.go
```

### 3. Expected Output
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

## Test Data Included

### Users & Permissions

**6 Pre-configured Staff Members:**
- **admin** - System administrator (all permissions)
- **manager1** - Manager (staff management, approvals)
- **cashier1** - Cashier (POS sales)
- **cashier2** - Another cashier
- **stockmgr1** - Stock manager (inventory management)
- **associate1** - Sales associate (basic sales)

All passwords: `[Role]@123456` (e.g., `Admin@123456`)

**34 Granular Permissions:**
Organized by resource and action:
- Roles: create, read, update, delete, assign_permission
- Staff: create, read, update, deactivate
- Customers: create, read, update
- Suppliers: create, read, update
- Categories: create, read, update, delete
- Products: create, read, update, delete
- Inventory: read, manage
- Purchases: create, read
- Sales: create, read
- Returns: create, approve
- Credits: read, manage
- Reports: read

**5 Pre-configured Roles:**
1. **Admin** - Full system access
2. **Manager** - Staff and reporting
3. **Cashier** - Sales and customer management
4. **Stock Manager** - Inventory operations
5. **Sales Associate** - Basic sales only

### Products & Inventory

**27 Sample Products:**
- **Bike Wheels** (5 items) - Various sizes and types
- **Tires** (4 items) - Road, mountain, trike
- **Drivetrain** (3 items) - Chains, gears, pedals
- **Brakes & Cables** (3 items) - Disc, rim, cables
- **Handlebars** (4 items) - Bars, stems, grips
- **Tricycle Parts** (2 items) - Wheels, brakes
- **Tools** (2 items) - Wrenches, screwdrivers
- **Maintenance** (2 items) - Cleaners, lubricants
- **Lights & Safety** (3 items) - Lights, reflectors
- **Security** (2 items) - Locks, cables
- **Bags & Carriers** (2 items) - Baskets, panniers

**27 Inventory Batches:**
- Real cost and sale prices (50-100% margins)
- Realistic stock levels (20-200 units per batch)
- Multiple suppliers per product
- Some items with expiry dates

**Realistic Pricing:**
```
Component costs range from $1.50 (reflectors) to $65 (cranksets)
Component prices range from $4.99 (reflectors) to $155 (cranksets)
Profit margins: 50-100%+ depending on category
```

### Suppliers & Customers

**10 International Suppliers:**
- Shimano, Continental, SRAM, Campagnolo
- Hayes Brakes, Pro Cycling, KMC, VP Components
- Spoke Distribution, Eastern Bike Parts

**12 Wholesale/Bulk Customers:**
- Local bike shops
- Cycling clubs and racing teams
- University programs
- Tricycle enthusiasts co-op
- School transportation
- Government agencies
- Corporate wellness programs
- Hospital equipment

Each customer has a credit limit ranging from $2,000 to $12,000.

### Product Categories

**16 Hierarchical Categories:**

```
├── Bike Parts (parent)
│   ├── Wheels & Tires
│   ├── Brakes & Cables
│   ├── Drivetrain
│   ├── Frame & Fork
│   └── Handlebars & Stem
├── Three-Wheel Parts (parent)
│   ├── Trike Wheels
│   └── Trike Brakes
├── Tools & Maintenance (parent)
│   ├── Repair Tools
│   └── Cleaning & Lubrication
└── Accessories (parent)
    ├── Lights & Reflectors
    ├── Locks & Security
    └── Bags & Carriers
```

## Modifying Seed Data

### 1. Customize Passwords
Edit `backend/seeders/data/staff.json`:
```json
{
  "username": "admin",
  "password": "YourNewPassword@123",  // Change here
  "firstName": "System",
  "lastName": "Administrator",
  "email": "admin@hardware-store.local",
  "roleId": 1,
  "isActive": true
}
```

### 2. Add New Products
Edit `backend/seeders/data/products.json`:
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

### 3. Add Inventory Stock
Edit `backend/seeders/data/inventory.json`:
```json
{
  "productCode": "WHEEL-26-ROAD",
  "supplierId": 1,
  "batchNumber": "SHIMANO-WHEEL-26-001",
  "quantityInStock": 50,  // Modify quantity
  "costPrice": 35.00,
  "salePrice": 85.00,
  "expiryDate": null
}
```

### 4. Add Customers
Edit `backend/seeders/data/customers.json`:
```json
{
  "name": "New Customer Business",
  "email": "contact@newbusiness.com",
  "phone": "+1-555-NEW",
  "address": "123 New Street, City",
  "creditLimit": 5000.00,
  "isActive": true
}
```

### 5. Add Suppliers
Edit `backend/seeders/data/suppliers.json`:
```json
{
  "name": "New Supplier Name",
  "email": "sales@newsupplier.com",
  "phone": "+1-800-NEW-SUPP",
  "address": "123 Supplier Road, Country",
  "isActive": true
}
```

## Using Modified Data

After editing JSON files, re-run the seeder:

```bash
# Reset database and seed with new data
go run ./cmd/seeder/main.go -fresh

# Or specify different data directory
go run ./cmd/seeder/main.go -data ./seeders/data/custom
```

## Production Deployment

### Prepare Production Data
1. Create production directory:
   ```bash
   mkdir seeders/data/production
   ```

2. Copy and modify seed files:
   ```bash
   cp -r seeders/data/* seeders/data/production/
   ```

3. Edit production files with:
   - Actual staff members and roles
   - Real supplier information
   - Complete product catalog
   - Real customer credit limits
   - Actual initial inventory

4. Run seeder during setup:
   ```bash
   go run ./cmd/seeder/main.go -data ./seeders/data/production
   ```

### Backup Seed Data
```bash
# Keep backup of seed files
tar -czf seeders/data/backup-$(date +%Y%m%d).tar.gz seeders/data/
```

## Advanced Usage

### Fresh Start (Careful!)
```bash
# Drops ALL data and re-seeds
go run ./cmd/seeder/main.go -fresh
```

### Custom Database Path
```bash
go run ./cmd/seeder/main.go -db /custom/path/inventory.db
```

### Custom Data Path
```bash
go run ./cmd/seeder/main.go -data ./seeders/data/production
```

### Combined Options
```bash
go run ./cmd/seeder/main.go -fresh -db ./db/test.sqlite -data ./seeders/data/test
```

## Testing Workflows

### Test Login
Use seeder to get test accounts:
```
Username: cashier1
Password: Cashier@123456
```

### Test POS Sales
1. Login as cashier
2. View available products from inventory
3. Create a sales session
4. Add items from inventory batches
5. Apply discounts
6. Complete sale

### Test Role-Based Access
1. Login with different roles (admin, manager, cashier)
2. Verify permissions are enforced
3. Check what operations are available per role

### Test Inventory Management
1. Check current stock levels
2. Note FIFO batch ordering
3. Verify expiry date handling

## JSON File Reference

All files are in `backend/seeders/data/`:

| File | Purpose | Records |
|------|---------|---------|
| permissions.json | Access control system | 34 |
| roles.json | User roles with permissions | 5 |
| staff.json | System users | 6 |
| suppliers.json | Product vendors | 10 |
| categories.json | Product hierarchy | 16 |
| products.json | Product catalog | 27 |
| inventory.json | Stock batches | 27 |
| customers.json | Wholesale customers | 12 |

## Troubleshooting

### "data already seeded" Error
Database already contains data. Use `-fresh` flag:
```bash
go run ./cmd/seeder/main.go -fresh
```

### "permission not found" Error
A role references non-existent permission. Check:
1. Permission name in roles.json
2. Exact spelling in permissions.json

### "product not found" Error
Inventory references non-existent product. Check:
1. productCode in inventory.json
2. Exact match in products.json

### "category not found" Error
Product references non-existent category. Check:
1. categoryId in products.json
2. Category exists in categories.json

## Architecture Benefits

✅ **Development**: Quick data setup for feature testing
✅ **Testing**: Realistic data for QA scenarios
✅ **Documentation**: JSON files serve as data specification
✅ **Reproducibility**: Same data setup each time
✅ **Production Ready**: Easily customizable for live deployment
✅ **Modifiable**: Edit JSON anytime, re-seed as needed
✅ **Version Control**: Track data changes with git
✅ **Backup**: JSON files are human-readable backups

## Next Steps

1. ✅ Run seeder to populate test data
2. ✅ Login with test accounts
3. ✅ Test POS functionality
4. ✅ Verify role-based access
5. 📝 Customize products for your store
6. 📝 Add real customers and suppliers
7. 📝 Set appropriate credit limits
8. 🚀 Deploy to production

## Need Help?

See `backend/seeders/README.md` for comprehensive documentation on:
- Complete data schema reference
- JSON structure examples
- Advanced customization
- Production deployment guide
- Troubleshooting tips

Happy selling! 🚀
