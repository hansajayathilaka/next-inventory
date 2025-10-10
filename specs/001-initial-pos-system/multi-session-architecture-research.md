# Multi-Session POS Architecture Research

**Date**: 2025-10-09
**Feature**: Multi-Session POS System (FR-050 to FR-060)
**Requirements**: Support 5+ simultaneous sessions, instant switching between sessions, no data loss on session switch

---

## Executive Summary

This document provides comprehensive architectural recommendations for implementing a multi-session POS system where a single cashier can maintain multiple active sales sessions simultaneously. The architecture addresses four critical areas: frontend state management, backend session persistence, real-time updates, and session cleanup/expiry.

**Key Decisions**:
1. **Frontend**: Zustand + React Context for multi-session state management
2. **Backend**: Database-first persistence with SQLite WAL mode
3. **Updates**: Short-polling (5s intervals) with optimistic UI updates
4. **Cleanup**: Background reaper pattern with 5-hour TTL

---

## 1. Frontend State Management

### Decision: Zustand with React Context for Session Isolation

**Approach**: Use Zustand for each session's state management, distributed via React Context to enable multiple independent session instances.

### Architecture Pattern

```typescript
// Session Store (Zustand)
interface SessionState {
  id: string;
  items: SalesItem[];
  customer?: Customer;
  itemDiscount: Map<string, Discount>;
  billDiscount?: Discount;
  lastSynced: Date;
  isDirty: boolean;

  // Actions
  addItem: (item: SalesItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  applyItemDiscount: (itemId: string, discount: Discount) => void;
  applyBillDiscount: (discount: Discount) => void;
  setCustomer: (customer: Customer) => void;
  markSynced: () => void;
  markDirty: () => void;
}

// Create store factory
const createSessionStore = (sessionId: string) => {
  return create<SessionState>((set, get) => ({
    id: sessionId,
    items: [],
    lastSynced: new Date(),
    isDirty: false,

    addItem: (item) => set((state) => ({
      items: [...state.items, item],
      isDirty: true
    })),

    // ... other actions
  }));
};

// Context for session store distribution
interface SessionContextValue {
  store: ReturnType<typeof createSessionStore>;
  sessionId: string;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

// Global session manager (Zustand)
interface SessionManagerState {
  activeSessions: Map<string, ReturnType<typeof createSessionStore>>;
  currentSessionId: string | null;

  createSession: () => Promise<string>;
  deleteSession: (sessionId: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  getSession: (sessionId: string) => ReturnType<typeof createSessionStore> | undefined;
}

const useSessionManager = create<SessionManagerState>((set, get) => ({
  activeSessions: new Map(),
  currentSessionId: null,

  createSession: async () => {
    const response = await api.post('/api/pos/sessions');
    const sessionId = response.data.id;
    const store = createSessionStore(sessionId);

    set((state) => ({
      activeSessions: new Map(state.activeSessions).set(sessionId, store),
      currentSessionId: sessionId
    }));

    return sessionId;
  },

  switchSession: (sessionId) => {
    set({ currentSessionId: sessionId });
  },

  // ... other actions
}));
```

### Component Structure

```typescript
// POS Page Component
function POSPage() {
  const { activeSessions, currentSessionId, createSession, switchSession } = useSessionManager();
  const currentStore = activeSessions.get(currentSessionId || '');

  return (
    <div className="flex h-screen">
      {/* Session tabs */}
      <SessionTabs
        sessions={Array.from(activeSessions.keys())}
        current={currentSessionId}
        onSwitch={switchSession}
        onCreate={createSession}
      />

      {/* Active session content */}
      {currentStore && (
        <SessionContext.Provider value={{ store: currentStore, sessionId: currentSessionId! }}>
          <SessionContent />
        </SessionContext.Provider>
      )}
    </div>
  );
}

// Session Content Component
function SessionContent() {
  const { store } = useContext(SessionContext)!;
  const items = store((state) => state.items);
  const addItem = store((state) => state.addItem);

  return (
    <div>
      <ProductSelector onSelect={addItem} />
      <CartView items={items} />
      <PaymentSection />
    </div>
  );
}
```

### Rationale

**Why Zustand over Context API alone**:
- **Performance**: Zustand allows components to subscribe only to specific state slices, avoiding unnecessary re-renders
- **No context re-render cascade**: When Context value changes, all consumers re-render. With Zustand stores in Context, store instances are static singletons that don't cause re-renders
- **Simpler than Redux**: No boilerplate, no providers/consumers complexity, built-in middleware support
- **Better DevTools**: Zustand has excellent Redux DevTools integration for debugging

**Why Zustand + Context (not just Zustand global)**:
- **Session isolation**: Each session needs its own isolated state instance
- **Multiple concurrent instances**: Global Zustand store would share state across sessions, causing data corruption
- **Context for distribution**: React Context distributes the correct store instance to components within each session
- **Scoped subscriptions**: Components only subscribe to their session's store, not all sessions

**Alternatives Considered**:

1. **Pure Context API**: REJECTED - Performance issues with re-renders, harder to implement selective subscriptions
2. **Redux Toolkit**: REJECTED - Overkill for this use case, significant boilerplate, steeper learning curve
3. **Jotai/Recoil**: REJECTED - Atomic state model adds complexity, less mature ecosystem
4. **Global Zustand only**: REJECTED - Cannot create multiple independent session instances

### Local State vs Global State Strategy

**Local to Session (Zustand Store per Session)**:
- Shopping cart items
- Selected customer
- Discounts (item-level and bill-level)
- Unsaved changes flag (`isDirty`)
- Last sync timestamp

**Global (Session Manager)**:
- List of active session IDs
- Current active session ID
- Session metadata (creation time, last activity)

**Never in State (API-driven)**:
- Product catalog (search on-demand)
- Inventory batch availability (fetch when adding item)
- Customer credit balance (fetch when selecting customer)

### Session Switching UX

**Instant Switch Approach**:
```typescript
const switchSession = (targetSessionId: string) => {
  const currentStore = activeSessions.get(currentSessionId!);

  // 1. Save current session if dirty (optimistic)
  if (currentStore?.getState().isDirty) {
    saveSessionAsync(currentSessionId!, currentStore.getState());
  }

  // 2. Switch immediately (no blocking)
  set({ currentSessionId: targetSessionId });

  // 3. Target session already loaded (from Map), renders instantly
};
```

**Performance Target**: <100ms switch time (spec allows 10 seconds, we target instant)

**Visual Feedback**:
- Tab indicator shows sync status (synced, saving, error)
- Dirty indicator (unsaved changes) on session tabs
- Toast notification on save errors

---

## 2. Backend Session Persistence

### Decision: Database-First with SQLite WAL Mode

**Approach**: Store all session data in SQLite database with Write-Ahead Logging (WAL) mode enabled for concurrent access. No in-memory cache layer.

### Database Schema

