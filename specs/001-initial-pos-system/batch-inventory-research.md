# Batch-Based Inventory Tracking: Database Schema and Implementation Research

**Date**: 2025-10-09
**Context**: Hardware Store POS and Inventory System - Batch-level inventory tracking where each purchase creates separate batches with independent pricing

## Executive Summary

This research document provides comprehensive recommendations for implementing batch-based inventory tracking in a Go/GORM application with SQLite backend. The system must support:
- Multiple batches of the same product from the same supplier at different prices
- FIFO/LIFO inventory selection strategies
- Batch traceability for returns (linking sales to specific batches)
- Up to thousands of batches across 10,000 products

**Key Decision**: Implement a **batch-centric inventory model** with composite indexes, eager loading via GORM Preload, and FIFO as the default selection strategy with LIFO available as configuration.

---

## 1. Database Schema for Batch-Based Inventory

### 1.1 Decision: Batch-Centric Schema with Explicit Relationships

**Rationale**:
- Each purchase creates a new inventory batch, even for the same product/supplier combination
- Batches maintain independent pricing (purchase price and sale price)
- Sales must track which batch items came from for accurate returns
- Batch records persist even when quantity reaches zero (audit trail)

### 1.2 Core Tables and Relationships

#### Table: `inventory_batches`

```go
// GORM Model
type InventoryBatch struct {
    ID             uint      `gorm:"primaryKey"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
    DeletedAt      gorm.DeletedAt `gorm:"index"`

    // Relationships
    ProductID      uint      `gorm:"not null;index:idx_product_supplier,priority:1;index:idx_product_qty;index:idx_batch_lookup"`
    Product        Product   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    SupplierID     uint      `gorm:"not null;index:idx_product_supplier,priority:2"`
    Supplier       Supplier  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    PurchaseID     uint      `gorm:"not null;index:idx_purchase"`
    Purchase       Purchase  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    // Batch Data
    BatchNumber    string    `gorm:"uniqueIndex;not null;size:100"` // Auto-generated: PO-{PurchaseID}-{LineItem}
    Quantity       int       `gorm:"not null;default:0;index:idx_product_qty;check:quantity >= 0"`
    PurchasePrice  float64   `gorm:"type:decimal(10,2);not null"`
    SalePrice      float64   `gorm:"type:decimal(10,2);not null"`
    ReceivedDate   time.Time `gorm:"not null;index:idx_received_date"`

    // Optional tracking fields
    ExpiryDate     *time.Time `gorm:"index:idx_expiry"`
    Notes          string     `gorm:"type:text"`
}
```

**Index Strategy**:
1. **Composite Index: `idx_product_supplier` (product_id, supplier_id)**
   - Purpose: Fast lookups when viewing inventory by product and supplier
   - Use case: "Show me all batches for Product X from Supplier Y"

2. **Composite Index: `idx_product_qty` (product_id, quantity)**
   - Purpose: FIFO/LIFO queries to find available batches with stock
   - Use case: "Find available batches for Product X where quantity > 0"

3. **Single Index: `idx_batch_lookup` (product_id)**
   - Purpose: Fast product-level inventory queries
   - Use case: "Show all batches for Product X"

4. **Single Index: `idx_received_date` (received_date)**
   - Purpose: Supports FIFO ordering (oldest first)
   - Use case: ORDER BY received_date ASC

5. **Single Index: `idx_purchase` (purchase_id)**
   - Purpose: Trace batches back to purchase orders
   - Use case: "Show all inventory batches from Purchase Order #123"

6. **Single Index: `idx_expiry` (expiry_date)**
   - Purpose: Find expiring batches (FEFO strategy if needed)
   - Use case: "Alert on batches expiring within 30 days"

7. **Unique Index: Batch Number**
   - Purpose: Ensure batch uniqueness across system
   - Format: `PO-{PurchaseID}-{LineItemNumber}` or UUID

#### Table: `sale_items`

```go
type SaleItem struct {
    ID               uint    `gorm:"primaryKey"`
    CreatedAt        time.Time

    // Relationships
    SaleID           uint    `gorm:"not null;index:idx_sale_lookup"`
    Sale             Sale    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    ProductID        uint    `gorm:"not null;index:idx_product_sales"`
    Product          Product `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    // CRITICAL: Batch traceability for returns
    InventoryBatchID uint           `gorm:"not null;index:idx_batch_traceability"`
    InventoryBatch   InventoryBatch `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    // Sale Item Data
    Quantity         int     `gorm:"not null;check:quantity > 0"`
    UnitPrice        float64 `gorm:"type:decimal(10,2);not null"` // Sale price from batch at time of sale
    Discount         float64 `gorm:"type:decimal(10,2);default:0"` // Item-level discount
    Subtotal         float64 `gorm:"type:decimal(10,2);not null"`  // (UnitPrice * Quantity) - Discount
}
```

**Index Strategy**:
1. **Single Index: `idx_batch_traceability` (inventory_batch_id)**
   - Purpose: Critical for returns - find all sales from a specific batch
   - Use case: "Which sales used inventory from Batch #123?"

2. **Single Index: `idx_sale_lookup` (sale_id)**
   - Purpose: Fast retrieval of all items in a sale
   - Use case: "Show all items for Sale #456"

3. **Single Index: `idx_product_sales` (product_id)**
   - Purpose: Product sales history and analytics
   - Use case: "Show sales history for Product X"

#### Table: `return_items`

```go
type ReturnItem struct {
    ID               uint      `gorm:"primaryKey"`
    CreatedAt        time.Time

    // Relationships
    ReturnID         uint      `gorm:"not null;index:idx_return_lookup"`
    Return           Return    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    SaleItemID       uint      `gorm:"not null;index:idx_original_sale_item"`
    SaleItem         SaleItem  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    // Return Data
    Quantity         int       `gorm:"not null;check:quantity > 0"`
    RefundAmount     float64   `gorm:"type:decimal(10,2);not null"`
}
```

**How Returns Work**:
1. Return references original `SaleItem`
2. `SaleItem` contains `InventoryBatchID` - this tells us which batch to restore
3. When processing return: `UPDATE inventory_batches SET quantity = quantity + {returned_qty} WHERE id = {batch_id_from_sale_item}`

---

## 2. FIFO/LIFO Selection Strategies

### 2.1 Decision: FIFO as Default, LIFO Optional

**Rationale**:
- **FIFO** is standard practice for hardware stores (prevents old stock from aging)
- **LIFO** allowed under US GAAP but banned in IFRS (international businesses can't use it)
- Hardware spare parts don't expire quickly, but FIFO prevents obsolescence
- Configuration-based strategy allows flexibility per business needs

### 2.2 Implementation Patterns

#### FIFO Implementation (Recommended Default)

```go
// InventoryService method
func (s *InventoryService) GetAvailableBatches(productID uint, strategy string) ([]InventoryBatch, error) {
    var batches []InventoryBatch

    query := s.db.Where("product_id = ? AND quantity > 0", productID)

    switch strategy {
    case "FIFO":
        // Oldest batches first (received_date ASC)
        query = query.Order("received_date ASC")
    case "LIFO":
        // Newest batches first (received_date DESC)
        query = query.Order("received_date DESC")
    case "FEFO": // First Expired, First Out
        // Batches expiring soonest first
        query = query.Where("expiry_date IS NOT NULL").Order("expiry_date ASC")
    default:
        query = query.Order("received_date ASC") // Default to FIFO
    }

    // Critical: Use index idx_product_qty + idx_received_date
    err := query.Find(&batches).Error
    return batches, err
}
```

**Query Plan Analysis**:
- Index `idx_product_qty` (product_id, quantity) handles the WHERE clause
- Index `idx_received_date` handles the ORDER BY clause
- Combined result: Fast query even with thousands of batches

#### POS Batch Selection

```go
// When cashier adds item to cart
func (s *POSService) AddItemToSession(sessionID, productID uint, requestedQty int, strategy string) error {
    // Get available batches in FIFO/LIFO order
    batches, err := s.inventoryService.GetAvailableBatches(productID, strategy)
    if err != nil {
        return err
    }

    // Check total availability
    totalAvailable := 0
    for _, batch := range batches {
        totalAvailable += batch.Quantity
    }

    if totalAvailable < requestedQty {
        return ErrInsufficientInventory
    }

    // Allocate from batches in order (FIFO/LIFO)
    remainingQty := requestedQty
    for _, batch := range batches {
        if remainingQty == 0 {
            break
        }

        qtyFromBatch := min(remainingQty, batch.Quantity)

        // Create session item linked to this batch
        sessionItem := SalesSessionItem{
            SessionID:        sessionID,
            ProductID:        productID,
            InventoryBatchID: batch.ID,
            Quantity:         qtyFromBatch,
            UnitPrice:        batch.SalePrice, // Sale price from batch
        }

        if err := s.db.Create(&sessionItem).Error; err != nil {
            return err
        }

        remainingQty -= qtyFromBatch
    }

    return nil
}
```

### 2.3 When to Use FIFO vs LIFO

| Strategy | Use When | Business Rationale | Accounting Impact |
|----------|----------|-------------------|-------------------|
| **FIFO** (Recommended) | - Perishable goods<br>- Hardware parts that can obsolete<br>- International business (IFRS compliant) | - Prevents old stock from aging indefinitely<br>- Reduces risk of obsolescence<br>- Matches physical flow of goods | - Higher COGS when prices rising<br>- Lower net income<br>- Higher taxes |
| **LIFO** | - Non-perishable goods<br>- US-only business<br>- Inflation hedging | - Tax benefits when prices rising<br>- Matches recent costs to revenue | - Lower COGS when prices rising<br>- Higher net income<br>- Lower taxes (US tax benefit) |
| **FEFO** | - Goods with expiry dates<br>- Medical supplies<br>- Certain chemicals | - Regulatory compliance<br>- Safety requirements<br>- Minimize waste | - Varies based on expiry patterns |

**Recommendation for Hardware Store**: Use **FIFO** as default with configuration option for LIFO. Hardware spare parts can become obsolete (new models, discontinued parts), so selling older inventory first reduces long-term carrying costs.

---

## 3. Batch Traceability for Returns

### 3.1 Decision: Explicit Batch References in Sale Items

**Rationale**:
- Returns must restore inventory to the EXACT batch it came from
- This maintains accurate per-batch costing and inventory records
- Enables complete traceability: Product → Batch → Purchase Order → Supplier

### 3.2 Return Processing Flow

```go
// ReturnService method
func (s *ReturnService) ProcessReturn(returnRequest ReturnRequest) error {
    return s.db.Transaction(func(tx *gorm.DB) error {
        // 1. Create return record
        returnTx := Return{
            SaleID:            returnRequest.SaleID,
            CustomerID:        returnRequest.CustomerID,
            TotalRefund:       0, // Calculate below
            RequiresApproval:  s.requiresApproval(returnRequest.SaleID),
            ApprovedBy:        returnRequest.ManagerID, // Null if no approval needed
        }

        if err := tx.Create(&returnTx).Error; err != nil {
            return err
        }

        // 2. Process each returned item
        for _, returnItem := range returnRequest.Items {
            // Get original sale item (includes batch reference)
            var saleItem SaleItem
            if err := tx.Preload("InventoryBatch").First(&saleItem, returnItem.SaleItemID).Error; err != nil {
                return err
            }

            // Validate return quantity
            if returnItem.Quantity > saleItem.Quantity {
                return ErrInvalidReturnQuantity
            }

            // Calculate refund (proportional to original price with discount)
            refundPerUnit := saleItem.Subtotal / float64(saleItem.Quantity)
            refundAmount := refundPerUnit * float64(returnItem.Quantity)

            // Create return item record
            retItem := ReturnItem{
                ReturnID:     returnTx.ID,
                SaleItemID:   saleItem.ID,
                Quantity:     returnItem.Quantity,
                RefundAmount: refundAmount,
            }
            if err := tx.Create(&retItem).Error; err != nil {
                return err
            }

            // 3. CRITICAL: Restore inventory to original batch
            // This is why we stored InventoryBatchID in SaleItem!
            if err := tx.Model(&InventoryBatch{}).
                Where("id = ?", saleItem.InventoryBatchID).
                Update("quantity", gorm.Expr("quantity + ?", returnItem.Quantity)).
                Error; err != nil {
                return err
            }

            returnTx.TotalRefund += refundAmount
        }

        // 4. Update return total
        if err := tx.Model(&returnTx).Update("total_refund", returnTx.TotalRefund).Error; err != nil {
            return err
        }

        // 5. Adjust customer credit if sale was on credit
        var sale Sale
        if err := tx.First(&sale, returnRequest.SaleID).Error; err != nil {
            return err
        }

        if sale.PaymentMethod == "CREDIT" {
            // Reduce customer's credit balance
            if err := tx.Model(&Customer{}).
                Where("id = ?", sale.CustomerID).
                Update("credit_balance", gorm.Expr("credit_balance - ?", returnTx.TotalRefund)).
                Error; err != nil {
                return err
            }
        }

        return nil
    })
}

