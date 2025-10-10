# Research & Technology Decisions

**Feature**: Hardware Store POS and Inventory System
**Date**: 2025-10-09
**Status**: Completed

## Executive Summary

This document captures all technology research and architectural decisions for the POS system. All decisions prioritize simplicity, maintainability, and alignment with the specified tech stack (Go + Gin + GORM + SQLite for backend, Vite + React + shadcn/ui for frontend).

---

## 1. Go + Gin + GORM + SQLite Integration

### Decision: Layered Architecture with WAL Mode SQLite

**Chosen Approach:**
- **Architecture**: Handler → Service → Repository pattern
- **Database Mode**: Write-Ahead Logging (WAL)
- **Connection Pool**: Single connection (SetMaxOpenConns(1))
- **Prepared Statements**: Enabled for performance

**Rationale:**
- **Layered Architecture**: Separates HTTP handling, business logic, and data access for testability
- **WAL Mode**: Allows multiple readers + 1 writer simultaneously (essential for 5+ POS sessions)
- **Single Connection**: SQLite limitation - multiple connections cause "database is locked" errors
- **PreparedStmt**: Doubles query performance (research shows 23k → 43k req/s improvement)

**Configuration:**

```go
// Database initialization
func InitDB(dbPath string) (*gorm.DB, error) {
    dsn := fmt.Sprintf("%s?_journal_mode=WAL&_busy_timeout=5000&_synchronous=NORMAL&_cache_size=1000000000&_foreign_keys=ON", dbPath)

    db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{
        PrepareStmt: true,
    })

    sqlDB, _ := db.DB()
    sqlDB.SetMaxOpenConns(1)   // Critical for SQLite
    sqlDB.SetMaxIdleConns(1)
    sqlDB.SetConnMaxLifetime(0)

    return db, nil
}
```

**Key PRAGMA Settings:**
- `journal_mode=WAL`: Concurrent reads + writes
- `busy_timeout=5000`: Wait 5 seconds for lock (prevents immediate failures)
- `synchronous=NORMAL`: Balanced durability (safe with WAL)
- `cache_size=1000000000`: ~1GB page cache for hot data
- `foreign_keys=ON`: Data integrity enforcement

**Alternatives Considered:**
- **Multiple Connections**: Rejected - causes database locks
- **ROLLBACK Journal**: Rejected - writers block all readers
- **PostgreSQL**: Rejected - overkill for single-shop deployment

**References:**
- GORM documentation on SQLite configuration
- Research on SQLite concurrency patterns
- Production deployments with 10,000+ products

---

## 2. React + Vite + shadcn/ui Setup

### Decision: Vite + TypeScript + shadcn/ui + Zustand

**Chosen Stack:**
- **Build Tool**: Vite (fast dev server, optimized builds)
- **Language**: TypeScript (type safety)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Zustand (lightweight, simple API)
- **Form Handling**: React Hook Form + Zod validation

**Rationale:**
- **Vite**: 10-100x faster than CRA, optimized for modern browsers
- **TypeScript**: Type safety prevents runtime errors in POS operations
- **shadcn/ui**: Copy-paste components (not npm dependency), full customization
- **Zustand**: Simpler than Redux, better performance than Context API for frequent updates
- **React Hook Form**: Minimal re-renders, built-in validation support

**Project Initialization:**

```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui
npx shadcn-ui@latest init

# Install state management
npm install zustand

# Install form handling
npm install react-hook-form @hookform/resolvers zod
```

**Zustand Store Example (Multi-Session POS):**

