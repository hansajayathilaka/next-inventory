# Tasks: Hardware Store POS and Inventory System

**Input**: Design documents from `/specs/001-initial-pos-system/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification, so no test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/` and `frontend/` at repository root
- Backend structure: `backend/internal/models/`, `backend/internal/services/`, `backend/internal/handlers/`
- Frontend structure: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/services/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend project structure according to plan.md in backend/
- [x] T002 [P] Initialize Go module and install dependencies (Gin, GORM, sqlite3) in backend/
- [x] T003 [P] Create frontend project with Vite + React + TypeScript in frontend/
- [x] T004 [P] Install and configure shadcn/ui and Tailwind CSS in frontend/
- [x] T005 [P] Install additional frontend dependencies (Zustand, React Hook Form, Zod) in frontend/
- [x] T006 [P] Configure Vite proxy for API calls in frontend/vite.config.ts
- [x] T007 [P] Setup environment configuration (.env files) for both backend and frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Setup SQLite database with WAL mode configuration in backend/internal/database/db.go
- [x] T009 [P] Implement JWT authentication framework in backend/internal/auth/
- [x] T010 [P] Create base GORM model struct with common fields in backend/internal/models/base.go
- [x] T011 [P] Setup Gin router with middleware structure in backend/cmd/server/main.go
- [x] T012 [P] Configure CORS and security middleware in backend/internal/middleware/
- [x] T013 [P] Create API error handling and response helpers in backend/internal/utils/
- [x] T014 [P] Setup logging infrastructure in backend/internal/logger/
- [x] T015 [P] Create authentication context and hooks in frontend/src/contexts/authContext.tsx
- [x] T016 [P] Setup base API client with axios in frontend/src/services/api.ts
- [x] T017 [P] Create common UI components (layout, navigation) in frontend/src/components/layout/
- [x] T018 [P] Setup routing structure with React Router in frontend/src/App.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Role and Permission Setup (Priority: P1) 🎯 MVP

**Goal**: Establish foundational security model with roles and permissions

**Independent Test**: Create roles, assign permissions, verify relationships are stored and retrievable

### Implementation for User Story 1

- [x] T019 [P] [US1] Create Role model in backend/internal/models/role.go
- [x] T020 [P] [US1] Create Permission model in backend/internal/models/permission.go
- [x] T021 [P] [US1] Create RolePermission junction model in backend/internal/models/role_permission.go
- [x] T022 [US1] Implement role repository in backend/internal/repositories/role_repository.go
- [x] T023 [US1] Implement permission repository in backend/internal/repositories/permission_repository.go
- [x] T024 [US1] Implement role service with permission assignment in backend/internal/services/role_service.go
- [x] T025 [US1] Create role management handlers in backend/internal/handlers/role_handler.go
- [x] T026 [US1] Create permission management handlers in backend/internal/handlers/permission_handler.go
- [x] T027 [US1] Add role and permission routes to router in backend/cmd/server/main.go
- [x] T028 [P] [US1] Create role management components in frontend/src/components/roles/
- [x] T029 [P] [US1] Create permission management components in frontend/src/components/permissions/
- [x] T030 [US1] Create roles page in frontend/src/pages/RolesPage.tsx
- [x] T031 [US1] Create role API service in frontend/src/services/roles.service.ts
- [x] T032 [US1] Add role management routes to frontend routing in frontend/src/App.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Staff Account Management (Priority: P1)

**Goal**: Create and manage staff accounts with role assignments for system authentication

**Independent Test**: Create staff accounts, assign roles, verify login functionality and role-based access

### Implementation for User Story 2

