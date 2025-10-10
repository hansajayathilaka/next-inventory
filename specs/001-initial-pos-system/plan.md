# Implementation Plan: Hardware Store POS and Inventory System

**Branch**: `001-initial-pos-system` | **Date**: 2025-10-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-initial-pos-system/spec.md`

## Summary

Build a complete point-of-sale and inventory management system for a single hardware store specializing in bike and three-wheel spare parts. The system features role-based access control, multi-entity management (staff, customers, suppliers, categories, products), batch-based inventory tracking with per-purchase pricing, multi-session POS with dual-level discounts, credit management with soft limits, and returns processing with manager approval for old returns. Frontend built with Vite + React + shadcn/ui, backend with Go + Gin framework, GORM for ORM, and SQLite for database.

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.9 with React 19
- Backend: Go 1.23 (latest)

**Primary Dependencies**:
- Frontend: Vite, React, shadcn/ui (Radix UI + Tailwind CSS)
- Backend: Gin web framework, GORM (ORM), go-sqlite3

**Storage**: SQLite (single file database)

**Testing**:
- Frontend: Vitest, React Testing Library
- Backend: Go testing package, testify

**Target Platform**:
- Frontend: Modern browsers (Chrome, Firefox, Edge)
- Backend: Linux/Windows server
- Deployment: Single-machine setup (both frontend and backend on same host)

**Project Type**: Web application (separate frontend and backend)

**Performance Goals**:
- API response time: <200ms for 95th percentile
- POS operations: <1 second for typical transactions
- Support 5+ simultaneous POS sessions without degradation
- Search operations: <1 second for 10,000 products

**Constraints**:
- Single-shop operation (no multi-tenancy)
- Minimal UI (functional over aesthetic)
- No external payment gateway integration
- Offline-capable not required (assumes stable network)
- Single payment method per transaction
- Session timeout: 5 hours of inactivity
- Return approval: Manager required for returns >7 days old

**Scale/Scope**:
- Up to 10,000 products
- 10-20 staff members
- Hundreds of customers
- Thousands of inventory batches
- Years of transaction history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No constitution file exists yet - first feature in project.

**Default Gates Applied**:
- ✅ Clear separation of concerns (frontend/backend)
- ✅ Single responsibility per module
- ✅ Testability (unit + integration tests planned)
- ✅ Simple architecture (no over-engineering)
- ✅ Standard patterns (REST API, React components, Go services)

**Re-evaluation after Phase 1**: Will verify data model and API contracts meet simplicity and testability requirements.

## Project Structure

### Documentation (this feature)

```
specs/001-initial-pos-system/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── api-spec.yaml    # OpenAPI specification
├── checklists/          # Quality validation
│   └── requirements.md  # Specification quality checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET)
```

### Source Code (repository root)

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── models/                  # GORM models (entities)
│   │   ├── role.go
│   │   ├── permission.go
│   │   ├── staff.go
│   │   ├── customer.go
│   │   ├── supplier.go
│   │   ├── category.go
│   │   ├── product.go
│   │   ├── inventory_batch.go
│   │   ├── purchase.go
│   │   ├── sales_session.go
│   │   ├── sale.go
│   │   ├── return.go
│   │   └── credit.go
│   ├── repositories/            # Data access layer
│   │   └── [entity]_repository.go
│   ├── services/                # Business logic
│   │   ├── auth_service.go
│   │   ├── role_service.go
│   │   ├── staff_service.go
│   │   ├── customer_service.go
│   │   ├── supplier_service.go
│   │   ├── category_service.go
│   │   ├── product_service.go
│   │   ├── inventory_service.go
│   │   ├── purchase_service.go
│   │   ├── pos_service.go
│   │   ├── payment_service.go
│   │   ├── credit_service.go
│   │   └── return_service.go
│   ├── handlers/                # HTTP handlers (Gin)
│   │   ├── auth_handler.go
│   │   ├── role_handler.go
│   │   ├── staff_handler.go
│   │   ├── customer_handler.go
│   │   ├── supplier_handler.go
│   │   ├── category_handler.go
│   │   ├── product_handler.go
│   │   ├── inventory_handler.go
│   │   ├── purchase_handler.go
│   │   ├── pos_handler.go
│   │   ├── payment_handler.go
│   │   ├── credit_handler.go
│   │   └── return_handler.go
│   ├── middleware/              # Auth, logging, error handling
│   │   ├── auth_middleware.go
│   │   ├── permission_middleware.go
│   │   └── logging_middleware.go
│   └── database/                # Database connection and migrations
│       ├── connection.go
│       └── migrations.go
├── tests/
│   ├── integration/             # API integration tests
│   └── unit/                    # Service/repository unit tests
├── go.mod
└── go.sum

frontend/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── layout/              # Layout components (header, nav, etc.)
│   │   ├── auth/                # Login, session management
│   │   ├── roles/               # Role management components
│   │   ├── staff/               # Staff management components
│   │   ├── customers/           # Customer management components
│   │   ├── suppliers/           # Supplier management components
│   │   ├── categories/          # Category management components
│   │   ├── products/            # Product management components
│   │   ├── inventory/           # Inventory management components
│   │   ├── purchases/           # Purchase management components
│   │   ├── pos/                 # POS components (multi-session)
│   │   ├── payments/            # Payment processing components
│   │   ├── credits/             # Credit management components
│   │   └── returns/             # Returns processing components
│   ├── pages/                   # Page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── RolesPage.tsx
│   │   ├── StaffPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── PurchasesPage.tsx
│   │   ├── POSPage.tsx
│   │   ├── CreditsPage.tsx
│   │   └── ReturnsPage.tsx
│   ├── services/                # API client services
│   │   ├── api.ts               # Base API client (axios/fetch)
│   │   ├── auth.service.ts
│   │   ├── roles.service.ts
│   │   ├── staff.service.ts
│   │   ├── customers.service.ts
│   │   ├── suppliers.service.ts
│   │   ├── categories.service.ts
│   │   ├── products.service.ts
│   │   ├── inventory.service.ts
│   │   ├── purchases.service.ts
│   │   ├── pos.service.ts
│   │   ├── payments.service.ts
│   │   ├── credits.service.ts
│   │   └── returns.service.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── usePOSSessions.ts
│   ├── lib/                     # Utilities
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── components/              # Component tests
│   └── integration/             # E2E tests (optional)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js

database/
└── inventory.db                 # SQLite database file

docs/
└── ER-diagram.md                # Entity-relationship diagram (Mermaid)
```