```typescript
// src/stores/posStore.ts
import { create } from 'zustand';

interface POSSession {
  id: string;
  items: CartItem[];
  customer?: Customer;
  discounts: Discount[];
  createdAt: Date;
}

interface POSStore {
  sessions: POSSession[];
  activeSessionId: string | null;

  // Actions
  createSession: () => void;
  switchSession: (id: string) => void;
  addItem: (sessionId: string, item: CartItem) => void;
  removeItem: (sessionId: string, itemId: string) => void;
  applyDiscount: (sessionId: string, discount: Discount) => void;
  closeSession: (sessionId: string) => void;
}

export const usePOSStore = create<POSStore>((set) => ({
  sessions: [],
  activeSessionId: null,

  createSession: () => set((state) => {
    const newSession: POSSession = {
      id: crypto.randomUUID(),
      items: [],
      discounts: [],
      createdAt: new Date(),
    };
    return {
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id,
    };
  }),

  switchSession: (id) => set({ activeSessionId: id }),

  addItem: (sessionId, item) => set((state) => ({
    sessions: state.sessions.map(session =>
      session.id === sessionId
        ? { ...session, items: [...session.items, item] }
        : session
    ),
  })),

  // ... other actions
}));
```

**Vite Configuration:**

```typescript
// vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

**Alternatives Considered:**
- **Redux**: Rejected - too much boilerplate for this use case
- **Context API**: Rejected - performance issues with frequent updates (cart changes)
- **Jotai/Recoil**: Rejected - Zustand simpler and more established
- **Create React App**: Rejected - deprecated, slow build times

**References:**
- shadcn/ui documentation (2025)
- Zustand best practices
- React State Management in 2025 article

---

## 3. Authentication & Authorization

### Decision: Dual-Token JWT with Role-Based Permissions

**Chosen Approach:**
- **Access Token**: 15 minutes (short-lived)
- **Refresh Token**: 7 days (HTTP-only cookie)
- **Session Timeout**: 5 hours of inactivity
- **Permission Model**: Granular operation-level permissions

**Rationale:**
- **Short Access Token**: Limits damage if stolen; acceptable for POS (transactions are quick)
- **Long Refresh Token**: Cashiers don't need to re-login during 8-hour shift
- **HTTP-Only Cookie**: Protects refresh token from XSS attacks
- **5-Hour Inactivity**: Balances security with UX (lunch breaks don't log out staff)
- **Granular Permissions**: Each operation (create_product, process_sale, etc.) has own permission

**Implementation:**

```go
// JWT Claims Structure
type Claims struct {
    UserID      uint     `json:"user_id"`
    Username    string   `json:"username"`
    RoleID      uint     `json:"role_id"`
    Permissions []string `json:"permissions"` // Cached in token for performance
    jwt.RegisteredClaims
}

