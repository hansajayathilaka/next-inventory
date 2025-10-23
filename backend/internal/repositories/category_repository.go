package repositories

import (
	"errors"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// CategoryRepository handles database operations for categories
type CategoryRepository struct {
	db *gorm.DB
}

// NewCategoryRepository creates a new category repository
func NewCategoryRepository(db *gorm.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

// Create creates a new category
func (r *CategoryRepository) Create(category *models.Category) error {
	return r.db.Create(category).Error
}

// GetByID retrieves a category by ID
func (r *CategoryRepository) GetByID(id uint) (*models.Category, error) {
	var category models.Category
	err := r.db.Preload("Parent").Preload("Children").First(&category, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &category, nil
}

// GetAll retrieves all root categories
func (r *CategoryRepository) GetAll() ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Where("parent_id IS NULL").Preload("Children").Order("name ASC").Find(&categories).Error
	return categories, err
}

// GetByParentID retrieves all categories with a specific parent
func (r *CategoryRepository) GetByParentID(parentID uint) ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Where("parent_id = ?", parentID).Order("name ASC").Find(&categories).Error
	return categories, err
}

// Update updates a category
func (r *CategoryRepository) Update(category *models.Category) error {
	return r.db.Model(category).Updates(category).Error
}

// Delete deletes a category (hard delete only if no children/products)
func (r *CategoryRepository) Delete(id uint) error {
	return r.db.Delete(&models.Category{}, id).Error
}

// GetTree retrieves the full category tree
func (r *CategoryRepository) GetTree() ([]models.Category, error) {
	var categories []models.Category
	err := r.db.Where("parent_id IS NULL").Preload("Children").Order("name ASC").Find(&categories).Error
	return categories, err
}
