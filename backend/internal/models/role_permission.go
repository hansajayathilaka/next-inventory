package models

import "time"

// RolePermission represents the many-to-many relationship between Role and Permission
type RolePermission struct {
	RoleID      uint      `gorm:"primaryKey;column:role_id" json:"role_id"`
	PermissionID uint     `gorm:"primaryKey;column:permission_id" json:"permission_id"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	Role        Role      `json:"-" gorm:"foreignKey:RoleID"`
	Permission  Permission `json:"-" gorm:"foreignKey:PermissionID"`
}

// TableName specifies the table name for RolePermission
func (RolePermission) TableName() string {
	return "role_permissions"
}
