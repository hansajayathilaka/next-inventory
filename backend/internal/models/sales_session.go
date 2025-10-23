package models

import (
	"database/sql/driver"
	"time"
)

// SalesSession represents an active or held POS transaction
type SalesSession struct {
	BaseModel
	SessionID        string        `json:"session_id" gorm:"uniqueIndex;size:36;type:varchar(36)"`
	StaffID          uint          `json:"staff_id" gorm:"not null;index"`
	Staff            *Staff        `json:"staff,omitempty" gorm:"foreignKey:StaffID"`
	CustomerID       *uint         `json:"customer_id" gorm:"index"` // Optional
	Customer         *Customer     `json:"customer,omitempty" gorm:"foreignKey:CustomerID"`
	BillDiscountType *string       `json:"bill_discount_type" gorm:"type:varchar(10)"` // "percent" or "fixed"
	BillDiscountValue float64      `json:"bill_discount_value" gorm:"default:0;type:decimal(10,2)"`
	Status           string        `json:"status" gorm:"type:varchar(20);default:'active';index"` // active, completed, abandoned
	LastActivity     time.Time     `json:"last_activity" gorm:"not null;index"`
	Items            []SalesSessionItem `json:"items,omitempty" gorm:"foreignKey:SessionID;references:SessionID"`
	Sale             *Sale         `json:"sale,omitempty" gorm:"foreignKey:SessionID;references:SessionID"`
}

// TableName specifies the table name for SalesSession
func (SalesSession) TableName() string {
	return "sales_sessions"
}

// BeforeCreate hook
func (s *SalesSession) BeforeCreate(tx any) error {
	if s.LastActivity.IsZero() {
		s.LastActivity = time.Now()
	}
	return nil
}

// BeforeUpdate hook - update LastActivity on every modification
func (s *SalesSession) BeforeUpdate(tx any) error {
	s.LastActivity = time.Now()
	return nil
}

// Scan implements the sql.Scanner interface for reading from database
func (s *SalesSession) Scan(value interface{}) error {
	return nil // Custom scan logic if needed
}

// Value implements the driver.Valuer interface for writing to database
func (s *SalesSession) Value() (driver.Value, error) {
	return s.SessionID, nil
}
