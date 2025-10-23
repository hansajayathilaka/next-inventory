package models

import (
	"database/sql/driver"
	"encoding/json"

	"gorm.io/datatypes"
)

// Product represents an item sold in the store
type Product struct {
	BaseModel
	Code              string            `json:"code" gorm:"uniqueIndex;not null;size:50"`
	Description       string            `json:"description" gorm:"not null;size:255"`
	CategoryID        uint              `json:"category_id" gorm:"not null;index"`
	Category          *Category         `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Attributes        datatypes.JSONType `json:"attributes" gorm:"type:json"` // Custom attributes
	IsActive          bool              `json:"is_active" gorm:"default:true;index"`
	InventoryBatches  []InventoryBatch  `json:"inventory_batches,omitempty" gorm:"foreignKey:ProductID"`
	SaleItems         []SaleItem        `json:"sale_items,omitempty" gorm:"foreignKey:ProductID"`
}

// TableName specifies the table name for Product
func (Product) TableName() string {
	return "products"
}

// JSONMap represents attributes as a map
type JSONMap map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}