// Token Generation
func GenerateTokenPair(user *User, permissions []string) (*TokenPair, error) {
    // Access token (15 min)
    accessClaims := &Claims{
        UserID:      user.ID,
        Username:    user.Username,
        RoleID:      user.RoleID,
        Permissions: permissions,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    // Refresh token (7 days)
    refreshClaims := &Claims{
        UserID:   user.ID,
        Username: user.Username,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    // Sign tokens with different secrets
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)

    return &TokenPair{
        AccessToken:  accessToken.SignedString(accessSecret),
        RefreshToken: refreshToken.SignedString(refreshSecret),
    }, nil
}
```

**Permission Middleware:**

```go
// Check if user has required permission
func RequirePermission(permission string) gin.HandlerFunc {
    return func(c *gin.Context) {
        claims := c.MustGet("claims").(*Claims)

        hasPermission := false
        for _, p := range claims.Permissions {
            if p == permission {
                hasPermission = true
                break
            }
        }

        if !hasPermission {
            c.JSON(403, gin.H{"error": "insufficient permissions"})
            c.Abort()
            return
        }

        c.Next()
    }
}

// Usage
router.POST("/products",
    AuthRequired(),
    RequirePermission("create_product"),
    handler.CreateProduct,
)
```

**Manager Approval Workflow (for old returns):**

```go
// Endpoint requires both return permission AND manager approval for old sales
func (h *ReturnHandler) ProcessReturn(c *gin.Context) {
    // ... validate return request

    saleAge := time.Since(sale.CreatedAt)
    requiresManagerApproval := saleAge > 7*24*time.Hour

    if requiresManagerApproval {
        // Verify manager credentials from request
        managerToken := c.GetHeader("X-Manager-Token")
        if managerToken == "" {
            c.JSON(403, gin.H{"error": "manager approval required for returns older than 7 days"})
            return
        }

        managerClaims, err := ValidateAccessToken(managerToken)
        if err != nil || !hasPermission(managerClaims.Permissions, "approve_old_return") {
            c.JSON(403, gin.H{"error": "invalid manager approval"})
            return
        }

        // Log manager who approved
        returnRecord.ApprovedBy = &managerClaims.UserID
    }

    // Process return...
}
```

**5-Hour Session Timeout Implementation:**

Frontend tracks last activity and refreshes token before expiry:

```typescript
// src/hooks/useSessionTimeout.ts
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

const TIMEOUT_DURATION = 5 * 60 * 60 * 1000; // 5 hours
const REFRESH_BEFORE = 5 * 60 * 1000; // Refresh 5 min before expiry

export function useSessionTimeout() {
  const { logout, refreshToken } = useAuthStore();
  let timeoutId: number;
  let lastActivity = Date.now();

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutId);
    lastActivity = Date.now();

    // Set new timeout
    timeoutId = setTimeout(() => {
      logout();
    }, TIMEOUT_DURATION);

    // Also refresh token if close to expiry
    const timeSinceActivity = Date.now() - lastActivity;
    if (timeSinceActivity > (TIMEOUT_DURATION - REFRESH_BEFORE)) {
      refreshToken();
    }
  }, [logout, refreshToken]);

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    resetTimeout(); // Initial setup

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);
}
```

**Alternatives Considered:**
- **Session-Based Auth**: Rejected - requires shared session store, not ideal for multiple POS terminals
- **Single Long-Lived Token**: Rejected - security risk if token stolen
- **OAuth2**: Rejected - overkill for single-shop system
- **Caching Permissions in DB**: Rejected - adds latency to every request; JWT caching faster

**Security Considerations:**
- Use environment variables for secrets (never hardcode)
- HTTPS only in production (Secure: true on cookies)
- Optional: Token revocation list in Redis for immediate logout

**References:**
- JWT best practices 2025
- Go JWT libraries comparison
- POS security requirements

---

## 4. Multi-Session POS Architecture

### Decision: Zustand + Backend Persistence + Optimistic UI

**Chosen Approach:**
- **Frontend State**: Zustand store for active sessions
- **Backend Persistence**: Save sessions to DB every 30 seconds + on session switch
- **Sync Strategy**: Polling (every 10 seconds) for session list updates
- **Cleanup**: Auto-delete abandoned sessions after 24 hours

**Rationale:**
- **Zustand**: Handles complex multi-session state without Redux complexity
- **Periodic Saves**: Balances data safety with write frequency (SQLite single writer)
- **Polling**: Simpler than WebSockets for low-frequency updates
- **24-Hour Cleanup**: Prevents database bloat from forgotten sessions

**Architecture Diagram:**

```
┌─────────────────────────────────────┐
│         React Frontend              │
│                                     │
│  ┌────────────────────────────┐    │
│  │   Zustand POS Store        │    │
│  │  - sessions[]              │    │
│  │  - activeSessionId         │    │
│  │  - addItem()               │    │
│  │  - applyDiscount()         │    │
│  └────────┬───────────────────┘    │
│           │                         │
│           │ Auto-save every 30s     │
│           │ Save on session switch  │
│           │                         │
└───────────┼─────────────────────────┘
            │
            │ POST /api/pos/sessions/:id
            │ GET  /api/pos/sessions (poll 10s)
            ▼
┌─────────────────────────────────────┐
│         Go Backend                  │
│                                     │
│  ┌────────────────────────────┐    │
│  │   Session Service          │    │
│  │  - SaveSession()           │    │
│  │  - LoadSessions()          │    │
│  │  - CleanupOldSessions()    │    │
│  └────────┬───────────────────┘    │
│           │                         │
│           ▼                         │
│  ┌────────────────────────────┐    │
│  │   SQLite Database          │    │
│  │  - sales_sessions table    │    │
│  │  - session_items table     │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Database Schema:**