func (s *ReturnService) requiresApproval(saleID uint) bool {
    var sale Sale
    s.db.First(&sale, saleID)

    daysSinceSale := time.Since(sale.CreatedAt).Hours() / 24
    return daysSinceSale > 7 // Manager approval required for returns > 7 days
}
```

### 3.3 Traceability Query Examples

```go
// Example 1: Trace a product through the entire supply chain
func TraceProduct(db *gorm.DB, saleItemID uint) (*TraceResult, error) {
    var saleItem SaleItem
    err := db.Preload("Sale").
        Preload("Product").
        Preload("InventoryBatch.Purchase.Supplier").
        First(&saleItem, saleItemID).Error

    if err != nil {
        return nil, err
    }

    trace := &TraceResult{
        Product:      saleItem.Product.Description,
        BatchNumber:  saleItem.InventoryBatch.BatchNumber,
        Supplier:     saleItem.InventoryBatch.Purchase.Supplier.Name,
        PurchaseDate: saleItem.InventoryBatch.ReceivedDate,
        SaleDate:     saleItem.Sale.CreatedAt,
    }

    return trace, nil
}

// Example 2: Find all sales from a specific batch (e.g., for recalls)
func FindSalesFromBatch(db *gorm.DB, batchID uint) ([]SaleItem, error) {
    var saleItems []SaleItem
    err := db.Where("inventory_batch_id = ?", batchID).
        Preload("Sale.Customer").
        Preload("Product").
        Find(&saleItems).Error

    return saleItems, err
}