**Structure Decision**: Web application structure selected due to frontend (Vite + React) and backend (Go + Gin) separation specified in requirements. Frontend handles UI rendering and user interactions, backend handles business logic, data persistence, and API endpoints. SQLite database stored as single file for simplicity of single-shop deployment.

## Complexity Tracking

*No constitution violations - complexity tracking not required.*

This is a straightforward CRUD application with standard patterns:
- Repository pattern for data access (common in Go)
- Service layer for business logic
- RESTful API design
- Component-based UI (React standard)
- No complex distributed systems
- No microservices
- No external integrations

## Phase 0: Research & Decisions

### Research Topics

1. **Go + Gin + GORM + SQLite Integration**
   - Best practices for structuring Gin applications
   - GORM relationship modeling and performance optimization
   - SQLite concurrency handling and write locking
   - Session management and JWT token strategies

2. **React + Vite + shadcn/ui Setup**
   - Vite configuration for development and production
   - shadcn/ui component integration and customization
   - State management strategy (Context API vs Zustand)
   - Form handling and validation

3. **Authentication & Authorization**
   - JWT token generation and validation in Go
   - Permission-based access control implementation
   - Session timeout handling (5 hours)
   - Manager approval workflow for restricted operations

4. **Multi-Session POS Architecture**
   - Frontend state management for multiple active sessions
   - Backend session persistence strategy
   - Real-time updates vs polling for session switching
   - Session cleanup and expiry

5. **Inventory Batch Tracking**
   - Database schema for batch-based inventory
   - FIFO/LIFO selection strategies
   - Batch traceability for returns
   - Performance optimization for batch queries

6. **Receipt Generation**
   - PDF generation libraries in Go
   - Thermal printer formatting standards
   - Receipt template design
   - Browser printing APIs

**Output**: `research.md` documenting decisions and rationale for each topic

## Phase 1: Design & Contracts

### Data Model (`data-model.md`)

Based on Key Entities from spec.md, create detailed data model with:
- Entity schemas with field types
- Relationships (one-to-many, many-to-many)
- Indexes for performance
- Constraints and validation rules
- State transitions where applicable