```sql
-- Sales sessions table
CREATE TABLE sales_sessions (
    id TEXT PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    customer_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active', -- active, held, completed, expired
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL, -- created_at + 5 hours
    bill_discount_type TEXT, -- 'percentage' or 'fixed'
    bill_discount_value REAL,
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE INDEX idx_sessions_staff_status ON sales_sessions(staff_id, status);
CREATE INDEX idx_sessions_expires ON sales_sessions(expires_at, status);

-- Session items table
CREATE TABLE sales_session_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    inventory_batch_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    item_discount_type TEXT, -- 'percentage' or 'fixed'
    item_discount_value REAL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sales_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_batch_id) REFERENCES inventory_batches(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_session_items_session ON sales_session_items(session_id);
```

### SQLite Configuration

```go
// database/connection.go
func InitDB(dbPath string) (*gorm.DB, error) {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, err
    }

    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    // Enable WAL mode for concurrent reads/writes
    _, err = sqlDB.Exec("PRAGMA journal_mode=WAL")
    if err != nil {
        return nil, err
    }

    // Set busy timeout for handling write contention
    _, err = sqlDB.Exec("PRAGMA busy_timeout=5000") // 5 seconds
    if err != nil {
        return nil, err
    }

    // Configure connection pool
    sqlDB.SetMaxOpenConns(25)
    sqlDB.SetMaxIdleConns(5)
    sqlDB.SetConnMaxLifetime(5 * time.Minute)

    return db, nil
}
```

### Service Layer Pattern

```go
// services/pos_service.go
type POSService struct {
    repo *repositories.SessionRepository
}

func (s *POSService) CreateSession(staffID int) (*models.SalesSession, error) {
    session := &models.SalesSession{
        ID:        uuid.New().String(),
        StaffID:   staffID,
        Status:    "active",
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
        ExpiresAt: time.Now().Add(5 * time.Hour),
    }

    return s.repo.Create(session)
}

func (s *POSService) GetActiveSessionsForStaff(staffID int) ([]*models.SalesSession, error) {
    return s.repo.FindByStaffAndStatus(staffID, "active")
}

func (s *POSService) AddItemToSession(sessionID string, item *models.SessionItem) error {
    // Update session updated_at (extends expiry consideration)
    if err := s.repo.TouchSession(sessionID); err != nil {
        return err
    }

    return s.repo.AddItem(sessionID, item)
}

func (s *POSService) UpdateSession(sessionID string, updates map[string]interface{}) error {
    updates["updated_at"] = time.Now()
    return s.repo.Update(sessionID, updates)
}

func (s *POSService) CompleteSession(sessionID string, payment *models.Payment) (*models.Sale, error) {
    // Start transaction
    return s.repo.WithTransaction(func(tx *gorm.DB) (*models.Sale, error) {
        // 1. Load session with items
        session, err := s.repo.GetWithItems(sessionID)
        if err != nil {
            return nil, err
        }

        // 2. Create sale record
        sale := convertSessionToSale(session, payment)
        if err := tx.Create(sale).Error; err != nil {
            return nil, err
        }

        // 3. Update inventory
        for _, item := range session.Items {
            if err := tx.Model(&models.InventoryBatch{}).
                Where("id = ?", item.InventoryBatchID).
                UpdateColumn("quantity", gorm.Expr("quantity - ?", item.Quantity)).
                Error; err != nil {
                return nil, err
            }
        }

        // 4. Mark session as completed
        if err := tx.Model(&models.SalesSession{}).
            Where("id = ?", sessionID).
            Update("status", "completed").Error; err != nil {
            return nil, err
        }

        return sale, nil
    })
}
```

### Rationale

**Why Database-First (not cache)**:
- **Durability**: Session data is critical transactional data - cannot afford data loss
- **Simplicity**: Single source of truth, no cache synchronization complexity
- **Recovery**: Server restart doesn't lose active sessions
- **Multi-device support**: Future support for tablet/mobile POS devices sharing sessions
- **Audit trail**: All session operations naturally logged in database

**Why SQLite with WAL mode**:
- **Concurrent reads**: Multiple readers can access database simultaneously without blocking
- **Fast writes**: WAL mode allows writers to avoid blocking readers
- **ACID compliance**: Full transaction support for payment completion
- **Simplicity**: No separate database server to manage, single file deployment
- **Performance**: With proper configuration, handles 5-10 concurrent sessions easily
- **Sufficient for scale**: 5-10 cashiers in single shop = ~50 sessions max

**WAL Mode Benefits**:
- Readers don't block writers and vice versa
- Multiple readers can read simultaneously
- Write transactions typically complete in milliseconds
- Checkpoint operations happen automatically in background

**Handling Write Contention**:
```go
// Retry logic for busy errors
func (r *SessionRepository) Update(sessionID string, updates map[string]interface{}) error {
    maxRetries := 3
    for attempt := 0; attempt < maxRetries; attempt++ {
        err := r.db.Model(&models.SalesSession{}).
            Where("id = ?", sessionID).
            Updates(updates).Error

        if err == nil {
            return nil
        }

        // SQLITE_BUSY or SQLITE_LOCKED - retry after backoff
        if strings.Contains(err.Error(), "database is locked") {
            time.Sleep(time.Duration(attempt+1) * 50 * time.Millisecond)
            continue
        }

        return err
    }
    return errors.New("max retries exceeded")
}
```

**Alternatives Considered**:

1. **Redis/In-Memory Store**: REJECTED - Adds deployment complexity, requires separate service, potential data loss on crash
2. **Hybrid (Cache + DB)**: REJECTED - Cache invalidation complexity, synchronization bugs, two sources of truth
3. **PostgreSQL**: REJECTED - Overkill for single-shop deployment, requires separate database server
4. **In-Memory Only**: REJECTED - Data loss on server restart, no durability guarantee

### Transaction Boundaries

**Keep Transactions Short**:
```go
// GOOD: Short transaction
func (s *POSService) AddItem(sessionID string, item *SessionItem) error {
    return s.repo.WithTransaction(func(tx *gorm.DB) error {
        // 1. Add item
        if err := tx.Create(item).Error; err != nil {
            return err
        }
        // 2. Touch session
        return tx.Model(&SalesSession{}).
            Where("id = ?", sessionID).
            Update("updated_at", time.Now()).Error
    })
}

// BAD: Long transaction (holds lock during external calls)
func (s *POSService) AddItemAndValidateInventory(sessionID string, item *SessionItem) error {
    return s.repo.WithTransaction(func(tx *gorm.DB) error {
        // External call inside transaction - AVOID!
        inventory, err := s.externalInventoryAPI.CheckStock(item.ProductID)
        if err != nil {
            return err
        }

        if inventory.Available < item.Quantity {
            return errors.New("insufficient stock")
        }

        return tx.Create(item).Error
    })
}
```

**Isolation Level**: Use default SQLite isolation (SERIALIZABLE for writers)

### Performance Considerations

