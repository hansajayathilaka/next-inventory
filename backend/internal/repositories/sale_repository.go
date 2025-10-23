package repositories

import (
	"errors"
	"time"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// SaleRepository handles database operations for sales
type SaleRepository struct {
	db *gorm.DB
}

// NewSaleRepository creates a new sale repository
func NewSaleRepository(db *gorm.DB) *SaleRepository {
	return &SaleRepository{db: db}
}

// CreateSale creates a new sale
func (r *SaleRepository) CreateSale(sale *models.Sale) error {
	return r.db.Create(sale).Error
}

// GetSaleByID retrieves a sale by ID
func (r *SaleRepository) GetSaleByID(id uint) (*models.Sale, error) {
	var sale models.Sale
	err := r.db.
		Preload("Staff").
		Preload("Customer").
		Preload("Items").
		First(&sale, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &sale, nil
}

// GetSaleByTransactionID retrieves a sale by transaction ID
func (r *SaleRepository) GetSaleByTransactionID(transactionID string) (*models.Sale, error) {
	var sale models.Sale
	err := r.db.
		Where("transaction_id = ?", transactionID).
		Preload("Staff").
		Preload("Customer").
		Preload("Items").
		First(&sale).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &sale, nil
}

// GetSaleBySessionID retrieves a sale by session ID
func (r *SaleRepository) GetSaleBySessionID(sessionID string) (*models.Sale, error) {
	var sale models.Sale
	err := r.db.
		Where("session_id = ?", sessionID).
		Preload("Staff").
		Preload("Customer").
		Preload("Items").
		First(&sale).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &sale, nil
}

// ListSales retrieves sales with optional filtering
func (r *SaleRepository) ListSales(paymentMethod *string, staffID *uint, customerID *uint, dateFrom *time.Time, dateTo *time.Time, limit int, offset int) ([]models.Sale, error) {
	var sales []models.Sale
	query := r.db.Preload("Staff").Preload("Customer").Preload("Items")

	if paymentMethod != nil {
		query = query.Where("payment_method = ?", *paymentMethod)
	}
	if staffID != nil {
		query = query.Where("staff_id = ?", *staffID)
	}
	if customerID != nil {
		query = query.Where("customer_id = ?", *customerID)
	}
	if dateFrom != nil {
		query = query.Where("sale_date >= ?", *dateFrom)
	}
	if dateTo != nil {
		query = query.Where("sale_date <= ?", *dateTo)
	}

	err := query.Order("sale_date DESC").Limit(limit).Offset(offset).Find(&sales).Error
	return sales, err
}

// GetSaleItems retrieves items for a sale
func (r *SaleRepository) GetSaleItems(saleID uint) ([]models.SaleItem, error) {
	var items []models.SaleItem
	err := r.db.
		Where("sale_id = ?", saleID).
		Preload("InventoryBatch").
		Preload("Product").
		Order("id ASC").
		Find(&items).Error
	return items, err
}

// CreateSaleItems creates sale items
func (r *SaleRepository) CreateSaleItems(items []models.SaleItem) error {
	return r.db.CreateInBatches(items, 100).Error
}

// GetSaleTotalByPaymentMethod returns total sales by payment method
func (r *SaleRepository) GetSaleTotalByPaymentMethod(paymentMethod string, dateFrom time.Time, dateTo time.Time) (float64, error) {
	var total float64
	err := r.db.
		Model(&models.Sale{}).
		Where("payment_method = ? AND sale_date BETWEEN ? AND ?", paymentMethod, dateFrom, dateTo).
		Select("COALESCE(SUM(total), 0)").
		Row().
		Scan(&total)
	return total, err
}

// GetSalesCountByDate returns count of sales by date range
func (r *SaleRepository) GetSalesCountByDate(dateFrom time.Time, dateTo time.Time) (int64, error) {
	var count int64
	err := r.db.
		Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", dateFrom, dateTo).
		Count(&count).Error
	return count, err
}

// CountSalesByCustomer returns count of sales for a customer
func (r *SaleRepository) CountSalesByCustomer(customerID uint) (int64, error) {
	var count int64
	err := r.db.
		Model(&models.Sale{}).
		Where("customer_id = ?", customerID).
		Count(&count).Error
	return count, err
}