// Example 3: Batch recall - find all customers who purchased from defective batch
func RecallBatch(db *gorm.DB, batchNumber string) ([]Customer, error) {
    var customers []Customer
    err := db.Joins("JOIN sales ON sales.customer_id = customers.id").
        Joins("JOIN sale_items ON sale_items.sale_id = sales.id").
        Joins("JOIN inventory_batches ON inventory_batches.id = sale_items.inventory_batch_id").
        Where("inventory_batches.batch_number = ?", batchNumber).
        Distinct().
        Find(&customers).Error

    return customers, err
}
```

---

## 4. Performance Optimization for Batch Queries

### 4.1 Decision: Composite Indexes + Eager Loading + Query Optimization

**Rationale**:
- Batch queries are frequent (every POS transaction)
- N+1 query problem is common when loading related data
- SQLite performs well with proper indexes but lacks some PostgreSQL optimizations
- Expect 10,000 products × average 5 batches per product = 50,000 batch records

### 4.2 Index Strategy Summary

| Index Name | Columns | Purpose | Query Pattern |
|------------|---------|---------|---------------|
| `idx_product_supplier` | (product_id, supplier_id) | Inventory by product and supplier | WHERE product_id = ? AND supplier_id = ? |
| `idx_product_qty` | (product_id, quantity) | Find available batches | WHERE product_id = ? AND quantity > 0 |
| `idx_batch_lookup` | (product_id) | All batches for product | WHERE product_id = ? |
| `idx_received_date` | (received_date) | FIFO ordering | ORDER BY received_date ASC |
| `idx_batch_traceability` | (inventory_batch_id) | Returns and recalls | WHERE inventory_batch_id = ? |
| `idx_sale_lookup` | (sale_id) | Sale items retrieval | WHERE sale_id = ? |
| `idx_expiry` | (expiry_date) | Expiring batches | WHERE expiry_date < ? |

**Index Size Impact**:
- With 50,000 batches, each index adds ~1-2 MB to database size
- Total index overhead: ~10-15 MB (acceptable for single-machine deployment)
- Query performance improvement: 2-3 orders of magnitude for indexed queries

### 4.3 Avoiding N+1 Queries with GORM Preload

**Problem**: N+1 queries occur when loading related data in a loop

```go
// BAD: N+1 Query Problem
func GetProductInventory(db *gorm.DB) ([]Product, error) {
    var products []Product
    db.Find(&products)

    for i := range products {
        // This executes a query for EACH product (N queries)
        db.Model(&products[i]).Association("InventoryBatches").Find(&products[i].InventoryBatches)
    }

    return products, nil
}
// Results in: 1 query for products + N queries for batches = N+1 queries
```

**Solution 1: Preload (Separate Queries)**

```go
// GOOD: Preload - 2 queries total
func GetProductInventory(db *gorm.DB) ([]Product, error) {
    var products []Product
    err := db.Preload("InventoryBatches").Find(&products).Error
    return products, err
}
// Query 1: SELECT * FROM products
// Query 2: SELECT * FROM inventory_batches WHERE product_id IN (1,2,3,...)
// Total: 2 queries regardless of number of products
```

**Solution 2: Joins Preload (Single Query with LEFT JOIN)**

```go
// BEST for small result sets: Single query with JOIN
func GetProductInventory(db *gorm.DB) ([]Product, error) {
    var products []Product
    err := db.Joins("LEFT JOIN inventory_batches ON inventory_batches.product_id = products.id").
        Find(&products).Error
    return products, err
}
// Single query: SELECT products.*, inventory_batches.* FROM products LEFT JOIN inventory_batches ...
```

**When to Use Each**:
- **Preload**: Large result sets, complex relationships, better for SQLite
- **Joins**: Small result sets, simple relationships, need single query
- **Hardware Store Context**: Use **Preload** for batch queries (better SQLite performance)

### 4.4 Nested Preloading for Complex Queries

```go
// Load sale with all related data in 4 queries (not N+1)
func GetSaleWithDetails(db *gorm.DB, saleID uint) (*Sale, error) {
    var sale Sale
    err := db.Preload("Customer").                              // Query 2
        Preload("SaleItems").                                   // Query 3
        Preload("SaleItems.Product").                           // Query 4
        Preload("SaleItems.InventoryBatch").                    // Query 5
        Preload("SaleItems.InventoryBatch.Supplier").           // Query 6
        First(&sale, saleID).Error                              // Query 1

    return &sale, err
}
// Total: 6 queries regardless of number of items (better than N+1)
```

### 4.5 Query Optimization Patterns

#### Pattern 1: Conditional Preloading

```go
// Only load batches if needed
func GetProducts(db *gorm.DB, includeBatches bool) ([]Product, error) {
    query := db.Model(&Product{})

    if includeBatches {
        query = query.Preload("InventoryBatches", "quantity > 0") // Only load available batches
    }

    var products []Product
    err := query.Find(&products).Error
    return products, err
}
```

#### Pattern 2: Pagination for Large Result Sets

```go
// Paginate batch queries for performance
func GetBatchesPaginated(db *gorm.DB, productID uint, page, pageSize int) ([]InventoryBatch, int64, error) {
    var batches []InventoryBatch
    var total int64

    // Count query
    db.Model(&InventoryBatch{}).Where("product_id = ?", productID).Count(&total)

    // Data query with pagination
    offset := (page - 1) * pageSize
    err := db.Where("product_id = ?", productID).
        Order("received_date ASC").
        Limit(pageSize).
        Offset(offset).
        Find(&batches).Error

    return batches, total, err
}
```

#### Pattern 3: Aggregate Queries for Dashboard

```go
// Efficient aggregate without loading all records
func GetInventorySummary(db *gorm.DB) ([]InventorySummary, error) {
    var summaries []InventorySummary

    err := db.Model(&InventoryBatch{}).
        Select("product_id, SUM(quantity) as total_quantity, COUNT(*) as batch_count").
        Where("quantity > 0").
        Group("product_id").
        Find(&summaries).Error

    return summaries, err
}
```

#### Pattern 4: Batch Operations for Bulk Updates

```go
// Update multiple batches efficiently
func DeductInventory(db *gorm.DB, deductions []InventoryDeduction) error {
    return db.Transaction(func(tx *gorm.DB) error {
        for _, deduction := range deductions {
            // Single update query per batch
            if err := tx.Model(&InventoryBatch{}).
                Where("id = ? AND quantity >= ?", deduction.BatchID, deduction.Quantity).
                Update("quantity", gorm.Expr("quantity - ?", deduction.Quantity)).
                Error; err != nil {
                return err
            }
        }
        return nil
    })
}
```

### 4.6 SQLite-Specific Optimizations

```go
// Initialize SQLite with performance settings
func InitDB(dbPath string) (*gorm.DB, error) {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        PrepareStmt:            true,  // Prepared statement cache
        SkipDefaultTransaction: false, // Keep transactions for safety
    })

    if err != nil {
        return nil, err
    }

    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    // SQLite pragmas for performance
    sqlDB.Exec("PRAGMA journal_mode=WAL")           // Write-Ahead Logging (better concurrency)
    sqlDB.Exec("PRAGMA synchronous=NORMAL")         // Balance between speed and safety
    sqlDB.Exec("PRAGMA cache_size=-64000")          // 64MB cache
    sqlDB.Exec("PRAGMA temp_store=MEMORY")          // Temp tables in memory
    sqlDB.Exec("PRAGMA foreign_keys=ON")            // Enforce foreign key constraints

    // Connection pool (SQLite has limited concurrency)
    sqlDB.SetMaxOpenConns(1)  // SQLite only supports single writer
    sqlDB.SetMaxIdleConns(1)

    return db, nil
}
```

---

## 5. Complete GORM Model Examples

### 5.1 Product Model

```go
type Product struct {
    ID             uint      `gorm:"primaryKey"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
    DeletedAt      gorm.DeletedAt `gorm:"index"`

    Code           string    `gorm:"uniqueIndex;not null;size:50"`
    Description    string    `gorm:"not null;size:500"`

    CategoryID     uint      `gorm:"not null;index"`
    Category       Category  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    // JSON field for custom attributes (size, color, material, etc.)
    Attributes     string    `gorm:"type:text"`

    // Relationships
    InventoryBatches []InventoryBatch `gorm:"foreignKey:ProductID"`

    // Computed fields (not stored, calculated on query)
    TotalQuantity  int       `gorm:"-"` // Sum of all batch quantities
    TotalBatches   int       `gorm:"-"` // Count of batches
}
```

### 5.2 Purchase and Purchase Line Item Models

```go
type Purchase struct {
    ID          uint      `gorm:"primaryKey"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
    DeletedAt   gorm.DeletedAt `gorm:"index"`

    PurchaseNumber string    `gorm:"uniqueIndex;not null;size:50"`

    SupplierID  uint      `gorm:"not null;index"`
    Supplier    Supplier  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    PurchaseDate time.Time `gorm:"not null;index"`
    TotalCost    float64   `gorm:"type:decimal(10,2);not null"`

    Notes        string    `gorm:"type:text"`

    // Relationships
    LineItems    []PurchaseLineItem `gorm:"foreignKey:PurchaseID"`
}