**Expected Load**:
- 5 cashiers × 2-3 active sessions = 10-15 concurrent sessions
- ~5-10 item additions per minute per cashier = ~50 writes/minute
- Session switches: ~10-20/minute across all cashiers
- SQLite with WAL mode handles this comfortably

**Optimization Strategies**:
1. **Batch reads**: Load session with items in single query using JOIN
2. **Indexed queries**: Indexes on (staff_id, status) and (expires_at, status)
3. **Connection pooling**: Reuse connections (max 25 open, 5 idle)
4. **Prepared statements**: GORM handles this automatically
5. **Minimal transaction scope**: Only wrap write operations

**Monitoring**:
```go
// Log slow queries
db.Logger = logger.Default.LogMode(logger.Warn)
db.Config.SlowThreshold = 200 * time.Millisecond
```

---

## 3. Real-Time Updates Strategy

### Decision: Short-Polling with Optimistic UI Updates

**Approach**: Use short-polling (5-second intervals) for session list updates, combined with optimistic UI updates for immediate feedback.

### Polling Implementation

```typescript
// Frontend: Session sync hook
function useSessionSync(sessionId: string) {
  const store = useContext(SessionContext)!.store;
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce(async (state: SessionState) => {
      try {
        setIsSyncing(true);
        await api.put(`/api/pos/sessions/${sessionId}`, {
          items: state.items,
          customer_id: state.customer?.id,
          bill_discount: state.billDiscount,
          item_discounts: Object.fromEntries(state.itemDiscount)
        });
        store.getState().markSynced();
        setLastError(null);
      } catch (error) {
        setLastError(error as Error);
        // Keep isDirty flag - will retry
      } finally {
        setIsSyncing(false);
      }
    }, 1000),
    [sessionId]
  );

  // Auto-save on state changes
  useEffect(() => {
    const unsubscribe = store.subscribe(
      (state) => state.isDirty,
      (isDirty) => {
        if (isDirty) {
          debouncedSave(store.getState());
        }
      }
    );

    return () => {
      unsubscribe();
      debouncedSave.cancel();
    };
  }, [store]);

  // Periodic full sync (reconciliation)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/pos/sessions/${sessionId}`);
        const serverState = response.data;

        // Only update if server version is newer
        if (new Date(serverState.updated_at) > store.getState().lastSynced) {
          // Merge server state (server wins on conflicts)
          store.setState({
            items: serverState.items,
            customer: serverState.customer,
            billDiscount: serverState.bill_discount,
            lastSynced: new Date(serverState.updated_at),
            isDirty: false
          });
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [sessionId]);

  return { isSyncing, lastError };
}

// Session list polling
function useSessionList(staffId: number) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/api/pos/sessions', {
          params: { staff_id: staffId, status: 'active' }
        });
        setSessions(response.data);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    // Initial fetch
    fetchSessions();

    // Poll every 5 seconds
    const interval = setInterval(fetchSessions, 5000);

    return () => clearInterval(interval);
  }, [staffId]);

  return sessions;
}
```

### Optimistic UI Pattern

```typescript
// Optimistic add item
const addItem = async (inventoryBatch: InventoryBatch, quantity: number) => {
  const optimisticItem: SalesItem = {
    id: `temp-${Date.now()}`, // Temporary ID
    inventory_batch_id: inventoryBatch.id,
    product: inventoryBatch.product,
    quantity,
    unit_price: inventoryBatch.sale_price,
    item_discount: null
  };

  // 1. Update UI immediately (optimistic)
  store.getState().addItem(optimisticItem);

  try {
    // 2. Send to server
    const response = await api.post(`/api/pos/sessions/${sessionId}/items`, {
      inventory_batch_id: inventoryBatch.id,
      quantity,
      unit_price: inventoryBatch.sale_price
    });

    // 3. Replace temporary ID with server ID
    store.setState((state) => ({
      items: state.items.map((item) =>
        item.id === optimisticItem.id
          ? { ...item, id: response.data.id }
          : item
      ),
      isDirty: false
    }));
  } catch (error) {
    // 4. Rollback on error
    store.setState((state) => ({
      items: state.items.filter((item) => item.id !== optimisticItem.id)
    }));

    toast.error('Failed to add item: ' + error.message);
  }
};
```

### Backend API Endpoints

```go
// handlers/pos_handler.go

// GET /api/pos/sessions?staff_id=X&status=active
func (h *POSHandler) ListSessions(c *gin.Context) {
    staffID := c.Query("staff_id")
    status := c.Query("status")

    sessions, err := h.service.GetSessions(staffID, status)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, sessions)
}

// GET /api/pos/sessions/:id
func (h *POSHandler) GetSession(c *gin.Context) {
    sessionID := c.Param("id")

    session, err := h.service.GetSessionWithItems(sessionID)
    if err != nil {
        c.JSON(404, gin.H{"error": "Session not found"})
        return
    }

    c.JSON(200, session)
}