- [x] T033 [US2] Create Staff model in backend/internal/models/staff.go
- [x] T034 [US2] Implement staff repository in backend/internal/repositories/staff_repository.go
- [x] T035 [US2] Implement staff service with authentication logic in backend/internal/services/staff_service.go
- [x] T036 [US2] Create staff management handlers in backend/internal/handlers/staff_handler.go
- [x] T037 [US2] Create authentication handlers (login/logout) in backend/internal/handlers/auth_handler.go
- [x] T038 [US2] Add staff and auth routes to router in backend/cmd/server/main.go
- [x] T039 [US2] Update JWT service to include staff permissions in backend/internal/auth/jwt.go
- [x] T040 [P] [US2] Create staff management components in frontend/src/components/staff/
- [x] T041 [P] [US2] Create login form component in frontend/src/components/auth/LoginForm.tsx
- [x] T042 [US2] Create staff page in frontend/src/pages/StaffPage.tsx
- [x] T043 [US2] Create login page in frontend/src/pages/LoginPage.tsx
- [x] T044 [US2] Create staff API service in frontend/src/services/staff.service.ts
- [x] T045 [US2] Create auth API service in frontend/src/services/auth.service.ts
- [x] T046 [US2] Update auth context with staff management in frontend/src/contexts/authContext.tsx
- [x] T047 [US2] Add protected route wrapper in frontend/src/components/auth/ProtectedRoute.tsx
- [x] T048 [US2] Update routing with protected routes in frontend/src/App.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 9 - Multi-Session POS Sales (Priority: P1) 🎯 CORE POS

**Goal**: Core POS functionality with multi-session support for serving multiple customers

**Independent Test**: Create multiple sales sessions, add items, switch between sessions, maintain independent carts

**Note**: Moving POS to Phase 5 because it's core business functionality and needed before customer/supplier/product setup

### Implementation for User Story 9

- [x] T049 [P] [US9] Create SalesSession model in backend/internal/models/sales_session.go
- [x] T050 [P] [US9] Create SalesSessionItem model in backend/internal/models/sales_session_item.go
- [x] T051 [US9] Implement sales session repository in backend/internal/repositories/sales_session_repository.go
- [x] T052 [US9] Implement POS service with multi-session logic in backend/internal/services/pos_service.go
- [x] T053 [US9] Create POS session handlers in backend/internal/handlers/pos_handler.go
- [x] T054 [US9] Add POS routes to router in backend/cmd/server/main.go
- [x] T055 [P] [US9] Create Zustand POS store in frontend/src/stores/posStore.ts
- [x] T056 [P] [US9] Create session management components in frontend/src/components/pos/SessionManager.tsx
- [x] T057 [P] [US9] Create cart components in frontend/src/components/pos/Cart.tsx
- [x] T058 [P] [US9] Create product selector components in frontend/src/components/pos/ProductSelector.tsx
- [x] T059 [US9] Create POS page in frontend/src/pages/POSPage.tsx
- [x] T060 [US9] Create POS API service in frontend/src/services/pos.service.ts
- [x] T061 [US9] Implement session auto-save functionality in frontend/src/hooks/usePOSAutoSave.ts
- [x] T062 [US9] Implement session timeout handling in frontend/src/hooks/useSessionTimeout.ts
- [x] T063 [US9] Add POS route to frontend routing in frontend/src/App.tsx

**Checkpoint**: At this point, basic POS functionality should work with mock data

---

## Phase 6: User Story 10 - Payment Processing and Credit Management (Priority: P1)

**Goal**: Complete sales transactions with cash, card, or credit payment options

**Independent Test**: Complete sales with each payment method, verify credit balances, process settlements

### Implementation for User Story 10