Key entities to model:
- Role, Permission, RolePermission (many-to-many)
- Staff (with hashed password)
- Customer (with optional credit limit)
- Supplier
- Category (self-referential for hierarchy)
- Product (with custom attributes as JSON)
- InventoryBatch (linked to Purchase, Supplier, Product)
- Purchase, PurchaseLineItem
- SalesSession, SalesSessionItem (with batch reference)
- Sale, SaleItem (immutable after creation)
- CreditTransaction, CreditSettlement
- Return, ReturnItem

### API Contracts (`contracts/api-spec.yaml`)

Generate OpenAPI 3.0 specification for all endpoints:

**Authentication**
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

**Role & Permission Management**
- GET /api/roles
- POST /api/roles
- GET /api/roles/:id
- PUT /api/roles/:id
- DELETE /api/roles/:id
- GET /api/permissions
- POST /api/roles/:id/permissions
- DELETE /api/roles/:id/permissions/:permissionId

**Staff Management**
- GET /api/staff
- POST /api/staff
- GET /api/staff/:id
- PUT /api/staff/:id
- PUT /api/staff/:id/deactivate

**Customer Management**
- GET /api/customers
- POST /api/customers
- GET /api/customers/:id
- PUT /api/customers/:id
- GET /api/customers/search?name=...

**Supplier Management**
- GET /api/suppliers
- POST /api/suppliers
- GET /api/suppliers/:id
- PUT /api/suppliers/:id

**Category Management**
- GET /api/categories
- GET /api/categories/tree
- POST /api/categories
- GET /api/categories/:id
- PUT /api/categories/:id
- DELETE /api/categories/:id

**Product Management**
- GET /api/products
- POST /api/products
- GET /api/products/:id
- PUT /api/products/:id
- DELETE /api/products/:id
- GET /api/products/search?q=...

**Inventory Management**
- GET /api/inventory
- GET /api/inventory/product/:productId
- PUT /api/inventory/batch/:batchId/adjust

**Purchase Management**
- GET /api/purchases
- POST /api/purchases
- GET /api/purchases/:id
- GET /api/purchases?supplier=...&dateFrom=...&dateTo=...

**POS Sales Management**
- GET /api/pos/sessions
- POST /api/pos/sessions
- GET /api/pos/sessions/:id
- PUT /api/pos/sessions/:id
- DELETE /api/pos/sessions/:id
- POST /api/pos/sessions/:id/items
- PUT /api/pos/sessions/:id/items/:itemId
- DELETE /api/pos/sessions/:id/items/:itemId
- POST /api/pos/sessions/:id/discounts
- GET /api/inventory/batches/product/:productId/available

**Payment Processing**
- POST /api/pos/sessions/:id/payment
- GET /api/sales/:id/receipt

**Credit Management**
- GET /api/customers/:id/credits
- POST /api/customers/:id/credits/settle

**Returns Management**
- GET /api/sales/:id
- POST /api/returns
- POST /api/returns/approve (manager only)
- GET /api/returns/:id/receipt

### Quickstart Guide (`quickstart.md`)

Developer setup instructions:
1. Prerequisites (Go, Node.js, SQLite)
2. Backend setup (install deps, run migrations, start server)
3. Frontend setup (install deps, configure API endpoint, start dev server)
4. Create initial admin user
5. Access application and verify basic flow

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update Claude-specific context with:
- Technology stack (Go, Gin, GORM, SQLite, React, Vite, shadcn/ui)
- Project structure
- Key architectural decisions

## Phase 2: Task Generation

**NOT INCLUDED IN THIS COMMAND** - Use `/speckit.tasks` after Phase 1 completion.

Tasks will be generated based on:
- Implementation order from spec (roles → staff → customers → ... → POS)
- Each feature includes full stack (backend models/services/handlers + frontend components/pages)
- Database migrations for each entity group
- Tests for each feature before moving to next

## Next Steps

After this plan is approved:

1. **Phase 0 Execution**: Generate `research.md` by researching all identified topics
2. **Phase 1 Execution**: Generate `data-model.md`, `contracts/api-spec.yaml`, `quickstart.md`
3. **Constitution Re-check**: Verify design meets simplicity and testability gates
4. **Task Generation**: Run `/speckit.tasks` to generate implementation tasks
5. **Implementation**: Execute tasks feature-by-feature with demos after each feature

**Ready to proceed with Phase 0 research.**