// PUT /api/pos/sessions/:id
func (h *POSHandler) UpdateSession(c *gin.Context) {
    sessionID := c.Param("id")

    var req struct {
        Items         []models.SessionItem `json:"items"`
        CustomerID    *int                 `json:"customer_id"`
        BillDiscount  *models.Discount     `json:"bill_discount"`
        ItemDiscounts map[string]*models.Discount `json:"item_discounts"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Update session in transaction
    err := h.service.UpdateSessionFull(sessionID, req.Items, req.CustomerID, req.BillDiscount, req.ItemDiscounts)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, gin.H{"status": "updated"})
}

// POST /api/pos/sessions/:id/items
func (h *POSHandler) AddItem(c *gin.Context) {
    sessionID := c.Param("id")

    var req struct {
        InventoryBatchID int     `json:"inventory_batch_id"`
        Quantity         int     `json:"quantity"`
        UnitPrice        float64 `json:"unit_price"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    item, err := h.service.AddItemToSession(sessionID, &models.SessionItem{
        InventoryBatchID: req.InventoryBatchID,
        Quantity:         req.Quantity,
        UnitPrice:        req.UnitPrice,
    })

    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(201, item)
}
```

### Rationale

**Why Polling over WebSockets**:
- **Simplicity**: No WebSocket server infrastructure, no connection management, no reconnection logic
- **Scalability**: 5 cashiers × 1 request/5s = 1 request/second - trivial load
- **Stateless**: HTTP requests are stateless, no persistent connections to manage
- **Firewall friendly**: Works through any HTTP-capable network
- **Debugging**: Easy to inspect with browser DevTools
- **Resource efficient**: Idle connections don't consume server memory
- **Lower latency acceptable**: 5-second staleness is acceptable for session list

**Why 5-Second Polling Interval**:
- **Fresh enough**: Session list updates within 5 seconds is acceptable
- **Low overhead**: 1 request per 5 seconds per cashier = negligible bandwidth
- **Battery friendly**: Infrequent requests don't drain device battery
- **Server friendly**: Minimal CPU/memory impact

**Why Optimistic UI**:
- **Instant feedback**: User sees result immediately, no perceived lag
- **Better UX**: No spinner on every action
- **Reduced perceived latency**: Feels like native app
- **Graceful degradation**: Rollback on error with user notification

**Conflict Resolution Strategy**:
- **Server Wins**: On sync conflicts, server state takes precedence
- **Last-Write-Wins**: Database `updated_at` timestamp determines winner
- **Rare conflicts**: Single cashier per session = conflicts unlikely

**Alternatives Considered**:

1. **WebSockets**: REJECTED - Overkill for 5-second update tolerance, adds complexity
2. **Server-Sent Events (SSE)**: REJECTED - One-way only, still requires HTTP for writes, browser compatibility issues
3. **Long Polling**: REJECTED - More complex than short polling, no latency benefit for our use case
4. **No Polling (Manual Refresh)**: REJECTED - Poor UX, doesn't meet "no data loss" requirement

### Performance Implications

**Network Overhead**:
- Session list poll: ~1KB per request × 5 cashiers × 12 requests/minute = ~60KB/minute = 3.6MB/hour
- Session sync: ~5-10KB per save × ~5 saves/minute/cashier = ~250KB/minute = 15MB/hour
- **Total**: ~20MB/hour for 5 cashiers - negligible

**Server Load**:
- Session list queries: Indexed query, <10ms
- Session sync updates: Single transaction, <50ms
- **Total load**: <1% CPU on modest server

**Battery Impact**:
- 1 request per 5 seconds = minimal battery drain on mobile devices

---

## 4. Session Cleanup and Expiry

### Decision: Background Reaper Pattern with 5-Hour TTL

**Approach**: Implement a background worker (reaper) that runs every 5 minutes to clean up expired sessions. Sessions expire after 5 hours of inactivity.

### Expiry Logic

**Expiry Calculation**:
- Session `expires_at` = `created_at` + 5 hours
- Option 1: Fixed expiry (5 hours from creation)
- **Option 2 (Recommended)**: Rolling expiry (extends on activity)

```go
// Rolling expiry - extends on each update
func (s *POSService) TouchSession(sessionID string) error {
    return s.repo.Update(sessionID, map[string]interface{}{
        "updated_at": time.Now(),
        "expires_at": time.Now().Add(5 * time.Hour), // Reset expiry
    })
}

// Fixed expiry - never extends
func (s *POSService) CreateSession(staffID int) (*models.SalesSession, error) {
    expiresAt := time.Now().Add(5 * time.Hour)
    // expires_at never changes after creation
}
```

**Recommendation**: Use **Rolling Expiry** - better UX, active sessions don't expire unexpectedly.

### Background Reaper Implementation

```go
// services/session_reaper.go
type SessionReaper struct {
    repo     *repositories.SessionRepository
    interval time.Duration
    stopCh   chan struct{}
}

func NewSessionReaper(repo *repositories.SessionRepository) *SessionReaper {
    return &SessionReaper{
        repo:     repo,
        interval: 5 * time.Minute,
        stopCh:   make(chan struct{}),
    }
}

func (r *SessionReaper) Start() {
    ticker := time.NewTicker(r.interval)
    go func() {
        for {
            select {
            case <-ticker.C:
                r.cleanupExpiredSessions()
            case <-r.stopCh:
                ticker.Stop()
                return
            }
        }
    }()

    log.Println("Session reaper started")
}

func (r *SessionReaper) Stop() {
    close(r.stopCh)
    log.Println("Session reaper stopped")
}

func (r *SessionReaper) cleanupExpiredSessions() {
    log.Println("Running session cleanup...")

    // Find expired sessions
    expiredSessions, err := r.repo.FindExpired()
    if err != nil {
        log.Printf("Error finding expired sessions: %v", err)
        return
    }

    if len(expiredSessions) == 0 {
        log.Println("No expired sessions to clean")
        return
    }

    // Archive and delete
    archived := 0
    for _, session := range expiredSessions {
        // Option 1: Hard delete
        if err := r.repo.Delete(session.ID); err != nil {
            log.Printf("Error deleting session %s: %v", session.ID, err)
            continue
        }

        // Option 2: Soft delete (recommended - archive)
        if err := r.repo.Update(session.ID, map[string]interface{}{
            "status": "expired",
        }); err != nil {
            log.Printf("Error archiving session %s: %v", session.ID, err)
            continue
        }

        archived++
    }

    log.Printf("Archived %d expired sessions", archived)
}

// Repository method
func (r *SessionRepository) FindExpired() ([]*models.SalesSession, error) {
    var sessions []*models.SalesSession
    err := r.db.Where("status = ? AND expires_at < ?", "active", time.Now()).
        Find(&sessions).Error
    return sessions, err
}
```

### Startup Integration

```go
// cmd/server/main.go
func main() {
    // Initialize database
    db, err := database.InitDB("./database/inventory.db")
    if err != nil {
        log.Fatal(err)
    }

    // Initialize repositories and services
    sessionRepo := repositories.NewSessionRepository(db)
    posService := services.NewPOSService(sessionRepo)

    // Start background reaper
    reaper := services.NewSessionReaper(sessionRepo)
    reaper.Start()
    defer reaper.Stop()

    // Start HTTP server
    router := gin.Default()
    // ... setup routes
    router.Run(":8080")
}
```

### Abandoned Session Handling

**Scenarios**:

1. **Cashier forgets to complete/hold session**:
   - Session expires after 5 hours of no activity
   - Reaper marks as "expired"
   - Items return to available inventory (not reserved)

2. **Browser crash/close during active session**:
   - Session remains in database (persisted)
   - Cashier can resume on reopen (within 5 hours)
   - Frontend loads active sessions on mount

3. **Server restart**:
   - All sessions persist in database
   - Reaper resumes cleanup cycle on restart
   - No data loss

**Resume Behavior**:
```typescript
// Frontend: Load existing sessions on mount
function POSPage() {
  const { activeSessions, loadExistingSessions } = useSessionManager();
  const { user } = useAuth();

  useEffect(() => {
    // Load cashier's active sessions on mount
    loadExistingSessions(user.id);
  }, [user.id]);

  // ...
}

// Session manager
const loadExistingSessions = async (staffId: number) => {
  const response = await api.get('/api/pos/sessions', {
    params: { staff_id: staffId, status: 'active' }
  });

  const sessions = response.data;
  const storesMap = new Map();

  for (const session of sessions) {
    const store = createSessionStore(session.id);
    // Hydrate store with server state
    store.setState({
      items: session.items,
      customer: session.customer,
      billDiscount: session.bill_discount,
      isDirty: false,
      lastSynced: new Date(session.updated_at)
    });
    storesMap.set(session.id, store);
  }

  set({
    activeSessions: storesMap,
    currentSessionId: sessions[0]?.id || null
  });
};
```

### Cleanup Notification

**Frontend Warning**:
```typescript
// Warn user when session is about to expire
function SessionExpiryWarning({ sessionId }: { sessionId: string }) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const checkExpiry = async () => {
      const response = await api.get(`/api/pos/sessions/${sessionId}`);
      const expiresAt = new Date(response.data.expires_at);
      const remaining = expiresAt.getTime() - Date.now();
      setTimeRemaining(remaining);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [sessionId]);

  // Show warning if <30 minutes remaining
  if (timeRemaining && timeRemaining < 30 * 60 * 1000) {
    return (
      <Alert variant="warning">
        Session expires in {Math.floor(timeRemaining / 60000)} minutes.
        Complete or save your work.
      </Alert>
    );
  }

  return null;
}
```

### Rationale

**Why Background Reaper**:
- **Automatic cleanup**: No manual intervention required
- **Reliable**: Runs independently of user actions
- **Consistent**: Cleanup happens regularly, prevents database bloat
- **Simple**: Single-responsibility component, easy to test

**Why 5-Minute Reaper Interval**:
- **Balance**: Frequent enough to prevent buildup, infrequent enough to minimize overhead
- **Low impact**: Cleanup query runs <100ms, every 5 minutes = negligible load
- **Good enough**: 5-minute delay in cleanup is acceptable (sessions already expired)

**Why Rolling Expiry (Option 2)**:
- **Better UX**: Active sessions don't expire unexpectedly
- **Natural behavior**: User activity extends session lifetime
- **Fewer interruptions**: Cashier doesn't lose work mid-transaction

**Why Soft Delete (Archive)**:
- **Audit trail**: Keep record of expired sessions
- **Recovery**: Can analyze abandoned sessions
- **Data integrity**: Foreign key relationships remain intact
- **Debugging**: Investigate why sessions expired

**Hard Delete Option** (Alternative):
```go
// CASCADE delete removes session_items automatically
func (r *SessionRepository) Delete(sessionID string) error {
    return r.db.Delete(&models.SalesSession{}, "id = ?", sessionID).Error
}
```

**Alternatives Considered**:

1. **Database TTL (triggers)**: REJECTED - SQLite doesn't support automatic TTL, would need custom extension
2. **Cron Job**: REJECTED - Adds external dependency, background worker is simpler
3. **On-demand cleanup**: REJECTED - Cleanup triggered by user actions is unreliable, unpredictable performance
4. **No cleanup**: REJECTED - Database bloat over time, performance degradation

### Performance Considerations

**Reaper Query Performance**:
```sql
-- Indexed query (idx_sessions_expires)
SELECT * FROM sales_sessions
WHERE status = 'active' AND expires_at < CURRENT_TIMESTAMP;

