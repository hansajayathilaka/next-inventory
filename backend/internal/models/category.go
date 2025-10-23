package models

// Category represents a product category with hierarchical support
type Category struct {
	BaseModel
	Name       string     `json:"name" gorm:"not null;size:100;index"`
	ParentID   *uint      `json:"parent_id" gorm:"index"` // Self-referential for hierarchy
	Parent     *Category  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Level      int        `json:"level" gorm:"default:0"` // Hierarchy level
	Path       string     `json:"path" gorm:"size:255;index"` // Materialized path (e.g., "/1/5/12")
	Children   []Category `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Products   []Product  `json:"products,omitempty" gorm:"foreignKey:CategoryID"`
}

// TableName specifies the table name for Category
func (Category) TableName() string {
	return "categories"
}
