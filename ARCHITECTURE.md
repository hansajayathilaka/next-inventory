# Hardware Store POS - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React)                     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  LoginPage   │  │  RolesPage   │  │  POSPage     │  (TBD)  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Service Layer (axios)                  │  │
│  │  - auth.service.ts                                      │  │
│  │  - roles.service.ts                                     │  │
│  │  - staff.service.ts                                     │  │
│  │  - pos.service.ts                                       │  │
│  └──────────┬───────────────────────────────────────────────┘  │
│             │                                                  │
└─────────────┼──────────────────────────────────────────────────┘
              │
              │ HTTP/REST
              │
┌─────────────┼──────────────────────────────────────────────────┐
│             ▼                BACKEND (Go + Gin)              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │            Gin Router & Middleware                    ││
│  │  - JWT Authentication                                 ││
│  │  - CORS & Security Headers                            ││
│  │  - Error Handling & Logging                           ││
│  └──────────────────┬─────────────────────────────────────┘│
│                     │                                       │
│  ┌──────────────────┼─────────────────────────────────────┐│
│  │      Handler Layer                                     ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │AuthHandler   │  │RoleHandler   │  │POSHandler    │ ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ ││
│  └─────────┼──────────────────┼──────────────────┼────────┘│
│            │                  │                  │         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │      Service Layer (Business Logic)                    ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │AuthService   │  │RoleService   │  │POSService    │ ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │StaffService  │  │SeederService │  │MoreServices  │ ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ ││
│  └─────────┼──────────────────┼──────────────────┼────────┘│
│            │                  │                  │         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │    Repository Layer (Data Access)                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │RoleRepository│  │StaffRepository│ │POSRepository │ ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │ProductRepo   │  │CustomerRepo  │  │InventoryRepo │ ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ ││
│  └─────────┼──────────────────┼──────────────────┼────────┘│
│            │                  │                  │         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │         Database Layer (SQLite + GORM)                 ││
│  │                                                         ││
│  │  ┌────────────────────────────────────────────────────┐││
│  │  │              AutoMigrate                           │││
│  │  │   Unified table creation in both                  │││
│  │  │   - server/main.go                                │││
│  │  │   - seeder/main.go                                │││
│  │  └────────────────────────────────────────────────────┘││
│  │                                                         ││
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────┐   ││
│  │  │   Roles   │  │   Products   │  │  Suppliers   │   ││
│  │  └───────────┘  └──────────────┘  └──────────────┘   ││
│  │  ┌───────────┐  ┌──────────────┐  ┌──────────────┐   ││
│  │  │ Permissions │  │ Categories   │  │  Customers   │   ││
│  │  └───────────┘  └──────────────┘  └──────────────┘   ││
│  │  ┌──────────────────────────────────────────────────┐ ││
│  │  │  POS Tables:                                     │ ││
│  │  │  - SalesSessions, SalesSessionItems              │ ││
│  │  │  - Sales, SaleItems                              │ ││
│  │  │  - InventoryBatches                              │ ││
│  │  └──────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │      File System (JSON Seed Data)                      ││
│  │  backend/seeders/data/                                  ││
│  │  ├── permissions.json (34 permissions)                 ││
│  │  ├── roles.json (5 roles)                              ││
│  │  ├── staff.json (6 users)                              ││
│  │  ├── suppliers.json (10 suppliers)                     ││
│  │  ├── categories.json (16 categories)                   ││
│  │  ├── products.json (27 products)                       ││
│  │  ├── inventory.json (27 batches)                       ││
│  │  └── customers.json (12 customers)                     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### Login Flow
```
1. Frontend → auth.service.ts (login)
2. HTTP POST to /api/v1/auth/login
3. Backend Handler → AuthHandler.Login
4. Handler → AuthService.Authenticate
5. Service → StaffRepository.GetByUsername
6. Repository → SQLite (query staff table)
7. Response → JWT tokens + staff info
8. Frontend stores token in localStorage/context
```

### POS Session Flow
```
1. Frontend → pos.service.ts (createSession)
2. HTTP POST to /api/v1/pos/sessions
3. Backend Handler → POSHandler.CreateSession
4. Handler → POSService.CreateSession
5. Service → SalesSessionRepository.CreateSession
6. Repository → SQLite (insert into sales_sessions)
7. Response → Session object with UUID
8. Frontend stores in Zustand store (TODO)
```

### Seeding Flow
```
1. CLI: go run ./cmd/seeder/main.go
2. Seeder → database.InitDB
3. Seeder → database.AutoMigrate (creates all tables)
4. Seeder → SeederService.SeedAll
5. Service reads JSON files sequentially:
   - permissions.json → creates permissions
   - roles.json → creates roles + assign permissions
   - staff.json → creates staff with hashed passwords
   - suppliers.json → creates suppliers
   - categories.json → creates categories
   - products.json → creates products
   - inventory.json → creates inventory batches
   - customers.json → creates customers
6. All 137 records inserted into SQLite
```