-- Update to expired (indexed by PK)
UPDATE sales_sessions SET status = 'expired' WHERE id = ?;
```

**Expected Load**:
- ~5-10 sessions expire per day (assuming proper usage)
- Reaper finds 0-2 sessions per cycle on average
- Query time: <10ms with index
- Update time: <5ms per session

---

## 5. Architecture Diagrams

### System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Session Manager (Zustand)                   │ │
│  │  - Active sessions map                                       │ │
│  │  - Current session ID                                        │ │
│  │  - Create/Delete/Switch operations                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                                                        │
│           ├─────────┬─────────┬─────────┬─────────┐              │
│           ▼         ▼         ▼         ▼         ▼              │
│  ┌─────────────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│  │ Session 1   │ │ Sess2 │ │ Sess3 │ │ Sess4 │ │ Sess5 │       │
│  │ (Zustand)   │ │       │ │       │ │       │ │       │       │
│  │             │ │       │ │       │ │       │ │       │       │
│  │ - Items[]   │ │       │ │       │ │       │ │       │       │
│  │ - Customer  │ │       │ │       │ │       │ │       │       │
│  │ - Discounts │ │       │ │       │ │       │ │       │       │
│  │ - isDirty   │ │       │ │       │ │       │ │       │       │
│  └─────────────┘ └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Session Context                         │   │
│  │         (Distributes store to components)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Sync Layer                                │   │
│  │  - Debounced auto-save (1s)                              │   │
│  │  - Optimistic UI updates                                 │   │
│  │  - Polling sync (5s)                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │ HTTP REST API
                        │ (JSON)
┌───────────────────────┼───────────────────────────────────────────┐
│                       ▼                                           │
│                    Backend (Go + Gin)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               POS Handler (Gin)                           │   │
│  │  - GET /api/pos/sessions                                 │   │
│  │  - POST /api/pos/sessions                                │   │
│  │  - GET /api/pos/sessions/:id                             │   │
│  │  - PUT /api/pos/sessions/:id                             │   │
│  │  - POST /api/pos/sessions/:id/items                      │   │
│  │  - POST /api/pos/sessions/:id/payment                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                           │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               POS Service (Business Logic)                │   │
│  │  - CreateSession()                                        │   │
│  │  - GetActiveSessionsForStaff()                           │   │
│  │  - AddItemToSession()                                    │   │
│  │  - UpdateSession()                                       │   │
│  │  - CompleteSession()                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                           │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Session Repository (Data Access)                 │   │
│  │  - GORM operations                                        │   │
│  │  - Transaction management                                │   │
│  │  - Query optimization                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       │                                           │
│  ┌────────────────────┼──────────────────────────────────────┐  │
│  │                    ▼                                       │  │
│  │       SQLite Database (WAL mode enabled)                  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  sales_sessions                                     │  │  │
│  │  │  - id, staff_id, customer_id, status               │  │  │
│  │  │  - created_at, updated_at, expires_at              │  │  │
│  │  │  - bill_discount_*                                  │  │  │
│  │  │  INDEX: (staff_id, status), (expires_at, status)   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  sales_session_items                                │  │  │
│  │  │  - id, session_id, inventory_batch_id              │  │  │
│  │  │  - product_id, quantity, unit_price                │  │  │
│  │  │  - item_discount_*                                  │  │  │
│  │  │  INDEX: (session_id)                                │  │  │
│  │  │  CASCADE: ON DELETE session                         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Session Reaper (Background)                  │   │
│  │  - Runs every 5 minutes                                  │   │
│  │  - Finds expired sessions (expires_at < NOW)            │   │
│  │  - Archives to 'expired' status                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Session State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Session Lifecycle                           │
└─────────────────────────────────────────────────────────────────┘

1. CREATE SESSION
   ┌────────────┐    POST /api/pos/sessions      ┌──────────────┐
   │  Frontend  │ ─────────────────────────────> │   Backend    │
   │            │                                 │              │
   │            │ <────────────────────────────── │  Insert DB   │
   └────────────┘    { id, staff_id, expires_at } └──────────────┘
         │
         │ Create Zustand store with session.id
         ▼
   ┌────────────┐
   │ Local Store│
   │ (Empty)    │
   └────────────┘


2. ADD ITEMS (Optimistic)
   ┌────────────┐    1. Update local state       ┌──────────────┐
   │  Frontend  │    (Optimistic, instant UI)    │ Local Store  │
   │            │ ───────────────────────────────>│              │
   │            │                                 │ items.push() │
   └────────────┘                                 └──────────────┘
         │
         │ 2. POST /api/pos/sessions/:id/items
         │    (Debounced 1s)
         ▼
   ┌────────────┐    3. Insert item              ┌──────────────┐
   │  Backend   │ ───────────────────────────────>│   Database   │
   │            │                                 │              │
   │            │ <────────────────────────────── │  Return ID   │
   └────────────┘    4. Replace temp ID          └──────────────┘
         │
         │ 5. Update local store with real ID
         ▼
   ┌────────────┐
   │ Local Store│
   │ (Synced)   │
   └────────────┘


3. SWITCH SESSION
   ┌────────────┐    1. Save current (if dirty)  ┌──────────────┐
   │  Frontend  │ ───────────────────────────────>│   Backend    │
   │            │    PUT /api/pos/sessions/:id    │              │
   │            │                                 │  Update DB   │
   │            │ 2. Switch currentSessionId      └──────────────┘
   │            │    (instant, no blocking)
   │            │
   │            │ 3. Load target from Map
   │            │    (already in memory)
   └────────────┘
         │
         │ Render target session (instant)
         ▼
   ┌────────────┐
   │ Local Store│
   │ (Target)   │
   └────────────┘


4. BACKGROUND SYNC (Polling)
   ┌────────────┐    GET /api/pos/sessions/:id   ┌──────────────┐
   │  Frontend  │ ───────────────────────────────>│   Backend    │
   │ (Every 5s) │                                 │              │
   │            │ <────────────────────────────── │  Query DB    │
   └────────────┘    { updated_at, items, ... }  └──────────────┘
         │
         │ Compare updated_at with local
         │ If server newer: merge (server wins)
         ▼
   ┌────────────┐
   │ Local Store│
   │ (Reconcile)│
   └────────────┘


5. COMPLETE SESSION (Payment)
   ┌────────────┐    POST /api/pos/sessions/:id/payment  ┌────────────┐
   │  Frontend  │ ────────────────────────────────────────>│  Backend   │
   │            │    { payment_method, amount }           │            │
   │            │                                         │ START TX   │
   │            │                                         │ 1. Create  │
   │            │                                         │    Sale    │
   │            │                                         │ 2. Deduct  │
   │            │                                         │    Inventory│
   │            │                                         │ 3. Mark    │
   │            │                                         │    session │
   │            │                                         │    complete│
   │            │                                         │ COMMIT TX  │
   │            │ <────────────────────────────────────────│            │
   └────────────┘    { sale_id, receipt }                └────────────┘
         │
         │ Remove session from local Map
         │ Display receipt
         ▼
   ┌────────────┐
   │ Session    │
   │ Removed    │
   └────────────┘


6. EXPIRE SESSION (Background)
   ┌──────────────┐    (Runs every 5 minutes)    ┌──────────────┐
   │    Reaper    │                               │   Database   │
   │              │                               │              │
   │              │ 1. SELECT expired sessions    │              │
   │              │ ───────────────────────────────>│ WHERE       │
   │              │                                │ expires_at   │
   │              │ <───────────────────────────────│ < NOW       │
   │              │    [expired_session_ids]       │              │
   │              │                                │              │
   │              │ 2. UPDATE status = 'expired'   │              │
   │              │ ───────────────────────────────>│              │
   └──────────────┘                                └──────────────┘
```

