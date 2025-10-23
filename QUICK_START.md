# Hardware Store POS - Quick Start Guide

Get your system up and running in minutes!

## Prerequisites

- Go 1.23 or later
- Node.js 18+ (for frontend - optional for now)
- SQLite 3 (included in binary dependencies)

## Step 1: Setup Database with Seeder

The seeder will automatically create all database tables and populate them with realistic test data.

### Option A: Quick Start (Recommended)

```bash
cd backend
go run ./cmd/seeder/main.go
```

This will:
1. ✅ Create database at `./database/inventory.db`
2. ✅ Automatically create all tables (migrations)
3. ✅ Seed 137 test records across 8 tables
4. ✅ Create 6 test staff accounts

### Option B: Fresh Start (For Testing)

If you need a clean slate:

```bash
cd backend
go run ./cmd/seeder/main.go -fresh
```

This will:
1. 🗑️ Drop all existing tables
2. ✅ Create new tables
3. ✅ Seed fresh data

### Option C: Custom Paths

```bash
# Use custom database location
go run ./cmd/seeder/main.go -db /custom/path/inventory.db

# Use custom seed data directory
go run ./cmd/seeder/main.go -data ./seeders/data/production

# Combine both
go run ./cmd/seeder/main.go -fresh -db ./db/test.sqlite -data ./data/test
```

## Step 2: Start the Backend Server

```bash
cd backend
go run ./cmd/server/main.go
```

The server will:
1. ✅ Connect to SQLite database
2. ✅ Run auto-migrations (creates any missing tables)
3. ✅ Start on `http://localhost:8080`
4. ✅ Serve API and frontend

### Expected Output:

```
Server starting on port 8080
GET /assets
GET /vite.svg
```

## Step 3: Test the API

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "staff": {
    "id": 1,
    "username": "admin",
    "firstName": "System",
    "lastName": "Administrator",
    "email": "admin@hardware-store.local",
    "roleId": 1,
    "isActive": true
  }
}
```

### Get All Products

```bash
curl -X GET http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create a POS Session

```bash
curl -X POST http://localhost:8080/api/v1/pos/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "staff_id": 1,
    "customer_id": null
  }'
```

Response:
```json
{
  "id": 1,
  "session_id": "uuid-string",
  "staff_id": 1,
  "status": "active",
  "bill_discount_value": 0,
  "last_activity": "2024-10-23T10:30:00Z",
  "created_at": "2024-10-23T10:30:00Z"
}
```

## Test Accounts

After running the seeder, use these credentials:

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| **Admin** | admin | Admin@123456 | All |
| **Manager** | manager1 | Manager@123456 | Staff, Reports, Approvals |
| **Cashier** | cashier1 | Cashier@123456 | Sales, Customers |
| **Cashier** | cashier2 | Cashier@123456 | Sales, Customers |
| **Stock Manager** | stockmgr1 | Stock@123456 | Inventory, Purchases |
| **Sales Associate** | associate1 | Sales@123456 | Products, Sales |

## Available Test Data

### Products (27 items)
- Bike wheels, tires, chains
- Brakes, handlebars, stems
- Tricycle parts
- Tools and maintenance supplies
- Lights, reflectors, locks
- Bags and carriers

### Inventory (27 batches)
- Real cost and sale prices
- 20-200 units per batch
- Multiple suppliers
- Some with expiry dates

### Suppliers (10)
- International vendors
- Shimano, Continental, SRAM, Campagnolo, etc.

### Customers (12)
- Bike shops, cycling clubs
- Schools, government agencies
- Credit limits: $2,000 - $12,000

### Categories (16)
- Hierarchical organization
- Parent and child categories
- 16 total categories

## Common Tasks

### Modify Seed Data

Edit JSON files in `backend/seeders/data/`:

```bash
# Edit products
nano backend/seeders/data/products.json

# Edit staff passwords
nano backend/seeders/data/staff.json

# Edit inventory stock
nano backend/seeders/data/inventory.json
```

Then re-seed:
```bash
go run ./cmd/seeder/main.go -fresh
```

### Check Database Schema

```bash
sqlite3 ./database/inventory.db ".schema"
```

### Check Database Contents

