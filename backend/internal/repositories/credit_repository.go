package repositories

import (
	"errors"
	"time"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// CreditRepository handles database operations for credit transactions and settlements
type CreditRepository struct {
	db *gorm.DB
}

// NewCreditRepository creates a new credit repository
func NewCreditRepository(db *gorm.DB) *CreditRepository {
	return &CreditRepository{db: db}
}

// CreateCreditTransaction creates a new credit transaction
func (r *CreditRepository) CreateCreditTransaction(transaction *models.CreditTransaction) error {
	return r.db.Create(transaction).Error
}

// GetCreditTransactionByID retrieves a credit transaction by ID
func (r *CreditRepository) GetCreditTransactionByID(id uint) (*models.CreditTransaction, error) {
	var transaction models.CreditTransaction
	err := r.db.
		Preload("Customer").
		Preload("Sale").
		Preload("Settlements").
		First(&transaction, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &transaction, nil
}

// GetCreditTransactionBySaleID retrieves a credit transaction by sale ID
func (r *CreditRepository) GetCreditTransactionBySaleID(saleID uint) (*models.CreditTransaction, error) {
	var transaction models.CreditTransaction
	err := r.db.
		Where("sale_id = ?", saleID).
		Preload("Customer").
		Preload("Sale").
		Preload("Settlements").
		First(&transaction).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &transaction, nil
}

// GetCustomerCreditTransactions retrieves all credit transactions for a customer
func (r *CreditRepository) GetCustomerCreditTransactions(customerID uint) ([]models.CreditTransaction, error) {
	var transactions []models.CreditTransaction
	err := r.db.
		Where("customer_id = ?", customerID).
		Preload("Customer").
		Preload("Sale").
		Preload("Settlements").
		Order("created_at DESC").
		Find(&transactions).Error
	return transactions, err
}

// GetOutstandingCreditForCustomer retrieves outstanding credit balance for a customer
func (r *CreditRepository) GetOutstandingCreditForCustomer(customerID uint) (float64, error) {
	var total float64
	err := r.db.
		Model(&models.CreditTransaction{}).
		Where("customer_id = ? AND status != ?", customerID, "paid").
		Select("COALESCE(SUM(remaining_balance), 0)").
		Row().
		Scan(&total)
	return total, err
}

// UpdateCreditTransactionBalance updates the remaining balance and status of a credit transaction
func (r *CreditRepository) UpdateCreditTransactionBalance(id uint, newBalance float64) error {
	status := "outstanding"
	if newBalance <= 0 {
		status = "paid"
	} else if newBalance < 0 {
		// This shouldn't happen, but handle it
		newBalance = 0
		status = "paid"
	}

	return r.db.Model(&models.CreditTransaction{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"remaining_balance": newBalance,
			"status":            status,
		}).Error
}

// CreateCreditSettlement creates a new credit settlement
func (r *CreditRepository) CreateCreditSettlement(settlement *models.CreditSettlement) error {
	return r.db.Create(settlement).Error
}

// GetCreditSettlementByID retrieves a credit settlement by ID
func (r *CreditRepository) GetCreditSettlementByID(id uint) (*models.CreditSettlement, error) {
	var settlement models.CreditSettlement
	err := r.db.
		Preload("CreditTransaction").
		Preload("Customer").
		Preload("Staff").
		First(&settlement, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &settlement, nil
}

// GetCustomerSettlements retrieves all settlements for a customer
func (r *CreditRepository) GetCustomerSettlements(customerID uint, limit int, offset int) ([]models.CreditSettlement, error) {
	var settlements []models.CreditSettlement
	err := r.db.
		Where("customer_id = ?", customerID).
		Preload("CreditTransaction").
		Preload("Customer").
		Preload("Staff").
		Order("payment_date DESC").
		Limit(limit).
		Offset(offset).
		Find(&settlements).Error
	return settlements, err
}

// GetSettlementsForCreditTransaction retrieves all settlements for a specific credit transaction
func (r *CreditRepository) GetSettlementsForCreditTransaction(creditTransactionID uint) ([]models.CreditSettlement, error) {
	var settlements []models.CreditSettlement
	err := r.db.
		Where("credit_transaction_id = ?", creditTransactionID).
		Preload("Staff").
		Order("payment_date ASC").
		Find(&settlements).Error
	return settlements, err
}

// GetSettlementsByDateRange retrieves settlements within a date range
func (r *CreditRepository) GetSettlementsByDateRange(dateFrom time.Time, dateTo time.Time, limit int, offset int) ([]models.CreditSettlement, error) {
	var settlements []models.CreditSettlement
	err := r.db.
		Where("payment_date BETWEEN ? AND ?", dateFrom, dateTo).
		Preload("CreditTransaction").
		Preload("Customer").
		Preload("Staff").
		Order("payment_date DESC").
		Limit(limit).
		Offset(offset).
		Find(&settlements).Error
	return settlements, err
}

// GetSettlementTotalByPaymentMethod returns total settlements by payment method and date range
func (r *CreditRepository) GetSettlementTotalByPaymentMethod(paymentMethod string, dateFrom time.Time, dateTo time.Time) (float64, error) {
	var total float64
	err := r.db.
		Model(&models.CreditSettlement{}).
		Where("payment_method = ? AND payment_date BETWEEN ? AND ?", paymentMethod, dateFrom, dateTo).
		Select("COALESCE(SUM(amount), 0)").
		Row().
		Scan(&total)
	return total, err
}

// GetSettlementCount returns count of settlements within a date range
func (r *CreditRepository) GetSettlementCount(dateFrom time.Time, dateTo time.Time) (int64, error) {
	var count int64
	err := r.db.
		Model(&models.CreditSettlement{}).
		Where("payment_date BETWEEN ? AND ?", dateFrom, dateTo).
		Count(&count).Error
	return count, err
}
