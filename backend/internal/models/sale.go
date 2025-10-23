package models

import (
	"time"
)

// Sale represents a completed sale transaction
type Sale struct {
	BaseModel
	TransactionID string    `json:"transaction_id" gorm:"uniqueIndex;not null;size:50"`
	SessionID     *string   `json:"session_id" gorm:"uniqueIndex;type:varchar(36)"` // Optional, links to SalesSession
	StaffID       uint      `json:"staff_id" gorm:"not null;index"`
	Staff         *Staff    `json:"staff,omitempty" gorm:"foreignKey:StaffID"`
	CustomerID    *uint     `json:"customer_id" gorm:"index"` // Optional
	Customer      *Customer `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	Subtotal      float64   `json:"subtotal" gorm:"not null;type:decimal(10,2)"`
	BillDiscount  float64   `json:"bill_discount" gorm:"default:0;type:decimal(10,2)"`
	TaxAmount     float64   `json:"tax_amount" gorm:"default:0;type:decimal(10,2)"`
	Total         float64   `json:"total" gorm:"not null;type:decimal(10,2)"`
	PaymentMethod string    `json:"payment_method" gorm:"not null;type:varchar(20);index"` // cash, card, credit
	AmountPaid    *float64  `json:"amount_paid" gorm:"type:decimal(10,2)"` // For cash
	ChangeGiven   *float64  `json:"change_given" gorm:"type:decimal(10,2)"` // For cash
	SaleDate      time.Time `json:"sale_date" gorm:"not null;index"`
	Items         []SaleItem `json:"items,omitempty" gorm:"foreignKey:SaleID"`
}

// TableName specifies the table name for Sale
func (Sale) TableName() string {
	return "sales"
}