- [x] T064 [P] [US10] Create Sale model in backend/internal/models/sale.go
- [x] T065 [P] [US10] Create SaleItem model in backend/internal/models/sale_item.go
- [x] T066 [P] [US10] Create CreditTransaction model in backend/internal/models/credit_transaction.go
- [x] T067 [P] [US10] Create CreditSettlement model in backend/internal/models/credit_settlement.go
- [x] T068 [US10] Implement sale repository in backend/internal/repositories/sale_repository.go
- [x] T069 [US10] Implement credit repository in backend/internal/repositories/credit_repository.go
- [x] T070 [US10] Implement payment service in backend/internal/services/payment_service.go
- [x] T071 [US10] Implement credit service in backend/internal/services/credit_service.go
- [x] T072 [US10] Create payment handlers in backend/internal/handlers/payment_handler.go
- [x] T073 [US10] Create credit handlers in backend/internal/handlers/credit_handler.go
- [x] T074 [US10] Add payment and credit routes to router in backend/cmd/server/main.go
- [x] T075 [P] [US10] Create payment method components in frontend/src/components/pos/PaymentMethods.tsx
- [x] T076 [P] [US10] Create payment confirmation components in frontend/src/components/pos/PaymentConfirmation.tsx
- [x] T077 [P] [US10] Create credit management components in frontend/src/components/credits/
- [x] T078 [US10] Create credits page in frontend/src/pages/CreditsPage.tsx
- [x] T079 [US10] Create payment API service in frontend/src/services/payments.service.ts
- [x] T080 [US10] Create credits API service in frontend/src/services/credits.service.ts
- [x] T081 [US10] Update POS store with payment processing in frontend/src/stores/posStore.ts
- [x] T082 [US10] Add credit limit warning logic in frontend/src/components/pos/CreditWarning.tsx

**Checkpoint**: At this point, complete sales flow should work with payment processing

---

## Phase 7: User Story 12 - Receipt Printing (Priority: P1)

**Goal**: Generate and print receipts for completed sales and returns

**Independent Test**: Complete sales/returns, verify receipt generation with all required information

### Implementation for User Story 12

- [x] T083 [US12] Implement receipt service with PDF generation in backend/internal/services/receipt_service.go
- [x] T084 [US12] Create receipt handlers in backend/internal/handlers/receipt_handler.go
- [x] T085 [US12] Add receipt routes to router in backend/cmd/server/main.go
- [x] T086 [P] [US12] Create receipt viewer component in frontend/src/components/receipts/ReceiptViewer.tsx
- [x] T087 [P] [US12] Create print functionality in frontend/src/components/receipts/PrintReceipt.tsx
- [x] T088 [US12] Create receipt API service in frontend/src/services/receipts.service.ts
- [x] T089 [US12] Integrate receipt generation into POS flow in frontend/src/components/pos/
- [x] T090 [US12] Add receipt printing to payment confirmation in frontend/src/components/pos/PaymentConfirmation.tsx

**Checkpoint**: At this point, MVP POS system is complete with core functionality

---

## Phase 8: User Story 3 - Customer Registration (Priority: P2)

**Goal**: Register and manage customer information for credit tracking and sales history

**Independent Test**: Create customers with minimal/full information, search, edit customer details

### Implementation for User Story 3

- [ ] T091 [US3] Create Customer model in backend/internal/models/customer.go
- [ ] T092 [US3] Implement customer repository in backend/internal/repositories/customer_repository.go
- [ ] T093 [US3] Implement customer service in backend/internal/services/customer_service.go
- [ ] T094 [US3] Create customer handlers in backend/internal/handlers/customer_handler.go
- [ ] T095 [US3] Add customer routes to router in backend/cmd/server/main.go
- [ ] T096 [P] [US3] Create customer management components in frontend/src/components/customers/
- [ ] T097 [P] [US3] Create customer search component in frontend/src/components/customers/CustomerSearch.tsx
- [ ] T098 [US3] Create customers page in frontend/src/pages/CustomersPage.tsx
- [ ] T099 [US3] Create customer API service in frontend/src/services/customers.service.ts
- [ ] T100 [US3] Integrate customer selection into POS in frontend/src/components/pos/CustomerSelector.tsx
- [ ] T101 [US3] Add customer route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Customer management integrated with existing POS functionality

---

## Phase 9: User Story 4 - Supplier Management (Priority: P2)

**Goal**: Maintain supplier records for inventory management and procurement

**Independent Test**: Create suppliers with contact information, list, update supplier details

### Implementation for User Story 4