```go
type SalesSession struct {
    ID              uint      `gorm:"primaryKey"`
    SessionID       string    `gorm:"uniqueIndex;size:36"` // UUID
    StaffID         uint      `gorm:"index"`
    CustomerID      *uint     // Optional
    BillDiscount    float64   `gorm:"type:decimal(10,2);default:0"`
    Status          string    `gorm:"index;size:20;default:'active'"` // active, completed, abandoned
    LastActivity    time.Time `gorm:"index"`
    CreatedAt       time.Time
    UpdatedAt       time.Time

    Items           []SessionItem `gorm:"foreignKey:SessionID;references:SessionID"`
}

type SessionItem struct {
    ID              uint    `gorm:"primaryKey"`
    SessionID       string  `gorm:"index;size:36"`
    BatchID         uint    `gorm:"index"` // Links to inventory batch
    Quantity        int
    UnitPrice       float64 `gorm:"type:decimal(10,2)"`
    DiscountPercent float64 `gorm:"type:decimal(5,2);default:0"`
    DiscountAmount  float64 `gorm:"type:decimal(10,2);default:0"`
}
```

**Frontend Implementation:**

```typescript
// Zustand store with auto-save
const usePOSStore = create<POSStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  lastSaveTime: Date.now(),

  // Auto-save every 30 seconds
  startAutoSave: () => {
    setInterval(() => {
      const state = get();
      const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (activeSession && Date.now() - state.lastSaveTime > 30000) {
        api.saveSession(activeSession).then(() => {
          set({ lastSaveTime: Date.now() });
        });
      }
    }, 5000); // Check every 5 seconds
  },

  switchSession: (id) => {
    // Save current session before switching
    const currentSession = get().sessions.find(s => s.id === get().activeSessionId);
    if (currentSession) {
      api.saveSession(currentSession);
    }
    set({ activeSessionId: id, lastSaveTime: Date.now() });
  },

  // ... other actions
}));
```

**Backend Cleanup Job:**

```go
// Run daily cleanup
func (s *SessionService) CleanupAbandonedSessions() {
    cutoff := time.Now().Add(-24 * time.Hour)

    s.db.Where("status = ? AND last_activity < ?", "active", cutoff).
        Update("status", "abandoned")
}

// Call from main.go
go func() {
    ticker := time.NewTicker(24 * time.Hour)
    for range ticker.C {
        sessionService.CleanupAbandonedSessions()
    }
}()
```

**Alternatives Considered:**
- **WebSockets**: Rejected - overkill for low-frequency updates, adds complexity
- **No Backend Persistence**: Rejected - data loss if browser crashes
- **Continuous Saves**: Rejected - too many writes to SQLite
- **Redux**: Rejected - unnecessary complexity for this use case

**References:**
- Zustand documentation
- Multi-tenant POS system patterns
- SQLite write optimization strategies

---

## 5. Inventory Batch Tracking

### Decision: Batch-per-Purchase with FIFO Selection

**Chosen Schema:**
- **Inventory Batches**: Each purchase creates new batch(es)
- **Tracking**: Link sale items to specific batch IDs
- **Selection Strategy**: FIFO (First In, First Out) default
- **Returns**: Restore to original batch

**Rationale:**
- **Separate Batches**: Same product from same supplier at different times = different batches (price fluctuations)
- **FIFO**: Industry standard for inventory valuation (tax/accounting reasons)
- **Batch Linking**: Essential for accurate return processing and cost tracking
- **Performance**: Indexed queries on batch availability

**Database Schema:**