## Key Integration Points

### Unified Database Initialization

**Location**: `backend/internal/database/migrations.go`

```go
func AutoMigrate(db *gorm.DB) error {
    // Called by:
    // 1. server/main.go - on startup
    // 2. seeder/main.go - before seeding

    // Creates all 13 tables automatically:
    // - roles, permissions, role_permissions
    // - staff, customers, suppliers
    // - categories, products, inventory_batches
    // - sales_sessions, sales_session_items
    // - sales, sale_items
}
```

**Benefits**:
- ✅ Single source of truth for schema
- ✅ Server creates tables automatically on startup
- ✅ Seeder creates tables before populating
- ✅ No manual schema management needed
- ✅ Easy to modify and track in git

### Seeder Service Integration

**Location**: `backend/internal/services/seeder_service.go`

```go
func (s *SeederService) SeedAll(dataPath string) error
    // 1. Load JSON files in dependency order
    // 2. Validate foreign key relationships
    // 3. Hash passwords with bcrypt
    // 4. Create all records atomically
    // 5. Return comprehensive error messages
}
```

**Dependency Order**:
1. Permissions (referenced by roles)
2. Roles (referenced by staff)
3. Staff (referenced by sales sessions)
4. Suppliers (referenced by inventory)
5. Categories (referenced by products)
6. Products (referenced by inventory & sales)
7. Inventory Batches (referenced by POS)
8. Customers (independent, used in POS)

## Table Relationships

```
roles ─┬─ role_permissions ─┬─ permissions
       │                   │
       └─ staff ──────────────────┘

customers ◄─┐
            │
suppliers ──┤─ inventory_batches ─┬─ products ─┬─ categories
            │                     │            │
            └─ sales_sessions ────┘            └─ categories
                    │                              (self-ref)
                    ├─ sales_session_items ───┘
                    │
                    └─ sales ──┬─ sale_items ─┘
                               │
                               └─ staff
                               └─ customers (optional)
```

## Execution Models

### Development Mode
```
┌─────────────────────────────────────────┐
│ 1. Start Seeder                         │
│    go run ./cmd/seeder/main.go          │
│    - Creates tables                     │
│    - Seeds 137 test records             │
│    ✓ Ready for testing                  │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 2. Start Server                         │
│    go run ./cmd/server/main.go          │
│    - Auto-creates any missing tables    │
│    - Connects to database               │
│    - Serves API on :8080                │
│    ✓ Ready for API calls                │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 3. Start Frontend (TODO)                │
│    npm run dev                          │
│    - Vite dev server                    │
│    - API proxy to :8080                 │
│    - Hot module reload                  │
│    ✓ Ready for testing                  │
└─────────────────────────────────────────┘
```

### Production Mode
```
┌──────────────────────────────────────────┐
│ 1. Prepare Production Data               │
│    mkdir seeders/data/production         │
│    cp seeders/data/* seeders/data/...    │
│    Edit JSON files with real data        │
│    ✓ Production data ready               │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│ 2. Run Seeder (One-time)                 │
│    ./seeder -data seeders/data/prod...   │
│    - Creates tables                      │
│    - Seeds production data               │
│    - Exits cleanly                       │
│    ✓ Database ready                      │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│ 3. Start Server (Continuous)             │
│    ./server                              │
│    - Ensures tables exist (AutoMigrate)  │
│    - Serves API and frontend             │
│    - Scales with multiple instances      │
│    ✓ System operational                  │
└──────────────────────────────────────────┘
```

## File Organization

```
next-inventory/
├── backend/
│   ├── cmd/
│   │   ├── server/
│   │   │   └── main.go (API Server with migrations)
│   │   └── seeder/
│   │       └── main.go (Database seeder)
│   ├── internal/
│   │   ├── database/
│   │   │   ├── db.go (Database connection)
│   │   │   └── migrations.go ⭐ (UNIFIED AutoMigrate)
│   │   ├── models/
│   │   │   └── *.go (13 GORM models)
│   │   ├── repositories/
│   │   │   └── *.go (7 repositories)
│   │   ├── services/
│   │   │   ├── seeder_service.go ⭐
│   │   │   └── *.go (other services)
│   │   ├── handlers/
│   │   │   └── *.go (5+ handlers)
│   │   ├── middleware/
│   │   │   └── *.go (Auth, CORS, etc.)
│   │   ├── auth/
│   │   └── logger/
│   ├── seeders/
│   │   ├── README.md (Detailed seeder docs)
│   │   └── data/
│   │       ├── permissions.json ⭐
│   │       ├── roles.json ⭐
│   │       ├── staff.json ⭐
│   │       ├── suppliers.json ⭐
│   │       ├── categories.json ⭐
│   │       ├── products.json ⭐
│   │       ├── inventory.json ⭐
│   │       └── customers.json ⭐
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── contexts/
│   ├── vite.config.ts
│   └── package.json
│
├── database/
│   └── inventory.db (SQLite file, created by seeder)
│
├── QUICK_START.md ⭐ (Start here!)
├── SEEDER_GUIDE.md ⭐ (Seeder customization)
├── ARCHITECTURE.md ⭐ (This file)
└── specs/
    └── 001-initial-pos-system/
        └── seeders/README.md
```

