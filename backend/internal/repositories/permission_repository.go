package repositories

import (
	"errors"

	"gorm.io/gorm"
	"github.com/hardware-store/pos-backend/internal/models"
)

// PermissionRepository handles data access for Permission
type PermissionRepository struct {
	db *gorm.DB
}

// NewPermissionRepository creates a new PermissionRepository
func NewPermissionRepository(db *gorm.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

// Create adds a new permission
func (r *PermissionRepository) Create(permission *models.Permission) error {
	return r.db.Create(permission).Error
}

// GetByID retrieves a permission by ID
func (r *PermissionRepository) GetByID(id uint) (*models.Permission, error) {
	var permission models.Permission
	if err := r.db.First(&permission, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("permission not found")
		}
		return nil, err
	}
	return &permission, nil
}

// GetByName retrieves a permission by name
func (r *PermissionRepository) GetByName(name string) (*models.Permission, error) {
	var permission models.Permission
	if err := r.db.Where("name = ?", name).First(&permission).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("permission not found")
		}
		return nil, err
	}
	return &permission, nil
}

// GetAll retrieves all permissions
func (r *PermissionRepository) GetAll() ([]models.Permission, error) {
	var permissions []models.Permission
	if err := r.db.Find(&permissions).Error; err != nil {
		return nil, err
	}
	return permissions, nil
}

// GetByResourceAndAction retrieves permissions by resource and action
func (r *PermissionRepository) GetByResourceAndAction(resource, action string) (*models.Permission, error) {
	var permission models.Permission
	if err := r.db.Where("resource = ? AND action = ?", resource, action).First(&permission).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("permission not found")
		}
		return nil, err
	}
	return &permission, nil
}

// Update modifies an existing permission
func (r *PermissionRepository) Update(id uint, permission *models.Permission) error {
	return r.db.Model(&models.Permission{}).Where("id = ?", id).Updates(permission).Error
}

// Delete removes a permission
func (r *PermissionRepository) Delete(id uint) error {
	return r.db.Delete(&models.Permission{}, id).Error
}

// BulkCreate creates multiple permissions at once
func (r *PermissionRepository) BulkCreate(permissions []models.Permission) error {
	return r.db.CreateInBatches(permissions, 100).Error
}