```go
type Product struct {
    ID          uint   `gorm:"primaryKey"`
    Code        string `gorm:"uniqueIndex;size:50;not null"`
    Description string `gorm:"index;size:255;not null"`
    CategoryID  uint   `gorm:"index"`
    Attributes  string `gorm:"type:json"` // Custom attributes as JSON
    // ... other fields
}

type Purchase struct {
    ID         uint      `gorm:"primaryKey"`
    SupplierID uint      `gorm:"index;not null"`
    PurchaseNo string    `gorm:"uniqueIndex;size:50"`
    TotalCost  float64   `gorm:"type:decimal(12,2)"`
    Date       time.Time `gorm:"index"`
    CreatedAt  time.Time

    LineItems  []PurchaseLineItem `gorm:"foreignKey:PurchaseID"`
}

type PurchaseLineItem struct {
    ID            uint    `gorm:"primaryKey"`
    PurchaseID    uint    `gorm:"index;not null"`
    ProductID     uint    `gorm:"index;not null"`
    Quantity      int     `gorm:"not null"`
    UnitCostPrice float64 `gorm:"type:decimal(10,2);not null"`
    UnitSalePrice float64 `gorm:"type:decimal(10,2);not null"`

    // This creates the inventory batch
    InventoryBatch InventoryBatch `gorm:"foreignKey:PurchaseLineItemID"`
}

type InventoryBatch struct {
    ID                  uint      `gorm:"primaryKey"`
    PurchaseLineItemID  uint      `gorm:"uniqueIndex;not null"`
    ProductID           uint      `gorm:"index;not null"`
    SupplierID          uint      `gorm:"index;not null"`
    Quantity            int       `gorm:"not null"` // Current quantity
    OriginalQuantity    int       `gorm:"not null"` // For tracking
    UnitCostPrice       float64   `gorm:"type:decimal(10,2);not null"`
    UnitSalePrice       float64   `gorm:"type:decimal(10,2);not null"`
    ReceivedDate        time.Time `gorm:"index"`
    CreatedAt           time.Time
    UpdatedAt           time.Time

    Product    Product  `gorm:"foreignKey:ProductID"`
    Supplier   Supplier `gorm:"foreignKey:SupplierID"`
    PurchaseLineItem PurchaseLineItem `gorm:"foreignKey:PurchaseLineItemID"`
}

type SaleItem struct {
    ID                uint    `gorm:"primaryKey"`
    SaleID            uint    `gorm:"index;not null"`
    InventoryBatchID  uint    `gorm:"index;not null"` // Critical: track source batch
    Quantity          int     `gorm:"not null"`
    UnitPrice         float64 `gorm:"type:decimal(10,2);not null"`
    DiscountPercent   float64 `gorm:"type:decimal(5,2);default:0"`
    DiscountAmount    float64 `gorm:"type:decimal(10,2);default:0"`

    InventoryBatch InventoryBatch `gorm:"foreignKey:InventoryBatchID"`
}
```

**FIFO Selection Query:**

```go
// Get available batches for a product (FIFO order)
func (r *InventoryRepository) GetAvailableBatches(productID uint) ([]InventoryBatch, error) {
    var batches []InventoryBatch

    err := r.db.Where("product_id = ? AND quantity > 0", productID).
        Order("received_date ASC"). // FIFO: oldest first
        Preload("Supplier", func(db *gorm.DB) *gorm.DB {
            return db.Select("id", "name")
        }).
        Find(&batches).Error

    return batches, err
}

// Deduct from batch (with transaction)
func (r *InventoryRepository) DeductFromBatch(batchID uint, quantity int) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        var batch InventoryBatch

        // Lock the row for update
        err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
            Where("id = ? AND quantity >= ?", batchID, quantity).
            First(&batch).Error

        if err != nil {
            if err == gorm.ErrRecordNotFound {
                return errors.New("insufficient stock in this batch")
            }
            return err
        }

        // Update quantity
        return tx.Model(&batch).Update("quantity", batch.Quantity - quantity).Error
    })
}
```

**Return Processing (Restore to Original Batch):**