⭐ = Key unified/integrated components

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vite + React 19 | UI rendering |
| | TypeScript 5.9 | Type safety |
| | shadcn/ui | Component library |
| | Zustand (TBD) | State management |
| | Tailwind CSS | Styling |
| **Backend** | Go 1.23 | Server runtime |
| | Gin 1.x | HTTP framework |
| | GORM 1.25 | ORM |
| | SQLite 3 | Database |
| | JWT | Authentication |
| | bcrypt | Password hashing |
| **Database** | SQLite | Single file |
| | WAL mode | Concurrency |
| **Deployment** | Single binary | Go server |
| | Static files | Vite build output |

## Performance Characteristics

- **SQLite WAL Mode**: 5000ms busy timeout, 1M cache
- **Connection Pool**: 1 connection (SQLite limitation)
- **Prepared Statements**: Enabled for caching
- **API Response Time**: <200ms target for 95th percentile
- **POS Operations**: <1 second for typical transactions
- **Concurrent Sessions**: 5+ simultaneous POS sessions

## Security Model

```
┌────────────────────────────────────┐
│         JWT Tokens                 │
│  ├─ Access Token (15 min expiry)   │
│  └─ Refresh Token (168 hr expiry)  │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│      Permission Checking           │
│  ├─ Middleware validates JWT       │
│  ├─ Service checks permissions     │
│  └─ Handler filters results        │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│      Role-Based Access             │
│  ├─ Admin: All permissions         │
│  ├─ Manager: Staff + Reports       │
│  ├─ Cashier: Sales + Customers     │
│  ├─ Stock Manager: Inventory       │
│  └─ Sales Associate: Basic Sales   │
└────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests
- Repository methods (queries)
- Service business logic
- Permission validation

### Integration Tests
- API endpoints
- Database transactions
- Authentication flow

### E2E Tests (Frontend - TODO)
- Login flow
- POS session workflow
- Order completion

### Manual Testing
- Use seeded test accounts
- Run test scenarios from QUICK_START.md
- Verify permissions per role

## Extensibility

To add new entities:

1. **Create Model** in `internal/models/entity.go`
2. **Create Repository** in `internal/repositories/entity_repository.go`
3. **Create Service** in `internal/services/entity_service.go`
4. **Create Handler** in `internal/handlers/entity_handler.go`
5. **Add Routes** in `cmd/server/main.go`
6. **Add to AutoMigrate** in `internal/database/migrations.go`
7. **Create Seed JSON** in `seeders/data/entities.json`
8. **Add Seeding Logic** in `internal/services/seeder_service.go`

## Deployment Checklist

- [ ] Build backend: `go build ./cmd/server`
- [ ] Build seeder: `go build ./cmd/seeder`
- [ ] Prepare production seed data (edit JSON)
- [ ] Run seeder: `./seeder -data ./data/prod`
- [ ] Verify database: `sqlite3 inventory.db ".tables"`
- [ ] Start server: `./server`
- [ ] Test API endpoints
- [ ] Deploy frontend build to static files
- [ ] Monitor logs
- [ ] Backup database regularly

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Unified AutoMigrate** | Single source of truth for schema, works in both server and seeder |
| **JSON Seed Files** | Human-readable, version-controllable, customizable for production |
| **SQLite** | Single file, zero-setup, WAL for concurrency |
| **GORM ORM** | Type-safe, relationship management, migrations |
| **Repository Pattern** | Testable, swappable data access |
| **Service Layer** | Business logic separated from API |
| **Handler Layer** | HTTP-specific logic isolated |
| **Seeder Service** | Reusable, testable data loading |

---

For step-by-step setup, see [QUICK_START.md](QUICK_START.md)
For detailed seeder docs, see [SEEDER_GUIDE.md](SEEDER_GUIDE.md)
For seeder customization, see [backend/seeders/README.md](backend/seeders/README.md)
