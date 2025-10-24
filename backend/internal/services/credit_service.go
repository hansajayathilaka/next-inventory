package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// CreditService handles credit transaction and settlement operations
type CreditService struct {
	creditRepo *repositories.CreditRepository
}

// NewCreditService creates a new credit service
func NewCreditService(creditRepo *repositories.CreditRepository) *CreditService {
	return &CreditService{
		creditRepo: creditRepo,
	}
}

// GetCustomerCreditStatus retrieves credit status for a customer
func (s *CreditService) GetCustomerCreditStatus(customerID uint) (map[string]interface{}, error) {
	status := make(map[string]interface{})

	// Get outstanding credit
	outstanding, err := s.creditRepo.GetOutstandingCreditForCustomer(customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get outstanding credit: %w", err)
	}
	status["outstanding_balance"] = outstanding

	// Get all credit transactions
	transactions, err := s.creditRepo.GetCustomerCreditTransactions(customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get credit transactions: %w", err)
	}

	// Calculate totals
	totalCredit := 0.0
	totalSettled := 0.0
	outstandingTransactions := 0
	paidTransactions := 0

	for _, txn := range transactions {
		totalCredit += txn.Amount
		settledAmount := txn.Amount - txn.RemainingBalance
		totalSettled += settledAmount

		if txn.Status == "paid" {
			paidTransactions++
		} else {
			outstandingTransactions++
		}
	}

	status["total_credit"] = totalCredit
	status["total_settled"] = totalSettled
	status["transaction_count"] = len(transactions)
	status["outstanding_transactions"] = outstandingTransactions
	status["paid_transactions"] = paidTransactions

	return status, nil
}

// GetCreditTransaction retrieves a specific credit transaction
func (s *CreditService) GetCreditTransaction(transactionID uint) (*models.CreditTransaction, error) {
	transaction, err := s.creditRepo.GetCreditTransactionByID(transactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch credit transaction: %w", err)
	}
	return transaction, nil
}

// GetCreditTransactionBySaleID retrieves credit transaction by sale ID
func (s *CreditService) GetCreditTransactionBySaleID(saleID uint) (*models.CreditTransaction, error) {
	transaction, err := s.creditRepo.GetCreditTransactionBySaleID(saleID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch credit transaction: %w", err)
	}
	return transaction, nil
}

// ListCustomerCredits lists all credit transactions for a customer
func (s *CreditService) ListCustomerCredits(customerID uint) ([]models.CreditTransaction, error) {
	transactions, err := s.creditRepo.GetCustomerCreditTransactions(customerID)
	if err != nil {
		return nil, fmt.Errorf("failed to list customer credits: %w", err)
	}
	return transactions, nil
}

// SettleCredit settles a portion of a credit transaction
func (s *CreditService) SettleCredit(
	creditTransactionID uint,
	amount float64,
	paymentMethod string,
	staffID uint,
	notes *string,
) (*models.CreditSettlement, error) {
	// Validate payment method
	if paymentMethod != "cash" && paymentMethod != "card" {
		return nil, errors.New("invalid payment method for settlement")
	}

	if amount <= 0 {
		return nil, errors.New("settlement amount must be greater than 0")
	}

	// Get credit transaction
	transaction, err := s.creditRepo.GetCreditTransactionByID(creditTransactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch credit transaction: %w", err)
	}
	if transaction == nil {
		return nil, errors.New("credit transaction not found")
	}

	// Verify remaining balance
	if transaction.RemainingBalance <= 0 {
		return nil, errors.New("this credit transaction has already been fully paid")
	}

	if amount > transaction.RemainingBalance {
		return nil, fmt.Errorf("settlement amount (%.2f) exceeds remaining balance (%.2f)", amount, transaction.RemainingBalance)
	}

	// Create settlement
	settlement := &models.CreditSettlement{
		CreditTransactionID: creditTransactionID,
		CustomerID:          transaction.CustomerID,
		Amount:              amount,
		PaymentMethod:       paymentMethod,
		PaymentDate:         time.Now(),
		StaffID:             staffID,
		Notes:               notes,
	}

	if err := s.creditRepo.CreateCreditSettlement(settlement); err != nil {
		return nil, fmt.Errorf("failed to create settlement: %w", err)
	}

	// Update credit transaction balance
	newBalance := transaction.RemainingBalance - amount
	if err := s.creditRepo.UpdateCreditTransactionBalance(creditTransactionID, newBalance); err != nil {
		return nil, fmt.Errorf("failed to update credit transaction: %w", err)
	}

	return settlement, nil
}

// GetCreditSettlement retrieves a settlement by ID
func (s *CreditService) GetCreditSettlement(settlementID uint) (*models.CreditSettlement, error) {
	settlement, err := s.creditRepo.GetCreditSettlementByID(settlementID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch settlement: %w", err)
	}
	return settlement, nil
}

// ListCustomerSettlements lists all settlements for a customer
func (s *CreditService) ListCustomerSettlements(customerID uint, limit int, offset int) ([]models.CreditSettlement, error) {
	settlements, err := s.creditRepo.GetCustomerSettlements(customerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list customer settlements: %w", err)
	}
	return settlements, nil
}

// ListSettlementsForTransaction lists all settlements for a credit transaction
func (s *CreditService) ListSettlementsForTransaction(creditTransactionID uint) ([]models.CreditSettlement, error) {
	settlements, err := s.creditRepo.GetSettlementsForCreditTransaction(creditTransactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to list settlements: %w", err)
	}
	return settlements, nil
}

// GetSettlementStats retrieves settlement statistics for a date range
func (s *CreditService) GetSettlementStats(dateFrom time.Time, dateTo time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Cash settlements total
	cashTotal, err := s.creditRepo.GetSettlementTotalByPaymentMethod("cash", dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get cash settlement total: %w", err)
	}
	stats["cash_total"] = cashTotal

	// Card settlements total
	cardTotal, err := s.creditRepo.GetSettlementTotalByPaymentMethod("card", dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get card settlement total: %w", err)
	}
	stats["card_total"] = cardTotal

	// Settlement count
	count, err := s.creditRepo.GetSettlementCount(dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get settlement count: %w", err)
	}
	stats["settlement_count"] = count

	// Total settled
	stats["total_settled"] = cashTotal + cardTotal

	return stats, nil
}