type PurchaseLineItem struct {
    ID            uint      `gorm:"primaryKey"`
    CreatedAt     time.Time

    PurchaseID    uint      `gorm:"not null;index"`
    Purchase      Purchase  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

    ProductID     uint      `gorm:"not null;index"`
    Product       Product   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    Quantity      int       `gorm:"not null;check:quantity > 0"`
    UnitPurchasePrice float64 `gorm:"type:decimal(10,2);not null"`
    UnitSalePrice     float64 `gorm:"type:decimal(10,2);not null"`
    Subtotal      float64   `gorm:"type:decimal(10,2);not null"`

    // Each line item creates one inventory batch
    InventoryBatch InventoryBatch `gorm:"foreignKey:PurchaseLineItemID"`
}
```

### 5.3 Sales Session Models (Multi-Session POS)

```go
type SalesSession struct {
    ID          uint      `gorm:"primaryKey"`
    CreatedAt   time.Time
    UpdatedAt   time.Time

    SessionNumber string  `gorm:"uniqueIndex;not null;size:50"` // SS-{timestamp}-{random}

    StaffID     uint      `gorm:"not null;index"`
    Staff       Staff     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    CustomerID  *uint     `gorm:"index"` // Optional (required only for credit)
    Customer    *Customer `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`

    Status      string    `gorm:"type:varchar(20);not null;default:'ACTIVE';index"` // ACTIVE, HELD, COMPLETED, CANCELLED

    BillDiscount float64  `gorm:"type:decimal(10,2);default:0"` // Bill-level discount
    DiscountType string   `gorm:"type:varchar(20)"` // PERCENTAGE, FIXED

    // Relationships
    Items       []SalesSessionItem `gorm:"foreignKey:SessionID"`
}

