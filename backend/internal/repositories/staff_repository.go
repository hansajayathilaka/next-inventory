package repositories

import (
	"errors"

	"gorm.io/gorm"
	"github.com/hardware-store/pos-backend/internal/models"
)

// StaffRepository handles data access for Staff
type StaffRepository struct {
	db *gorm.DB
}

// NewStaffRepository creates a new StaffRepository
func NewStaffRepository(db *gorm.DB) *StaffRepository {
	return &StaffRepository{db: db}
}

// Create adds a new staff member
func (r *StaffRepository) Create(staff *models.Staff) error {
	return r.db.Create(staff).Error
}

// GetByID retrieves a staff member by ID with role
func (r *StaffRepository) GetByID(id uint) (*models.Staff, error) {
	var staff models.Staff
	if err := r.db.Preload("Role").First(&staff, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("staff not found")
		}
		return nil, err
	}
	return &staff, nil
}

// GetByUsername retrieves a staff member by username
func (r *StaffRepository) GetByUsername(username string) (*models.Staff, error) {
	var staff models.Staff
	if err := r.db.Preload("Role").Where("username = ?", username).First(&staff).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("staff not found")
		}
		return nil, err
	}
	return &staff, nil
}

// GetAll retrieves all active staff members
func (r *StaffRepository) GetAll() ([]models.Staff, error) {
	var staff []models.Staff
	if err := r.db.Where("is_active = ?", true).Preload("Role").Find(&staff).Error; err != nil {
		return nil, err
	}
	return staff, nil
}

// GetByRole retrieves all staff members with a specific role
func (r *StaffRepository) GetByRole(roleID uint) ([]models.Staff, error) {
	var staff []models.Staff
	if err := r.db.Where("role_id = ? AND is_active = ?", roleID, true).Preload("Role").Find(&staff).Error; err != nil {
		return nil, err
	}
	return staff, nil
}

// Update modifies an existing staff member
func (r *StaffRepository) Update(id uint, staff *models.Staff) error {
	return r.db.Model(&models.Staff{}).Where("id = ?", id).Updates(staff).Error
}

// Deactivate soft deletes a staff member (sets is_active to false)
func (r *StaffRepository) Deactivate(id uint) error {
	return r.db.Model(&models.Staff{}).Where("id = ?", id).Update("is_active", false).Error
}

// UpdateLastLogin updates the last login timestamp
func (r *StaffRepository) UpdateLastLogin(id uint) error {
	return r.db.Model(&models.Staff{}).Where("id = ?", id).Update("last_login", gorm.Expr("CURRENT_TIMESTAMP")).Error
}
