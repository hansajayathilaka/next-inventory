package models

import (
	"time"
)

// SalesSessionItem represents items in an active sales session cart
type SalesSessionItem struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	SessionID         string         `json:"session_id" gorm:"not null;index;type:varchar(36);foreignKey:SessionID;references:SessionID"`
	InventoryBatchID  uint           `json:"inventory_batch_id" gorm:"not null;index"`
	InventoryBatch    *InventoryBatch `json:"inventory_batch,omitempty" gorm:"foreignKey:InventoryBatchID"`
	Quantity          int            `json:"quantity" gorm:"not null"`
	UnitPrice         float64        `json:"unit_price" gorm:"not null;type:decimal(10,2)"`
	DiscountType      *string        `json:"discount_type" gorm:"type:varchar(10)"` // "percent" or "fixed"
	DiscountValue     float64        `json:"discount_value" gorm:"default:0;type:decimal(10,2)"`
	LineTotal         float64        `json:"line_total" gorm:"not null;type:decimal(10,2)"`
	CreatedAt         time.Time      `gorm:"index" json:"created_at"`
}

// TableName specifies the table name for SalesSessionItem
func (SalesSessionItem) TableName() string {
	return "sales_session_items"
}