### Concurrency Handling

```
┌─────────────────────────────────────────────────────────────────┐
│               SQLite WAL Mode Concurrency                        │
└─────────────────────────────────────────────────────────────────┘

                    SQLite Database (WAL Mode)
                    ┌─────────────────────────┐
                    │   Database File         │
                    │   (Main storage)        │
                    └─────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐          ┌──────────┐
  │ Reader 1 │         │ Reader 2 │          │ Reader 3 │
  │          │         │          │          │          │
  │ Cashier  │         │ Cashier  │          │ Manager  │
  │ Session  │         │ Session  │          │ Report   │
  │ List     │         │ Details  │          │ Query    │
  └──────────┘         └──────────┘          └──────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ALL READ SIMULTANEOUSLY
                    (No blocking between readers)
                              │
                              │
                              ▼
                    ┌─────────────────────────┐
                    │   WAL File              │
                    │   (Write buffer)        │
                    └─────────────────────────┘
                              ▲
                              │ Write operations
                              │ (ONE AT A TIME)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐          ┌──────────┐
  │ Writer 1 │ ──X──>  │ Writer 2 │ ──X──>   │ Writer 3 │
  │          │ WAIT    │          │ WAIT     │          │
  │ Cashier  │         │ Cashier  │          │ Reaper   │
  │ Add Item │         │ Update   │          │ Cleanup  │
  │ (Active) │         │ (Queued) │          │ (Queued) │
  └──────────┘         └──────────┘          └──────────┘

  Writer 1 completes in ~10-50ms
       │
       └────> Writer 2 acquires lock
              │
              └────> Writer 2 completes in ~10-50ms
                     │
                     └────> Writer 3 acquires lock
                            │
                            └────> Writer 3 completes in ~10-50ms


┌─────────────────────────────────────────────────────────────────┐
│         Write Contention Handling (Busy Retry)                   │
└─────────────────────────────────────────────────────────────────┘

  Thread 1                      Thread 2
  ────────                      ────────
  BEGIN TRANSACTION
    UPDATE sales_sessions ...   BEGIN TRANSACTION
    [HOLDS LOCK]                  UPDATE sales_sessions ...
                                  [SQLITE_BUSY error]
                                  │
                                  ├─> Retry 1: wait 50ms
                                  │   (Thread 1 still holding lock)
                                  │   [SQLITE_BUSY again]
                                  │
    [Transaction completes]      ├─> Retry 2: wait 100ms
    COMMIT                       │   (Thread 1 released lock)
    [RELEASES LOCK]              │   [SUCCESS - acquires lock]
                                  │
                                  UPDATE sales_sessions ...
                                  [HOLDS LOCK]
                                  COMMIT
                                  [RELEASES LOCK]
```

---

## 6. Performance Analysis

### Frontend Performance

**State Update Performance**:
- **Zustand subscribe**: O(1) - direct store access, no context traversal
- **Component re-render**: Only components subscribed to changed state slice
- **Session switch**: <50ms (no data fetch, already in memory)

**Memory Footprint**:
- 5 sessions × ~100 items/session × ~1KB/item = ~500KB
- Zustand store overhead: ~10KB per store
- **Total**: <1MB for 5 active sessions - negligible

**Benchmark Target**:
- Add item to cart: <16ms (60fps)
- Switch session: <100ms (feel instant)
- Apply discount: <16ms (60fps)

### Backend Performance

**Database Query Performance** (with indexes):

