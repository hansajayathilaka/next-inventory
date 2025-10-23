package models

import "time"

// Staff represents an employee who uses the system
type Staff struct {
	BaseModel
	Username   string    `json:"username" gorm:"uniqueIndex;size:50"`
	PasswordHash string   `json:"-" gorm:"size:255"`
	FirstName  string    `json:"first_name" gorm:"size:50"`
	LastName   string    `json:"last_name" gorm:"size:50"`
	Email      string    `json:"email" gorm:"uniqueIndex;size:100;default:null"`
	RoleID     uint      `json:"role_id" gorm:"index"`
	IsActive   bool      `json:"is_active" gorm:"default:true;index"`
	LastLogin  *time.Time `json:"last_login"`
	Role       Role      `json:"role,omitempty" gorm:"foreignKey:RoleID"`
}

// TableName specifies the table name for Staff
func (Staff) TableName() string {
	return "staff"
}
