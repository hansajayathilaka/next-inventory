package repositories

import (
	"errors"

	"gorm.io/gorm"
	"github.com/hardware-store/pos-backend/internal/models"
)

// RoleRepository handles data access for Role
type RoleRepository struct {
	db *gorm.DB
}

// NewRoleRepository creates a new RoleRepository
func NewRoleRepository(db *gorm.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

// Create adds a new role
func (r *RoleRepository) Create(role *models.Role) error {
	return r.db.Create(role).Error
}

// GetByID retrieves a role by ID with permissions
func (r *RoleRepository) GetByID(id uint) (*models.Role, error) {
	var role models.Role
	if err := r.db.Preload("Permissions").First(&role, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}
	return &role, nil
}

// GetByName retrieves a role by name
func (r *RoleRepository) GetByName(name string) (*models.Role, error) {
	var role models.Role
	if err := r.db.Preload("Permissions").Where("name = ?", name).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("role not found")
		}
		return nil, err
	}
	return &role, nil
}

// GetAll retrieves all active roles
func (r *RoleRepository) GetAll() ([]models.Role, error) {
	var roles []models.Role
	if err := r.db.Where("is_active = ?", true).Preload("Permissions").Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

// Update modifies an existing role
func (r *RoleRepository) Update(id uint, role *models.Role) error {
	return r.db.Model(&models.Role{}).Where("id = ?", id).Updates(role).Error
}

// Delete soft deletes a role (sets is_active to false)
func (r *RoleRepository) Delete(id uint) error {
	return r.db.Model(&models.Role{}).Where("id = ?", id).Update("is_active", false).Error
}

// AddPermission adds a permission to a role
func (r *RoleRepository) AddPermission(roleID uint, permissionID uint) error {
	return r.db.Model(&models.Role{BaseModel: models.BaseModel{ID: roleID}}).
		Association("Permissions").
		Append(&models.Permission{ID: permissionID})
}

// RemovePermission removes a permission from a role
func (r *RoleRepository) RemovePermission(roleID uint, permissionID uint) error {
	return r.db.Model(&models.Role{BaseModel: models.BaseModel{ID: roleID}}).
		Association("Permissions").
		Delete(&models.Permission{ID: permissionID})
}

// GetPermissions retrieves all permissions for a role
func (r *RoleRepository) GetPermissions(roleID uint) ([]models.Permission, error) {
	var permissions []models.Permission
	if err := r.db.Model(&models.Role{BaseModel: models.BaseModel{ID: roleID}}).
		Association("Permissions").
		Find(&permissions); err != nil {
		return nil, err
	}
	return permissions, nil
}
