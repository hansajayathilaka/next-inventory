package models

// SaleItem represents individual items in a completed sale
type SaleItem struct {
	ID               uint            `gorm:"primaryKey" json:"id"`
	SaleID           uint            `json:"sale_id" gorm:"not null;index"`
	InventoryBatchID uint            `json:"inventory_batch_id" gorm:"not null;index"`
	InventoryBatch   *InventoryBatch `json:"inventory_batch,omitempty" gorm:"foreignKey:InventoryBatchID"`
	ProductID        *uint           `json:"product_id" gorm:"index"`
	Product          *Product        `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	ProductCode      string          `json:"product_code" gorm:"not null;size:50"` // Snapshot
	ProductDescription string         `json:"product_description" gorm:"not null;size:255"` // Snapshot
	Quantity         int             `json:"quantity" gorm:"not null"`
	UnitPrice        float64         `json:"unit_price" gorm:"not null;type:decimal(10,2)"`
	DiscountType     *string         `json:"discount_type" gorm:"type:varchar(10)"` // percent or fixed
	DiscountValue    float64         `json:"discount_value" gorm:"default:0;type:decimal(10,2)"`
	LineTotal        float64         `json:"line_total" gorm:"not null;type:decimal(10,2)"`
}

// TableName specifies the table name for SaleItem
func (SaleItem) TableName() string {
	return "sale_items"
}
