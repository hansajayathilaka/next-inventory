package repositories

import (
	"errors"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// CustomerRepository handles database operations for customers
type CustomerRepository struct {
	db *gorm.DB
}

// NewCustomerRepository creates a new customer repository
func NewCustomerRepository(db *gorm.DB) *CustomerRepository {
	return &CustomerRepository{db: db}
}

// Create creates a new customer
func (r *CustomerRepository) Create(customer *models.Customer) error {
	return r.db.Create(customer).Error
}

// GetByID retrieves a customer by ID
func (r *CustomerRepository) GetByID(id uint) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.First(&customer, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &customer, nil
}

// GetAll retrieves all active customers
func (r *CustomerRepository) GetAll() ([]models.Customer, error) {
	var customers []models.Customer
	err := r.db.Where("is_active = ?", true).Order("name ASC").Find(&customers).Error
	return customers, err
}

// Update updates a customer
func (r *CustomerRepository) Update(customer *models.Customer) error {
	return r.db.Model(customer).Updates(customer).Error
}

// Delete deletes a customer (soft delete)
func (r *CustomerRepository) Delete(id uint) error {
	return r.db.Model(&models.Customer{}).Where("id = ?", id).Update("is_active", false).Error
}

// Search searches customers by name or email
func (r *CustomerRepository) Search(query string) ([]models.Customer, error) {
	var customers []models.Customer
	err := r.db.Where("is_active = ? AND (name LIKE ? OR email LIKE ?)", true, "%"+query+"%", "%"+query+"%").
		Order("name ASC").
		Find(&customers).Error
	return customers, err
}
