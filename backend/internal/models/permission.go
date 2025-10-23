package models

// Permission represents a single granular operation in the system
type Permission struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Name        string  `json:"name" gorm:"uniqueIndex;size:100"`
	Resource    string  `json:"resource" gorm:"size:50;index:idx_permission_resource_action,priority:1"`
	Action      string  `json:"action" gorm:"size:20;index:idx_permission_resource_action,priority:2"`
	Description string  `json:"description" gorm:"type:text"`
	CreatedAt   int64   `json:"created_at" gorm:"autoCreateTime:milli"`
	Roles       []Role  `json:"roles,omitempty" gorm:"many2many:role_permissions;"`
}

// TableName specifies the table name for Permission
func (Permission) TableName() string {
	return "permissions"
}
