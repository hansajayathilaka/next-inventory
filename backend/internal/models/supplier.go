package models

// Supplier represents a supplier of products
type Supplier struct {
	BaseModel
	Name      string `json:"name" gorm:"not null;size:100;index"`
	Email     string `json:"email" gorm:"size:100"`
	Phone     string `json:"phone" gorm:"size:20"`
	Address   string `json:"address" gorm:"type:text"`
	IsActive  bool   `json:"is_active" gorm:"default:true;index"`
	Batches   []InventoryBatch `json:"batches,omitempty" gorm:"foreignKey:SupplierID"`
}

// TableName specifies the table name for Supplier
func (Supplier) TableName() string {
	return "suppliers"
}
