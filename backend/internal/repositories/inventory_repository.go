package repositories

import (
	"errors"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// InventoryRepository handles database operations for inventory batches
type InventoryRepository struct {
	db *gorm.DB
}

// NewInventoryRepository creates a new inventory repository
func NewInventoryRepository(db *gorm.DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

// Create creates a new inventory batch
func (r *InventoryRepository) Create(batch *models.InventoryBatch) error {
	return r.db.Create(batch).Error
}

// GetByID retrieves an inventory batch by ID
func (r *InventoryRepository) GetByID(id uint) (*models.InventoryBatch, error) {
	var batch models.InventoryBatch
	err := r.db.Preload("Product").Preload("Supplier").First(&batch, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &batch, nil
}

// GetByBatchNumber retrieves a batch by batch number
func (r *InventoryRepository) GetByBatchNumber(batchNumber string) (*models.InventoryBatch, error) {
	var batch models.InventoryBatch
	err := r.db.Where("batch_number = ?", batchNumber).Preload("Product").Preload("Supplier").First(&batch).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &batch, nil
}

// GetByProductID retrieves all active batches for a product (FIFO order)
func (r *InventoryRepository) GetByProductID(productID uint) ([]models.InventoryBatch, error) {
	var batches []models.InventoryBatch
	err := r.db.Where("product_id = ? AND is_active = ? AND quantity_in_stock > ?", productID, true, 0).
		Preload("Product").
		Preload("Supplier").
		Order("created_at ASC").
		Find(&batches).Error
	return batches, err
}

// GetBySupplierID retrieves all batches from a supplier
func (r *InventoryRepository) GetBySupplierID(supplierID uint) ([]models.InventoryBatch, error) {
	var batches []models.InventoryBatch
	err := r.db.Where("supplier_id = ? AND is_active = ?", supplierID, true).
		Preload("Product").
		Preload("Supplier").
		Order("created_at DESC").
		Find(&batches).Error
	return batches, err
}

// Update updates an inventory batch
func (r *InventoryRepository) Update(batch *models.InventoryBatch) error {
	return r.db.Model(batch).Updates(batch).Error
}

// UpdateQuantity updates the quantity in stock for a batch
func (r *InventoryRepository) UpdateQuantity(batchID uint, quantity int) error {
	return r.db.Model(&models.InventoryBatch{}).Where("id = ?", batchID).Update("quantity_in_stock", quantity).Error
}

// Deactivate deactivates a batch
func (r *InventoryRepository) Deactivate(batchID uint) error {
	return r.db.Model(&models.InventoryBatch{}).Where("id = ?", batchID).Update("is_active", false).Error
}

// GetTotalQuantityByProduct gets total available quantity for a product
func (r *InventoryRepository) GetTotalQuantityByProduct(productID uint) (int, error) {
	var total int
	err := r.db.Model(&models.InventoryBatch{}).
		Where("product_id = ? AND is_active = ?", productID, true).
		Select("COALESCE(SUM(quantity_in_stock), 0)").
		Row().
		Scan(&total)
	return total, err
}

// GetAvailableBatches gets all batches with available stock for a product
func (r *InventoryRepository) GetAvailableBatches(productID uint) ([]models.InventoryBatch, error) {
	var batches []models.InventoryBatch
	err := r.db.Where("product_id = ? AND is_active = ? AND quantity_in_stock > ?", productID, true, 0).
		Preload("Product").
		Preload("Supplier").
		Order("created_at ASC").
		Find(&batches).Error
	return batches, err
}

// GetLowStockBatches gets batches with quantity below threshold
func (r *InventoryRepository) GetLowStockBatches(threshold int) ([]models.InventoryBatch, error) {
	var batches []models.InventoryBatch
	err := r.db.Where("is_active = ? AND quantity_in_stock <= ? AND quantity_in_stock > ?", true, threshold, 0).
		Preload("Product").
		Preload("Supplier").
		Order("quantity_in_stock ASC").
		Find(&batches).Error
	return batches, err
}

// GetExpiredBatches gets batches that have expired
func (r *InventoryRepository) GetExpiredBatches() ([]models.InventoryBatch, error) {
	var batches []models.InventoryBatch
	err := r.db.Where("is_active = ? AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE", true).
		Preload("Product").
		Preload("Supplier").
		Find(&batches).Error
	return batches, err
}
