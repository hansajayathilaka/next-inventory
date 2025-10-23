package repositories

import (
	"errors"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// ProductRepository handles database operations for products
type ProductRepository struct {
	db *gorm.DB
}

// NewProductRepository creates a new product repository
func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

// Create creates a new product
func (r *ProductRepository) Create(product *models.Product) error {
	return r.db.Create(product).Error
}

// GetByID retrieves a product by ID
func (r *ProductRepository) GetByID(id uint) (*models.Product, error) {
	var product models.Product
	err := r.db.Preload("Category").First(&product, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// GetByCode retrieves a product by code
func (r *ProductRepository) GetByCode(code string) (*models.Product, error) {
	var product models.Product
	err := r.db.Where("code = ?", code).Preload("Category").First(&product).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// GetAll retrieves all active products
func (r *ProductRepository) GetAll() ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("is_active = ?", true).Preload("Category").Order("code ASC").Find(&products).Error
	return products, err
}

// GetByCategory retrieves all products in a category
func (r *ProductRepository) GetByCategory(categoryID uint) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("category_id = ? AND is_active = ?", categoryID, true).
		Preload("Category").
		Order("code ASC").
		Find(&products).Error
	return products, err
}

// Update updates a product
func (r *ProductRepository) Update(product *models.Product) error {
	return r.db.Model(product).Updates(product).Error
}

// Delete deletes a product (soft delete)
func (r *ProductRepository) Delete(id uint) error {
	return r.db.Model(&models.Product{}).Where("id = ?", id).Update("is_active", false).Error
}

// Search searches products by code or description
func (r *ProductRepository) Search(query string) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("is_active = ? AND (code LIKE ? OR description LIKE ?)", true, "%"+query+"%", "%"+query+"%").
		Preload("Category").
		Order("code ASC").
		Find(&products).Error
	return products, err
}

// GetPaginatedProducts gets products with pagination
func (r *ProductRepository) GetPaginatedProducts(limit int, offset int) ([]models.Product, error) {
	var products []models.Product
	err := r.db.Where("is_active = ?", true).
		Preload("Category").
		Order("code ASC").
		Limit(limit).
		Offset(offset).
		Find(&products).Error
	return products, err
}