```go
func (r *ReturnRepository) ProcessReturn(saleID uint, returnItems []ReturnItem) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        for _, item := range returnItems {
            // Get original sale item to find batch
            var saleItem SaleItem
            err := tx.Where("sale_id = ? AND id = ?", saleID, item.SaleItemID).
                First(&saleItem).Error
            if err != nil {
                return err
            }

            // Restore to original batch
            err = tx.Model(&InventoryBatch{}).
                Where("id = ?", saleItem.InventoryBatchID).
                Update("quantity", gorm.Expr("quantity + ?", item.Quantity)).Error

            if err != nil {
                return err
            }
        }

        // Create return record
        // ...

        return nil
    })
}
```

**Performance Indexes:**

```go
// Migration
func MigrateInventoryBatch(db *gorm.DB) error {
    // Create composite index for common queries
    db.Exec("CREATE INDEX idx_inventory_product_available ON inventory_batches(product_id, quantity, received_date)")

    // Index for supplier filter
    db.Exec("CREATE INDEX idx_inventory_supplier_product ON inventory_batches(supplier_id, product_id)")

    return nil
}
```

**Alternatives Considered:**
- **Single Inventory Record per Product**: Rejected - can't track different prices per purchase
- **Product+Supplier Only (no batch)**: Rejected - same supplier can deliver at different prices
- **LIFO Selection**: Rejected - FIFO is accounting standard
- **No Batch Tracking on Sales**: Rejected - can't properly restore inventory on returns

**References:**
- Inventory accounting principles
- GORM associations and preloading
- E-commerce batch tracking patterns

---

## 6. Receipt Generation

### Decision: Backend PDF (Maroto) + Browser Print

**Chosen Approach:**
- **Primary**: Backend generates PDF with Maroto library
- **Display**: Frontend shows PDF in iframe
- **Printing**: Browser's window.print() API
- **Optional Future**: Add ESC/POS thermal printing

**Rationale:**
- **Backend PDF**: Single source of truth for receipt logic (discounts, tax, formatting)
- **Consistency**: Same receipt format regardless of client browser
- **Maroto**: Simplest Go PDF library with grid-based layout
- **Browser Print**: Works immediately without thermal printer hardware
- **Flexibility**: Can email/save receipts as PDFs

**Implementation:**

```go
// Receipt Service
func (s *ReceiptService) GenerateSaleReceipt(saleID uint) ([]byte, error) {
    sale, err := s.saleRepo.GetByIDWithDetails(saleID)
    if err != nil {
        return nil, err
    }

    m := pdf.NewMaroto(consts.Portrait, consts.A4)
    m.SetPageMargins(10, 10, 10)

    // Header
    m.Row(20, func() {
        m.Col(12, func() {
            m.Text("HARDWARE STORE POS", props.Text{
                Size: 16, Align: consts.Center, Style: consts.Bold,
            })
        })
    })

    // Store info
    m.Row(10, func() {
        m.Col(12, func() {
            m.Text("123 Main St, City, State", props.Text{Size: 10, Align: consts.Center})
        })
    })

    m.Line(1)

    // Transaction details
    m.Row(10, func() {
        m.Col(6, func() {
            m.Text(fmt.Sprintf("Receipt #: %s", sale.TransactionID), props.Text{Size: 10})
        })
        m.Col(6, func() {
            m.Text(sale.CreatedAt.Format("2006-01-02 15:04"), props.Text{Size: 10, Align: consts.Right})
        })
    })

    // Items table header
    m.Row(5, func() {
        m.Col(6, func() { m.Text("ITEM", props.Text{Size: 10, Style: consts.Bold}) })
        m.Col(2, func() { m.Text("QTY", props.Text{Size: 10, Style: consts.Bold, Align: consts.Center}) })
        m.Col(2, func() { m.Text("PRICE", props.Text{Size: 10, Style: consts.Bold, Align: consts.Right}) })
        m.Col(2, func() { m.Text("TOTAL", props.Text{Size: 10, Style: consts.Bold, Align: consts.Right}) })
    })

    m.Line(0.5)

    // Items
    for _, item := range sale.Items {
        m.Row(8, func() {
            m.Col(6, func() { m.Text(item.Product.Description, props.Text{Size: 9}) })
            m.Col(2, func() { m.Text(fmt.Sprintf("%d", item.Quantity), props.Text{Size: 9, Align: consts.Center}) })
            m.Col(2, func() { m.Text(fmt.Sprintf("$%.2f", item.UnitPrice), props.Text{Size: 9, Align: consts.Right}) })
            m.Col(2, func() { m.Text(fmt.Sprintf("$%.2f", item.LineTotal), props.Text{Size: 9, Align: consts.Right}) })
        })
    }

    m.Line(1)

    // Totals
    m.Row(12, func() {
        m.Col(8, func() { m.Text("TOTAL:", props.Text{Size: 14, Style: consts.Bold, Align: consts.Right}) })
        m.Col(4, func() { m.Text(fmt.Sprintf("$%.2f", sale.Total), props.Text{Size: 14, Style: consts.Bold, Align: consts.Right}) })
    })

    pdfBytes, err := m.Output()
    return pdfBytes.Bytes(), err
}
```

