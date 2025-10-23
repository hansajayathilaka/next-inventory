package models

// InventoryBatch represents a batch of inventory for a specific product from a specific purchase
type InventoryBatch struct {
	BaseModel
	ProductID       uint     `json:"product_id" gorm:"not null;index"`
	Product         *Product `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	SupplierID      uint     `json:"supplier_id" gorm:"not null;index"`
	Supplier        *Supplier `json:"supplier,omitempty" gorm:"foreignKey:SupplierID"`
	PurchaseID      *uint    `json:"purchase_id" gorm:"index"` // Reference to purchase if from PO
	BatchNumber     string   `json:"batch_number" gorm:"uniqueIndex;size:50"`
	QuantityInStock int      `json:"quantity_in_stock" gorm:"not null;default:0"`
	CostPrice       float64  `json:"cost_price" gorm:"not null;type:decimal(10,2)"`
	SalePrice       float64  `json:"sale_price" gorm:"not null;type:decimal(10,2)"`
	ExpiryDate      *string  `json:"expiry_date" gorm:"type:date"` // Optional
	IsActive        bool     `json:"is_active" gorm:"default:true;index"`
	SessionItems    []SalesSessionItem `json:"session_items,omitempty" gorm:"foreignKey:InventoryBatchID"`
	SaleItems       []SaleItem `json:"sale_items,omitempty" gorm:"foreignKey:InventoryBatchID"`
}

// TableName specifies the table name for InventoryBatch
func (InventoryBatch) TableName() string {
	return "inventory_batches"
}