- [ ] T102 [US4] Create Supplier model in backend/internal/models/supplier.go
- [ ] T103 [US4] Implement supplier repository in backend/internal/repositories/supplier_repository.go
- [ ] T104 [US4] Implement supplier service in backend/internal/services/supplier_service.go
- [ ] T105 [US4] Create supplier handlers in backend/internal/handlers/supplier_handler.go
- [ ] T106 [US4] Add supplier routes to router in backend/cmd/server/main.go
- [ ] T107 [P] [US4] Create supplier management components in frontend/src/components/suppliers/
- [ ] T108 [US4] Create suppliers page in frontend/src/pages/SuppliersPage.tsx
- [ ] T109 [US4] Create supplier API service in frontend/src/services/suppliers.service.ts
- [ ] T110 [US4] Add supplier route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Supplier management ready for inventory operations

---

## Phase 10: User Story 5 - Hierarchical Category Organization (Priority: P2)

**Goal**: Organize products into hierarchical categories for better navigation

**Independent Test**: Create parent/child categories, verify hierarchy relationships, test navigation

### Implementation for User Story 5

- [ ] T111 [US5] Create Category model with self-referential relationship in backend/internal/models/category.go
- [ ] T112 [US5] Implement category repository with hierarchy queries in backend/internal/repositories/category_repository.go
- [ ] T113 [US5] Implement category service with hierarchy logic in backend/internal/services/category_service.go
- [ ] T114 [US5] Create category handlers in backend/internal/handlers/category_handler.go
- [ ] T115 [US5] Add category routes to router in backend/cmd/server/main.go
- [ ] T116 [P] [US5] Create category tree component in frontend/src/components/categories/CategoryTree.tsx
- [ ] T117 [P] [US5] Create category management components in frontend/src/components/categories/
- [ ] T118 [US5] Create categories page in frontend/src/pages/CategoriesPage.tsx
- [ ] T119 [US5] Create category API service in frontend/src/services/categories.service.ts
- [ ] T120 [US5] Add category route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Category hierarchy ready for product organization

---

## Phase 11: User Story 6 - Product Catalog Management (Priority: P2)

**Goal**: Create and maintain product catalog with codes, descriptions, and attributes

**Independent Test**: Create products with unique codes, assign categories, add custom attributes, search products

### Implementation for User Story 6

- [ ] T121 [US6] Create Product model in backend/internal/models/product.go
- [ ] T122 [US6] Implement product repository with search functionality in backend/internal/repositories/product_repository.go
- [ ] T123 [US6] Implement product service in backend/internal/services/product_service.go
- [ ] T124 [US6] Create product handlers in backend/internal/handlers/product_handler.go
- [ ] T125 [US6] Add product routes to router in backend/cmd/server/main.go
- [ ] T126 [P] [US6] Create product management components in frontend/src/components/products/
- [ ] T127 [P] [US6] Create product search component in frontend/src/components/products/ProductSearch.tsx
- [ ] T128 [P] [US6] Create product form with custom attributes in frontend/src/components/products/ProductForm.tsx
- [ ] T129 [US6] Create products page in frontend/src/pages/ProductsPage.tsx
- [ ] T130 [US6] Create product API service in frontend/src/services/products.service.ts
- [ ] T131 [US6] Update POS product selector with real products in frontend/src/components/pos/ProductSelector.tsx
- [ ] T132 [US6] Add product route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Product catalog integrated with POS functionality

---

## Phase 12: User Story 7 - Multi-Batch Inventory Tracking (Priority: P2)

**Goal**: Track inventory in separate batches per purchase with independent pricing

**Independent Test**: Receive same product from same supplier at different prices, verify separate batch tracking

### Implementation for User Story 7