```bash
# View all roles
sqlite3 ./database/inventory.db "SELECT * FROM roles;"

# View all staff
sqlite3 ./database/inventory.db "SELECT * FROM staff;"

# View all products
sqlite3 ./database/inventory.db "SELECT * FROM products LIMIT 10;"

# View inventory with stock levels
sqlite3 ./database/inventory.db "SELECT p.code, p.description, ib.quantity_in_stock FROM inventory_batches ib JOIN products p ON ib.product_id = p.id;"
```

## Database Structure

The seeder creates these tables automatically:

```
roles              (5 roles)
├── role_permissions
└── permissions   (34 permissions)

staff              (6 staff members)
├── role_id (FK to roles)

customers          (12 customers)
suppliers          (10 suppliers)

categories         (16 categories)
└── parent_id (self-referential)

products           (27 products)
├── category_id (FK)

inventory_batches  (27 batches)
├── product_id (FK)
└── supplier_id (FK)

sales_sessions     (created during POS)
├── staff_id (FK)
├── customer_id (FK)
└── sales_session_items

sales              (created on checkout)
├── staff_id (FK)
├── customer_id (FK)
├── session_id (FK)
└── sale_items
```

## Troubleshooting

### Error: "failed to read file: open seeders/data/permissions.json"

Make sure you're running from the backend directory or provide the correct data path:

```bash
# From project root
go run ./backend/cmd/seeder/main.go

# From backend directory
go run ./cmd/seeder/main.go

# With explicit path
go run ./cmd/seeder/main.go -data ./seeders/data
```

### Error: "data already seeded"

Database already has data. Use `-fresh` to start over:

```bash
go run ./cmd/seeder/main.go -fresh
```

### Seeder hangs or doesn't create tables

Make sure both are running the unified AutoMigrate:

1. Check that `database/migrations.go` exists
2. Check that seeder calls `database.AutoMigrate(db)` after InitDB
3. Check that server calls `database.AutoMigrate(db)` after InitDB
4. Rebuild: `go build ./cmd/seeder`

### Permission denied on database file

SQLite database file permissions issue:

```bash
# Fix permissions
chmod 644 database/inventory.db
chmod 755 database/

# Remove and re-seed if corrupted
rm database/inventory.db
go run ./cmd/seeder/main.go
```

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with username/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/session` | Get current session |

### POS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/pos/sessions` | Create new session |
| GET | `/api/v1/pos/sessions` | List active sessions |
| GET | `/api/v1/pos/sessions/:id` | Get session details |
| POST | `/api/v1/pos/sessions/:id/items` | Add item to session |
| PUT | `/api/v1/pos/sessions/:id/items/:itemId` | Update item |
| DELETE | `/api/v1/pos/sessions/:id/items/:itemId` | Remove item |
| GET | `/api/v1/pos/sessions/:id/total` | Calculate session total |
| POST | `/api/v1/pos/sessions/:id/discount` | Apply bill discount |
| POST | `/api/v1/pos/sessions/:id/complete` | Complete session |

### Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/roles` | List all roles |
| GET | `/api/v1/permissions` | List all permissions |
| GET | `/api/v1/staff` | List all staff |
| GET | `/api/v1/products` | List all products |
| GET | `/api/v1/customers` | List all customers |

## Next Steps

1. ✅ Run seeder to populate database
2. ✅ Start server
3. ✅ Test login with admin credentials
4. ✅ Explore API endpoints
5. 🔄 Customize seed data (edit JSON files)
6. 📱 Implement frontend components
7. 🚀 Deploy to production

## Support

For detailed documentation:
- See `SEEDER_GUIDE.md` for seeder customization
- See `backend/seeders/README.md` for JSON schema reference
- Check `backend/cmd/server/main.go` for server configuration
- Review `backend/internal/services/seeder_service.go` for seeding logic

## Production Deployment

For production setup:

1. Create production seed directory:
   ```bash
   cp -r backend/seeders/data backend/seeders/data/production
   ```

2. Edit production files with real data:
   - Staff with actual names and roles
   - Real product catalog
   - Actual supplier information
   - Customer credit limits

3. Deploy:
   ```bash
   ./seeder -data ./seeders/data/production -db /var/lib/pos/inventory.db
   ./server
   ```

4. Backup seed files:
   ```bash
   tar -czf seeders-backup-$(date +%Y%m%d).tar.gz backend/seeders/
   ```

Happy selling! 🚀
