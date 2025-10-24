package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// PaymentService handles payment processing for sales
type PaymentService struct {
	saleRepo    *repositories.SaleRepository
	creditRepo  *repositories.CreditRepository
	sessionRepo *repositories.SalesSessionRepository
}

// NewPaymentService creates a new payment service
func NewPaymentService(
	saleRepo *repositories.SaleRepository,
	creditRepo *repositories.CreditRepository,
	sessionRepo *repositories.SalesSessionRepository,
) *PaymentService {
	return &PaymentService{
		saleRepo:    saleRepo,
		creditRepo:  creditRepo,
		sessionRepo: sessionRepo,
	}
}

// ProcessPayment processes a payment for a sales session
func (s *PaymentService) ProcessPayment(
	sessionID string,
	paymentMethod string,
	amountPaid *float64,
	staffID uint,
	customerID *uint,
) (*models.Sale, error) {
	// Validate payment method
	if paymentMethod != "cash" && paymentMethod != "card" && paymentMethod != "credit" {
		return nil, errors.New("invalid payment method")
	}

	// Get the session
	session, err := s.sessionRepo.GetSessionBySessionID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch session: %w", err)
	}
	if session == nil {
		return nil, errors.New("session not found")
	}
	if session.Status != "active" {
		return nil, errors.New("session is not active")
	}

	// Verify session has items
	if len(session.Items) == 0 {
		return nil, errors.New("session has no items")
	}

	// Calculate totals
	subtotal := 0.0
	for _, item := range session.Items {
		subtotal += item.LineTotal
	}

	// Apply bill-level discount
	billDiscount := 0.0
	if session.BillDiscountValue > 0 && session.BillDiscountType != nil {
		if *session.BillDiscountType == "percent" {
			billDiscount = subtotal * (session.BillDiscountValue / 100)
		} else if *session.BillDiscountType == "fixed" {
			billDiscount = session.BillDiscountValue
		}
	}

	// Calculate final total
	total := subtotal - billDiscount

	// Validate cash payment
	if paymentMethod == "cash" {
		if amountPaid == nil {
			return nil, errors.New("amount_paid is required for cash payments")
		}
		if *amountPaid < total {
			return nil, errors.New("insufficient payment for cash transaction")
		}
	}

	// For credit payment, verify customer
	if paymentMethod == "credit" {
		if customerID == nil {
			return nil, errors.New("customer_id is required for credit payments")
		}
	}

	// Generate transaction ID
	transactionID := fmt.Sprintf("TXN-%d-%d", time.Now().Unix(), sessionID[:8])

	// Create sale
	sale := &models.Sale{
		TransactionID: transactionID,
		SessionID:     &sessionID,
		StaffID:       staffID,
		CustomerID:    customerID,
		Subtotal:      subtotal,
		BillDiscount:  billDiscount,
		Total:         total,
		PaymentMethod: paymentMethod,
		SaleDate:      time.Now(),
	}

	// Handle cash payment
	if paymentMethod == "cash" {
		sale.AmountPaid = amountPaid
		change := *amountPaid - total
		sale.ChangeGiven = &change
	}

	// Create sale in repository
	if err := s.saleRepo.CreateSale(sale); err != nil {
		return nil, fmt.Errorf("failed to create sale: %w", err)
	}

	// Create sale items from session items
	saleItems := make([]models.SaleItem, 0)
	for _, sessionItem := range session.Items {
		saleItem := models.SaleItem{
			SaleID:             sale.ID,
			InventoryBatchID:   sessionItem.InventoryBatchID,
			ProductCode:        "",      // Will be fetched from batch
			ProductDescription: "",      // Will be fetched from batch
			Quantity:           sessionItem.Quantity,
			UnitPrice:          sessionItem.UnitPrice,
			DiscountType:       sessionItem.DiscountType,
			DiscountValue:      sessionItem.DiscountValue,
			LineTotal:          sessionItem.LineTotal,
		}
		saleItems = append(saleItems, saleItem)
	}

	if err := s.saleRepo.CreateSaleItems(saleItems); err != nil {
		return nil, fmt.Errorf("failed to create sale items: %w", err)
	}

	// If credit payment, create credit transaction
	if paymentMethod == "credit" {
		creditTransaction := &models.CreditTransaction{
			CustomerID:       *customerID,
			SaleID:           sale.ID,
			Amount:           total,
			RemainingBalance: total,
			Status:           "outstanding",
		}
		if err := s.creditRepo.CreateCreditTransaction(creditTransaction); err != nil {
			return nil, fmt.Errorf("failed to create credit transaction: %w", err)
		}
	}

	// Update session status to completed
	if err := s.sessionRepo.UpdateSessionStatus(sessionID, "completed"); err != nil {
		return nil, fmt.Errorf("failed to update session status: %w", err)
	}

	return sale, nil
}

// GetPaymentByTransactionID retrieves a payment by transaction ID
func (s *PaymentService) GetPaymentByTransactionID(transactionID string) (*models.Sale, error) {
	sale, err := s.saleRepo.GetSaleByTransactionID(transactionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch sale: %w", err)
	}
	return sale, nil
}

// ListPaymentsByCustomer lists payments for a customer
func (s *PaymentService) ListPaymentsByCustomer(customerID uint, limit int, offset int) ([]models.Sale, error) {
	payments, err := s.saleRepo.ListSales(nil, nil, &customerID, nil, nil, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list payments: %w", err)
	}
	return payments, nil
}

// GetPaymentStats retrieves payment statistics for a date range
func (s *PaymentService) GetPaymentStats(dateFrom time.Time, dateTo time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Cash total
	cashTotal, err := s.saleRepo.GetSaleTotalByPaymentMethod("cash", dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get cash total: %w", err)
	}
	stats["cash_total"] = cashTotal

	// Card total
	cardTotal, err := s.saleRepo.GetSaleTotalByPaymentMethod("card", dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get card total: %w", err)
	}
	stats["card_total"] = cardTotal

	// Credit total
	creditTotal, err := s.saleRepo.GetSaleTotalByPaymentMethod("credit", dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get credit total: %w", err)
	}
	stats["credit_total"] = creditTotal

	// Sales count
	count, err := s.saleRepo.GetSalesCountByDate(dateFrom, dateTo)
	if err != nil {
		return nil, fmt.Errorf("failed to get sales count: %w", err)
	}
	stats["sales_count"] = count

	// Total amount
	stats["total_amount"] = cashTotal + cardTotal + creditTotal

	return stats, nil
}
