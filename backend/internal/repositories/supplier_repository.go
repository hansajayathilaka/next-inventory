package repositories

import (
	"errors"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// SupplierRepository handles database operations for suppliers
type SupplierRepository struct {
	db *gorm.DB
}

// NewSupplierRepository creates a new supplier repository
func NewSupplierRepository(db *gorm.DB) *SupplierRepository {
	return &SupplierRepository{db: db}
}

// Create creates a new supplier
func (r *SupplierRepository) Create(supplier *models.Supplier) error {
	return r.db.Create(supplier).Error
}

// GetByID retrieves a supplier by ID
func (r *SupplierRepository) GetByID(id uint) (*models.Supplier, error) {
	var supplier models.Supplier
	err := r.db.First(&supplier, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &supplier, nil
}

// GetAll retrieves all active suppliers
func (r *SupplierRepository) GetAll() ([]models.Supplier, error) {
	var suppliers []models.Supplier
	err := r.db.Where("is_active = ?", true).Order("name ASC").Find(&suppliers).Error
	return suppliers, err
}

// Update updates a supplier
func (r *SupplierRepository) Update(supplier *models.Supplier) error {
	return r.db.Model(supplier).Updates(supplier).Error
}

// Delete deletes a supplier (soft delete)
func (r *SupplierRepository) Delete(id uint) error {
	return r.db.Model(&models.Supplier{}).Where("id = ?", id).Update("is_active", false).Error
}