**Frontend:**

```typescript
// ReceiptViewer component
export const ReceiptViewer = ({ saleId }: { saleId: number }) => {
  const pdfUrl = `${API_URL}/api/sales/${saleId}/receipt`;

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank');
    printWindow?.addEventListener('load', () => {
      printWindow.print();
    });
  };

  return (
    <div>
      <button onClick={handlePrint}>Print Receipt</button>
      <iframe src={pdfUrl} className="w-full h-96" />
    </div>
  );
};
```

**Alternatives Considered:**
- **Frontend PDF Generation**: Rejected - business logic duplication, inconsistent across browsers
- **Direct ESC/POS Only**: Rejected - requires thermal printer from day one, no preview
- **Cloud Printing Service**: Rejected - additional cost, external dependency
- **HTML to PDF (wkhtmltopdf)**: Rejected - requires external binary, Maroto is pure Go

**Future Enhancement: Thermal Printing**

Can add later without changing receipt logic:

```go
// Add ESC/POS generation method
func (s *ReceiptService) GenerateESCPOS(saleID uint) ([]byte, error) {
    // Use github.com/hennedo/escpos library
    // Convert same receipt data to ESC/POS commands
}
```

**References:**
- Maroto documentation
- ESC/POS standards
- POS receipt legal requirements

---

## Summary Table

| Area | Decision | Key Benefit |
|------|----------|-------------|
| **Backend Architecture** | Handler→Service→Repository layers | Testability, separation of concerns |
| **Database** | SQLite WAL + single connection | 5+ concurrent sessions without locks |
| **Frontend Stack** | Vite + React + TypeScript + shadcn/ui | Fast builds, type safety, customizable UI |
| **State Management** | Zustand | Simple API, good performance |
| **Authentication** | Dual-token JWT (15min + 7day) | Security + UX balance |
| **Session Timeout** | 5 hours inactivity tracking | Meets requirement |
| **Multi-Session POS** | Zustand + backend persistence | Multiple carts, auto-save |
| **Inventory Tracking** | Batch per purchase, FIFO | Accurate costing, proper returns |
| **Receipt Generation** | Backend PDF (Maroto) | Consistent, professional output |

---

## Environment Variables

```bash
# Backend (.env)
DATABASE_PATH=./database/inventory.db
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
PORT=8080
GIN_MODE=release
ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false # true in production

# Frontend (.env)
VITE_API_URL=http://localhost:8080
```

---

## Next Steps

1. **Phase 1**: Generate detailed data model (entities, relationships, validation rules)
2. **Phase 1**: Create OpenAPI specification for all endpoints
3. **Phase 1**: Write quickstart guide for developers
4. **Phase 2**: Generate implementation tasks (via `/speckit.tasks`)

All research decisions documented and ready for implementation.