- [ ] T133 [US7] Create InventoryBatch model in backend/internal/models/inventory_batch.go
- [ ] T134 [US7] Implement inventory repository with FIFO queries in backend/internal/repositories/inventory_repository.go
- [ ] T135 [US7] Implement inventory service with batch management in backend/internal/services/inventory_service.go
- [ ] T136 [US7] Create inventory handlers in backend/internal/handlers/inventory_handler.go
- [ ] T137 [US7] Add inventory routes to router in backend/cmd/server/main.go
- [ ] T138 [US7] Update POS service to use batch-based inventory in backend/internal/services/pos_service.go
- [ ] T139 [P] [US7] Create inventory management components in frontend/src/components/inventory/
- [ ] T140 [P] [US7] Create batch view component in frontend/src/components/inventory/BatchView.tsx
- [ ] T141 [P] [US7] Create inventory adjustment components in frontend/src/components/inventory/InventoryAdjustment.tsx
- [ ] T142 [US7] Create inventory page in frontend/src/pages/InventoryPage.tsx
- [ ] T143 [US7] Create inventory API service in frontend/src/services/inventory.service.ts
- [ ] T144 [US7] Update POS to show batch selection in frontend/src/components/pos/BatchSelector.tsx
- [ ] T145 [US7] Add inventory route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Batch-based inventory tracking fully integrated

---

## Phase 13: User Story 8 - Purchase Order Recording (Priority: P3)

**Goal**: Record purchases from suppliers that automatically create inventory batches

**Independent Test**: Create purchase orders, verify inventory batch creation, view purchase history

### Implementation for User Story 8

- [ ] T146 [P] [US8] Create Purchase model in backend/internal/models/purchase.go
- [ ] T147 [P] [US8] Create PurchaseLineItem model in backend/internal/models/purchase_line_item.go
- [ ] T148 [US8] Implement purchase repository in backend/internal/repositories/purchase_repository.go
- [ ] T149 [US8] Implement purchase service with inventory integration in backend/internal/services/purchase_service.go
- [ ] T150 [US8] Create purchase handlers in backend/internal/handlers/purchase_handler.go
- [ ] T151 [US8] Add purchase routes to router in backend/cmd/server/main.go
- [ ] T152 [P] [US8] Create purchase management components in frontend/src/components/purchases/
- [ ] T153 [P] [US8] Create purchase form component in frontend/src/components/purchases/PurchaseForm.tsx
- [ ] T154 [P] [US8] Create purchase history component in frontend/src/components/purchases/PurchaseHistory.tsx
- [ ] T155 [US8] Create purchases page in frontend/src/pages/PurchasesPage.tsx
- [ ] T156 [US8] Create purchase API service in frontend/src/services/purchases.service.ts
- [ ] T157 [US8] Add purchase route to frontend routing in frontend/src/App.tsx

**Checkpoint**: Purchase management integrated with inventory system

---

## Phase 14: User Story 11 - Sales Returns (Priority: P2)

**Goal**: Process returns with inventory restoration and manager approval for old sales

**Independent Test**: Complete sale, process return, verify inventory restoration and manager approval workflow

### Implementation for User Story 11