type SalesSessionItem struct {
    ID               uint      `gorm:"primaryKey"`
    CreatedAt        time.Time
    UpdatedAt        time.Time

    SessionID        uint      `gorm:"not null;index"`
    Session          SalesSession `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

    ProductID        uint      `gorm:"not null;index"`
    Product          Product   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    InventoryBatchID uint      `gorm:"not null;index"`
    InventoryBatch   InventoryBatch `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`

    Quantity         int       `gorm:"not null;check:quantity > 0"`
    UnitPrice        float64   `gorm:"type:decimal(10,2);not null"` // From batch.SalePrice
    ItemDiscount     float64   `gorm:"type:decimal(10,2);default:0"`
    Subtotal         float64   `gorm:"type:decimal(10,2);not null"`
}
```

### 5.4 Migration Function

```go
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &Role{},
        &Permission{},
        &Staff{},
        &Customer{},
        &Supplier{},
        &Category{},
        &Product{},
        &Purchase{},
        &PurchaseLineItem{},
        &InventoryBatch{},
        &SalesSession{},
        &SalesSessionItem{},
        &Sale{},
        &SaleItem{},
        &Return{},
        &ReturnItem{},
        &CreditTransaction{},
        &CreditSettlement{},
    )
}
```

---

## 6. Alternatives Considered and Rejected

### Alternative 1: Single Inventory Table with Average Costing

**Approach**: Store single quantity per product, calculate average cost when purchases arrive.

**Rejected Because**:
- Loses pricing granularity (can't trace sale back to specific purchase)
- Returns would be problematic (which batch does inventory go back to?)
- No traceability for recalls or quality issues
- Doesn't meet requirement: "Each sale item must track which batch it came from"

### Alternative 2: Inventory Transactions Log Only

**Approach**: No inventory table, only transaction log (purchases, sales, adjustments).

**Rejected Because**:
- Calculating current inventory requires summing all transactions (slow)
- No easy way to show "available batches" at POS
- Complex queries for simple operations
- Performance issues with thousands of transactions

### Alternative 3: Batch Selection During Payment (Not During Cart)

**Approach**: Add items to cart without batch reference, select batches during payment.

**Rejected Because**:
- Risk of overselling if multiple sessions claim same inventory
- More complex payment processing
- Cashier can't see actual price until payment (confusing)
- Violates requirement: "When selecting product, show all available batches with prices"

### Alternative 4: PostgreSQL Instead of SQLite

**Approach**: Use PostgreSQL for advanced features (better indexing, CTEs, window functions).

**Accepted for Future Consideration, Rejected for Initial Version Because**:
- Single-shop deployment doesn't need PostgreSQL's concurrency features
- SQLite is simpler (single file, no server process)
- Migration path exists if needed (GORM supports both)
- Performance adequate for 10,000 products with proper indexing

**When to Consider PostgreSQL**:
- Multi-shop expansion (need centralized database)
- Concurrent users exceeds 10-15
- Advanced reporting requirements
- Need full-text search

---

## 7. Implementation Checklist

### Phase 1: Schema Implementation
- [ ] Create GORM models for all entities
- [ ] Define indexes on tables (composite and single)
- [ ] Set up foreign key constraints
- [ ] Create migration function
- [ ] Test migrations on empty database

### Phase 2: Service Layer
- [ ] Implement `InventoryService.GetAvailableBatches()`
- [ ] Implement FIFO/LIFO/FEFO strategies
- [ ] Implement `POSService.AddItemToSession()` with batch allocation
- [ ] Implement `PaymentService.CompletePayment()` with inventory deduction
- [ ] Implement `ReturnService.ProcessReturn()` with batch restoration

### Phase 3: Query Optimization
- [ ] Enable SQLite pragmas (WAL, cache size)
- [ ] Use GORM Preload for all relationship queries
- [ ] Test query performance with 50,000 sample batches
- [ ] Verify indexes are used (EXPLAIN QUERY PLAN)
- [ ] Benchmark critical queries (<100ms target)

### Phase 4: Testing
- [ ] Unit tests for batch allocation logic
- [ ] Integration tests for POS flow (cart → payment → inventory deduction)
- [ ] Integration tests for returns (restore to correct batch)
- [ ] Load testing with 1000+ concurrent batch queries
- [ ] Traceability tests (trace sale item back to supplier)

---

## 8. Key Takeaways

1. **Batch-centric schema** with explicit `inventory_batch_id` in sale items enables complete traceability
2. **FIFO as default** prevents obsolescence, with LIFO available for tax optimization
3. **Composite indexes** (product_id + quantity) + (product_id + supplier_id) optimize batch queries
4. **GORM Preload** prevents N+1 queries when loading related data
5. **SQLite with WAL mode** handles thousands of batches efficiently for single-shop deployment
6. **Returns restore to original batch** by referencing batch ID stored in sale item
7. **Transaction isolation** ensures concurrent sessions don't oversell inventory

---

## 9. References

- GORM Documentation: https://gorm.io/docs/
- SQLite Performance: https://www.sqlite.org/pragma.html
- Inventory Tracking Best Practices: NetSuite Batch Tracking Guide
- Database Indexing Strategies: https://use-the-index-luke.com/
- N+1 Query Problem: https://planetscale.com/blog/what-is-n-1-query-problem

---

**Next Steps**: Use this research to inform Phase 1 (Data Model Design) and implement the batch-based inventory schema in the POS system.
