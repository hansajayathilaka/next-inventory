package models

// Role represents a job function with associated permissions
type Role struct {
	BaseModel
	Name        string        `json:"name" gorm:"uniqueIndex;size:50"`
	Description string        `json:"description" gorm:"type:text"`
	IsActive    bool          `json:"is_active" gorm:"default:true;index"`
	Permissions []Permission  `json:"permissions" gorm:"many2many:role_permissions;"`
	Staff       []Staff       `json:"staff,omitempty" gorm:"foreignKey:RoleID"`
}

// TableName specifies the table name for Role
func (Role) TableName() string {
	return "roles"
}
