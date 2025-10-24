package models

// CreditTransaction represents money owed by a customer from a credit sale
type CreditTransaction struct {
	BaseModel
	CustomerID       uint              `json:"customer_id" gorm:"not null;index"`
	Customer         *Customer         `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	SaleID           uint              `json:"sale_id" gorm:"not null;uniqueIndex"`
	Sale             *Sale             `json:"sale,omitempty" gorm:"foreignKey:SaleID"`
	Amount           float64           `json:"amount" gorm:"not null;type:decimal(10,2)"`
	RemainingBalance float64           `json:"remaining_balance" gorm:"not null;type:decimal(10,2)"`
	Status           string            `json:"status" gorm:"not null;type:varchar(20);index;default:'outstanding'"` // outstanding, partially_paid, paid
	Settlements      []CreditSettlement `json:"settlements,omitempty" gorm:"foreignKey:CreditTransactionID"`
}

// TableName specifies the table name for CreditTransaction
func (CreditTransaction) TableName() string {
	return "credit_transactions"
}
