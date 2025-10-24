package models

import (
	"time"
)

// CreditSettlement represents a payment made to reduce credit balance
type CreditSettlement struct {
	BaseModel
	CreditTransactionID uint              `json:"credit_transaction_id" gorm:"not null;index"`
	CreditTransaction   *CreditTransaction `json:"credit_transaction,omitempty" gorm:"foreignKey:CreditTransactionID"`
	CustomerID          uint              `json:"customer_id" gorm:"not null;index"`
	Customer            *Customer         `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	Amount              float64           `json:"amount" gorm:"not null;type:decimal(10,2)"`
	PaymentMethod       string            `json:"payment_method" gorm:"not null;type:varchar(20)"` // cash or card
	PaymentDate         time.Time         `json:"payment_date" gorm:"not null;index"`
	StaffID             uint              `json:"staff_id" gorm:"not null;index"`
	Staff               *Staff            `json:"staff,omitempty" gorm:"foreignKey:StaffID"`
	Notes               *string           `json:"notes" gorm:"type:text"`
}

// TableName specifies the table name for CreditSettlement
func (CreditSettlement) TableName() string {
	return "credit_settlements"
}
