package models

// Customer represents a customer in the system
type Customer struct {
	BaseModel
	Name          string  `json:"name" gorm:"not null;size:100;index"`
	Email         string  `json:"email" gorm:"uniqueIndex;size:100"`
	Phone         string  `json:"phone" gorm:"size:20"`
	Address       string  `json:"address" gorm:"type:text"`
	CreditLimit   float64 `json:"credit_limit" gorm:"type:decimal(12,2);default:0"`
	IsActive      bool    `json:"is_active" gorm:"default:true;index"`
	SalesSessions []SalesSession `json:"sales_sessions,omitempty" gorm:"foreignKey:CustomerID"`
	Sales         []Sale  `json:"sales,omitempty" gorm:"foreignKey:CustomerID"`
}

// TableName specifies the table name for Customer
func (Customer) TableName() string {
	return "customers"
}