| Operation | Query Time | Notes |
|-----------|-----------|-------|
| List active sessions | <10ms | Indexed on (staff_id, status) |
| Get session with items | <15ms | JOIN with items table |
| Add item to session | <30ms | INSERT + UPDATE (2 queries) |
| Complete session (payment) | <100ms | Transaction with 3-4 queries |
| Reaper cleanup | <50ms | Indexed on (expires_at, status) |

**Concurrency Handling**:
- **Read throughput**: 1000+ reads/second (WAL mode)
- **Write throughput**: ~100 writes/second (serialized)
- **Expected load**: ~1 write/second (well within limits)

**SQLite WAL Performance**:
```bash
# Enable WAL mode
PRAGMA journal_mode=WAL;

# Configure checkpoint (default: 1000 pages)
PRAGMA wal_autocheckpoint=1000;

# Set busy timeout (avoid immediate SQLITE_BUSY)
PRAGMA busy_timeout=5000;
```

**Connection Pool Settings**:
```go
sqlDB.SetMaxOpenConns(25)        // Max concurrent connections
sqlDB.SetMaxIdleConns(5)         // Idle connections kept alive
sqlDB.SetConnMaxLifetime(5 * time.Minute)  // Recycle connections
```

### Network Performance

**Polling Overhead**:
- Session list poll: ~1KB × 1 req/5s = ~12KB/minute
- Session sync: ~5KB × 1 req/5s × 5 sessions = ~300KB/minute
- **Total bandwidth**: ~320KB/minute = ~20MB/hour

**API Response Times** (target):
- GET /api/pos/sessions: <50ms
- GET /api/pos/sessions/:id: <100ms
- POST /api/pos/sessions/:id/items: <150ms
- PUT /api/pos/sessions/:id: <100ms
- POST /api/pos/sessions/:id/payment: <500ms (transaction-heavy)

### Scalability Limits

**Current Architecture Supports**:
- **Cashiers**: 5-10 concurrent (as specified)
- **Sessions**: 50-100 active sessions total
- **Items per session**: 100-500 items
- **Database size**: 1-10GB (years of history)

**Bottleneck Analysis**:

1. **SQLite Write Serialization**:
   - Limit: ~100 writes/second
   - Current load: ~1 write/second
   - **Headroom**: 100x

2. **Database File Locking**:
   - WAL mode allows concurrent reads
   - Write lock duration: <50ms
   - **Not a bottleneck** at current scale

3. **Frontend Memory**:
   - 5 sessions × ~500KB = ~2.5MB
   - Modern browsers handle 100s of MB easily
   - **Not a bottleneck**

4. **Network Latency**:
   - LAN latency: <1ms
   - Polling every 5s = no network congestion
   - **Not a bottleneck**

**When to Scale Beyond**:
- \>10 concurrent cashiers: Consider PostgreSQL (proper client/server DB)
- \>100 writes/second: SQLite write serialization becomes bottleneck
- Multi-location: Need centralized database server

---

## 7. Testing Strategy

### Unit Tests

**Frontend (Vitest + React Testing Library)**:
```typescript
// Session store tests
describe('SessionStore', () => {
  it('should add item to cart', () => {
    const store = createSessionStore('test-session');
    const item = { id: '1', product_id: 10, quantity: 2, unit_price: 15 };

    store.getState().addItem(item);

    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().isDirty).toBe(true);
  });

  it('should apply bill discount', () => {
    const store = createSessionStore('test-session');
    store.getState().addItem({ /* ... */ });

    store.getState().applyBillDiscount({ type: 'percentage', value: 10 });

    expect(store.getState().billDiscount).toEqual({ type: 'percentage', value: 10 });
  });
});

// Session manager tests
describe('SessionManager', () => {
  it('should create new session', async () => {
    const { createSession } = useSessionManager.getState();

    const sessionId = await createSession();

    expect(sessionId).toBeDefined();
    expect(useSessionManager.getState().activeSessions.has(sessionId)).toBe(true);
  });

  it('should switch between sessions', () => {
    const { switchSession } = useSessionManager.getState();

    switchSession('session-2');

    expect(useSessionManager.getState().currentSessionId).toBe('session-2');
  });
});
```

**Backend (Go testing)**:
```go
// Service tests
func TestPOSService_CreateSession(t *testing.T) {
    repo := repositories.NewMockSessionRepository()
    service := services.NewPOSService(repo)

    session, err := service.CreateSession(1)

    assert.NoError(t, err)
    assert.NotEmpty(t, session.ID)
    assert.Equal(t, 1, session.StaffID)
    assert.Equal(t, "active", session.Status)
}

func TestPOSService_AddItem(t *testing.T) {
    repo := repositories.NewMockSessionRepository()
    service := services.NewPOSService(repo)

    item := &models.SessionItem{
        InventoryBatchID: 5,
        Quantity: 2,
        UnitPrice: 25.0,
    }

    err := service.AddItemToSession("session-1", item)

    assert.NoError(t, err)
    assert.True(t, repo.TouchSessionCalled)
}

// Repository tests (with test database)
func TestSessionRepository_FindByStaffAndStatus(t *testing.T) {
    db := setupTestDB(t)
    repo := repositories.NewSessionRepository(db)

    // Seed test data
    seedSessions(db, []models.SalesSession{
        {ID: "s1", StaffID: 1, Status: "active"},
        {ID: "s2", StaffID: 1, Status: "completed"},
        {ID: "s3", StaffID: 2, Status: "active"},
    })

    sessions, err := repo.FindByStaffAndStatus(1, "active")

    assert.NoError(t, err)
    assert.Len(t, sessions, 1)
    assert.Equal(t, "s1", sessions[0].ID)
}
```

### Integration Tests

**API Integration Tests**:
```go
func TestPOSAPI_SessionLifecycle(t *testing.T) {
    router := setupTestRouter()

    // 1. Create session
    w := httptest.NewRecorder()
    req := httptest.NewRequest("POST", "/api/pos/sessions", strings.NewReader(`{"staff_id":1}`))
    router.ServeHTTP(w, req)

    assert.Equal(t, 201, w.Code)
    var session models.SalesSession
    json.Unmarshal(w.Body.Bytes(), &session)
    sessionID := session.ID

    // 2. Add item
    w = httptest.NewRecorder()
    req = httptest.NewRequest("POST", "/api/pos/sessions/"+sessionID+"/items",
        strings.NewReader(`{"inventory_batch_id":5,"quantity":2,"unit_price":25.0}`))
    router.ServeHTTP(w, req)

    assert.Equal(t, 201, w.Code)

    // 3. Get session
    w = httptest.NewRecorder()
    req = httptest.NewRequest("GET", "/api/pos/sessions/"+sessionID, nil)
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
    json.Unmarshal(w.Body.Bytes(), &session)
    assert.Len(t, session.Items, 1)

    // 4. Complete session
    w = httptest.NewRecorder()
    req = httptest.NewRequest("POST", "/api/pos/sessions/"+sessionID+"/payment",
        strings.NewReader(`{"method":"cash","amount":50.0}`))
    router.ServeHTTP(w, req)

    assert.Equal(t, 200, w.Code)
}
```