- [ ] T158 [P] [US11] Create Return model in backend/internal/models/return.go
- [ ] T159 [P] [US11] Create ReturnItem model in backend/internal/models/return_item.go
- [ ] T160 [US11] Implement return repository in backend/internal/repositories/return_repository.go
- [ ] T161 [US11] Implement return service with manager approval logic in backend/internal/services/return_service.go
- [ ] T162 [US11] Create return handlers in backend/internal/handlers/return_handler.go
- [ ] T163 [US11] Add return routes to router in backend/cmd/server/main.go
- [ ] T164 [US11] Update receipt service to support return receipts in backend/internal/services/receipt_service.go
- [ ] T165 [P] [US11] Create return management components in frontend/src/components/returns/
- [ ] T166 [P] [US11] Create return form component in frontend/src/components/returns/ReturnForm.tsx
- [ ] T167 [P] [US11] Create manager approval component in frontend/src/components/returns/ManagerApproval.tsx
- [ ] T168 [US11] Create returns page in frontend/src/pages/ReturnsPage.tsx
- [ ] T169 [US11] Create return API service in frontend/src/services/returns.service.ts
- [ ] T170 [US11] Integrate return processing into POS in frontend/src/components/pos/ReturnProcessor.tsx
- [ ] T171 [US11] Add return route to frontend routing in frontend/src/App.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T172 [P] Add dashboard with key metrics in frontend/src/pages/DashboardPage.tsx
- [ ] T173 [P] Create transaction history view in frontend/src/components/transactions/TransactionHistory.tsx
- [ ] T174 [P] Add data export functionality in backend/internal/services/export_service.go
- [ ] T175 [P] Implement search functionality across entities in backend/internal/services/search_service.go
- [ ] T176 [P] Add audit logging for sensitive operations in backend/internal/middleware/audit.go
- [ ] T177 [P] Performance optimization for inventory queries in backend/internal/repositories/
- [ ] T178 [P] Add data validation and error handling improvements across all forms
- [ ] T179 [P] Security hardening and permission boundary checks
- [ ] T180 Run quickstart.md validation and setup verification

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Role & Permission Setup - No dependencies on other stories
- **User Story 2 (P1)**: Staff Account Management - Depends on US1 (needs roles)
- **User Story 9 (P1)**: Multi-Session POS - Can start after foundational, works with mock data initially
- **User Story 10 (P1)**: Payment Processing - Depends on US9 (needs sessions), integrates with US3 (customer credit)
- **User Story 12 (P1)**: Receipt Printing - Depends on US10 (needs completed sales)
- **User Story 3 (P2)**: Customer Registration - Independent, integrates with US10 for credit
- **User Story 4 (P2)**: Supplier Management - Independent, needed for US7/US8
- **User Story 5 (P2)**: Category Organization - Independent, needed for US6
- **User Story 6 (P2)**: Product Catalog - Depends on US5 (categories), integrates with US9 (POS)
- **User Story 7 (P2)**: Inventory Tracking - Depends on US4 (suppliers), US6 (products)
- **User Story 8 (P3)**: Purchase Recording - Depends on US4 (suppliers), US6 (products), US7 (inventory)
- **User Story 11 (P2)**: Sales Returns - Depends on US10 (completed sales), US7 (inventory restoration)

### Within Each User Story

- Models before services
- Services before handlers
- Handlers before routes
- Backend implementation before frontend components
- Core components before integration components
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, multiple user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Frontend components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create Role model in backend/internal/models/role.go"
Task: "Create Permission model in backend/internal/models/permission.go"
Task: "Create RolePermission junction model in backend/internal/models/role_permission.go"

# Launch all frontend components for User Story 1 together:
Task: "Create role management components in frontend/src/components/roles/"
Task: "Create permission management components in frontend/src/components/permissions/"
```

---

## Implementation Strategy

### MVP First (Core POS - User Stories 1, 2, 9, 10, 12)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Roles & Permissions)
4. Complete Phase 4: User Story 2 (Staff Management)
5. Complete Phase 5: User Story 9 (Multi-Session POS)
6. Complete Phase 6: User Story 10 (Payment Processing)
7. Complete Phase 7: User Story 12 (Receipt Printing)
8. **STOP and VALIDATE**: Test core POS functionality end-to-end
9. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 → Authentication system ready
3. Add User Story 9 + 10 + 12 → MVP POS system ready → **DEPLOY/DEMO**
4. Add User Story 3 → Customer management → Enhanced POS
5. Add User Stories 4 + 5 + 6 → Supplier/Product management → Full catalog
6. Add User Story 7 → Advanced inventory → Production-ready
7. Add User Stories 8 + 11 → Complete system → Full feature set

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Stories 1 + 2 (Auth system)
   - Developer B: User Story 9 (POS core)
   - Developer C: User Stories 10 + 12 (Payments + Receipts)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are not included as they were not explicitly requested in the specification
- Core POS functionality (US1, US2, US9, US10, US12) forms the MVP
- Product management features (US3-US8, US11) can be added incrementally