**Frontend Integration Tests** (Cypress/Playwright):
```typescript
describe('Multi-Session POS', () => {
  it('should create and switch between multiple sessions', () => {
    cy.visit('/pos');
    cy.login('cashier1', 'password');

    // Create first session
    cy.contains('New Session').click();
    cy.contains('Session 1').should('be.visible');

    // Add item to first session
    cy.get('[data-testid="product-search"]').type('brake cable');
    cy.get('[data-testid="product-result"]').first().click();
    cy.contains('Brake Cable').should('be.visible');

    // Create second session
    cy.contains('New Session').click();
    cy.contains('Session 2').should('be.visible');

    // Add different item to second session
    cy.get('[data-testid="product-search"]').type('tire tube');
    cy.get('[data-testid="product-result"]').first().click();
    cy.contains('Tire Tube').should('be.visible');

    // Switch back to first session
    cy.contains('Session 1').click();
    cy.contains('Brake Cable').should('be.visible');
    cy.contains('Tire Tube').should('not.exist');

    // Switch to second session
    cy.contains('Session 2').click();
    cy.contains('Tire Tube').should('be.visible');
    cy.contains('Brake Cable').should('not.exist');
  });

  it('should persist session data on page reload', () => {
    cy.visit('/pos');
    cy.login('cashier1', 'password');

    // Create session with items
    cy.contains('New Session').click();
    cy.addItem('brake cable', 2);
    cy.addItem('tire tube', 1);

    // Reload page
    cy.reload();

    // Sessions should be restored
    cy.contains('Session 1').should('be.visible');
    cy.contains('Brake Cable').should('be.visible');
    cy.contains('Tire Tube').should('be.visible');
  });
});
```

### Performance Tests

**Load Testing (k6)**:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5, // 5 concurrent cashiers
  duration: '5m',
};

export default function() {
  const staffId = Math.floor(Math.random() * 5) + 1;

  // Create session
  let res = http.post('http://localhost:8080/api/pos/sessions',
    JSON.stringify({ staff_id: staffId }));
  check(res, { 'session created': (r) => r.status === 201 });
  const sessionId = res.json('id');

  // Add 10 items
  for (let i = 0; i < 10; i++) {
    res = http.post(`http://localhost:8080/api/pos/sessions/${sessionId}/items`,
      JSON.stringify({
        inventory_batch_id: Math.floor(Math.random() * 100) + 1,
        quantity: Math.floor(Math.random() * 5) + 1,
        unit_price: Math.random() * 100
      }));
    check(res, { 'item added': (r) => r.status === 201 });
    sleep(1); // 1 second between item additions
  }

  // Complete session
  res = http.post(`http://localhost:8080/api/pos/sessions/${sessionId}/payment`,
    JSON.stringify({ method: 'cash', amount: 100 }));
  check(res, { 'payment completed': (r) => r.status === 200 });

  sleep(5); // 5 second break between sessions
}
```

**Expected Results**:
- All requests should complete with <200ms p95 latency
- No SQLITE_BUSY errors (or <1% if retries succeed)
- CPU usage <50% on modest server
- Memory usage stable (no leaks)

---

## 8. Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Frontend State** | Zustand + React Context | Performance (selective subscriptions), session isolation, simplicity |
| **Backend Persistence** | SQLite with WAL mode | Durability, ACID transactions, sufficient concurrency, simple deployment |
| **Real-Time Updates** | Short-polling (5s) + Optimistic UI | Simple, sufficient latency, low overhead, stateless |
| **Session Cleanup** | Background reaper (5min) + Rolling expiry | Automatic, reliable, low overhead, good UX |
| **Session Switching** | Instant (in-memory Map) | All sessions pre-loaded, <100ms switch time |
| **Conflict Resolution** | Server wins, last-write-wins | Simple, deterministic, rare conflicts |
| **Transaction Scope** | Keep transactions short (<50ms) | Minimize lock contention, maximize concurrency |
| **Expiry Strategy** | Rolling expiry (extends on activity) | Better UX, active sessions don't expire unexpectedly |

---

## 9. Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Database schema (sales_sessions, sales_session_items)
- [ ] Enable SQLite WAL mode and busy timeout
- [ ] Session repository (CRUD operations)
- [ ] POS service (business logic)
- [ ] POS handler (API endpoints)
- [ ] Unit tests (service + repository)
- [ ] Integration tests (API)

### Phase 2: Frontend Foundation
- [ ] Session store factory (Zustand)
- [ ] Session manager store (Zustand)
- [ ] Session context (React Context)
- [ ] POS page component
- [ ] Session tabs component
- [ ] Unit tests (stores)

### Phase 3: Session Operations
- [ ] Create session (frontend + backend)
- [ ] Add item with optimistic UI
- [ ] Update session (discounts, customer)
- [ ] Switch session (instant, in-memory)
- [ ] Delete/hold session
- [ ] E2E tests (session lifecycle)

### Phase 4: Sync Layer
- [ ] Debounced auto-save (1s)
- [ ] Polling sync (5s intervals)
- [ ] Conflict resolution (server wins)
- [ ] Sync status indicators
- [ ] Error handling and retry

### Phase 5: Session Cleanup
- [ ] Background reaper implementation
- [ ] Expiry query (indexed)
- [ ] Archive to 'expired' status
- [ ] Reaper startup integration
- [ ] Unit tests (reaper logic)

### Phase 6: Polish
- [ ] Session expiry warning UI
- [ ] Resume sessions on page reload
- [ ] Sync indicators (saving, error)
- [ ] Performance monitoring
- [ ] Load testing (k6)

---

## 10. Future Enhancements

**Out of Scope for Initial Release**:

1. **Multi-Device Session Sharing**:
   - Allow cashier to start session on desktop, continue on tablet
   - Requires WebSocket for real-time sync across devices
   - Add device fingerprinting to session table

2. **Session Transfer**:
   - Allow manager to transfer session from one cashier to another
   - Add `transferred_to_staff_id` field
   - Audit log for transfers

3. **Session Analytics**:
   - Track average session duration
   - Identify frequently abandoned sessions
   - Alert on sessions near expiry with high value

4. **Offline Support**:
   - Service worker for offline operation
   - Queue mutations for sync when online
   - Conflict resolution for offline edits

5. **Session Templates**:
   - Save common item bundles as templates
   - Quick-start session with template
   - Useful for recurring orders

---

## 11. References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [SQLite WAL Mode](https://www.sqlite.org/wal.html)
- [GORM Documentation](https://gorm.io/docs/)
- [Gin Web Framework](https://gin-gonic.com/docs/)
- [React Context API](https://react.dev/reference/react/useContext)
- [Optimistic UI Patterns](https://www.apollographql.com/docs/react/performance/optimistic-ui/)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Author**: Research Team
**Status**: Final
