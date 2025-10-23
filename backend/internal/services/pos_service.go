package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hardware-store/pos-backend/internal/models"
	"github.com/hardware-store/pos-backend/internal/repositories"
)

// POSService handles point-of-sale operations
type POSService struct {
	sessionRepo *repositories.SalesSessionRepository
	saleRepo    *repositories.SaleRepository
	staffRepo   *repositories.StaffRepository
}

// NewPOSService creates a new POS service
func NewPOSService(
	sessionRepo *repositories.SalesSessionRepository,
	saleRepo *repositories.SaleRepository,
	staffRepo *repositories.StaffRepository,
) *POSService {
	return &POSService{
		sessionRepo: sessionRepo,
		saleRepo:    saleRepo,
		staffRepo:   staffRepo,
	}
}

// CreateSession creates a new POS session
func (s *POSService) CreateSession(staffID uint, customerID *uint) (*models.SalesSession, error) {
	// Verify staff exists and is active
	staff, err := s.staffRepo.GetStaffByID(staffID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch staff: %w", err)
	}
	if staff == nil {
		return nil, errors.New("staff not found")
	}
	if !staff.IsActive {
		return nil, errors.New("staff is inactive")
	}

	session := &models.SalesSession{
		SessionID:    uuid.New().String(),
		StaffID:      staffID,
		CustomerID:   customerID,
		Status:       "active",
		LastActivity: time.Now(),
	}

	if err := s.sessionRepo.CreateSession(session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// GetSession retrieves a session by ID
func (s *POSService) GetSession(sessionID string) (*models.SalesSession, error) {
	session, err := s.sessionRepo.GetSessionBySessionID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch session: %w", err)
	}
	return session, nil
}

// ListActiveSessions lists active sessions for a staff member
func (s *POSService) ListActiveSessions(staffID uint) ([]models.SalesSession, error) {
	sessions, err := s.sessionRepo.ListActiveSessions(staffID)
	if err != nil {
		return nil, fmt.Errorf("failed to list sessions: %w", err)
	}
	return sessions, nil
}

// AddItemToSession adds an item to a session
func (s *POSService) AddItemToSession(
	sessionID string,
	batchID uint,
	quantity int,
	unitPrice float64,
	discountType *string,
	discountValue float64,
) (*models.SalesSessionItem, error) {
	// Get session and verify it's active
	session, err := s.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, errors.New("session not found")
	}
	if session.Status != "active" {
		return nil, errors.New("session is not active")
	}

	// Validate quantity
	if quantity <= 0 {
		return nil, errors.New("quantity must be positive")
	}

	// Calculate line total
	lineTotal := float64(quantity) * unitPrice
	if discountType != nil && discountValue > 0 {
		if *discountType == "percent" {
			lineTotal -= lineTotal * (discountValue / 100)
		} else if *discountType == "fixed" {
			lineTotal -= discountValue
		}
	}

	item := &models.SalesSessionItem{
		SessionID:        sessionID,
		InventoryBatchID: batchID,
		Quantity:         quantity,
		UnitPrice:        unitPrice,
		DiscountType:     discountType,
		DiscountValue:    discountValue,
		LineTotal:        lineTotal,
		CreatedAt:        time.Now(),
	}

	if err := s.sessionRepo.AddItemToSession(item); err != nil {
		return nil, fmt.Errorf("failed to add item: %w", err)
	}

	// Update session last activity
	s.sessionRepo.UpdateSessionStatus(sessionID, "active")

	return item, nil
}

// UpdateSessionItem updates an item in a session
func (s *POSService) UpdateSessionItem(
	itemID uint,
	quantity int,
	unitPrice float64,
	discountType *string,
	discountValue float64,
) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}

	// Calculate line total
	lineTotal := float64(quantity) * unitPrice
	if discountType != nil && discountValue > 0 {
		if *discountType == "percent" {
			lineTotal -= lineTotal * (discountValue / 100)
		} else if *discountType == "fixed" {
			lineTotal -= discountValue
		}
	}

	item := &models.SalesSessionItem{
		ID:            itemID,
		Quantity:      quantity,
		UnitPrice:     unitPrice,
		DiscountType:  discountType,
		DiscountValue: discountValue,
		LineTotal:     lineTotal,
	}

	return s.sessionRepo.UpdateSessionItem(item)
}

// RemoveItemFromSession removes an item from a session
func (s *POSService) RemoveItemFromSession(itemID uint) error {
	return s.sessionRepo.RemoveSessionItem(itemID)
}

// CalculateSessionTotal calculates the total for a session including discounts
func (s *POSService) CalculateSessionTotal(sessionID string) (float64, error) {
	session, err := s.GetSession(sessionID)
	if err != nil {
		return 0, err
	}
	if session == nil {
		return 0, errors.New("session not found")
	}

	var subtotal float64
	for _, item := range session.Items {
		subtotal += item.LineTotal
	}

	// Apply bill-level discount
	total := subtotal
	if session.BillDiscountValue > 0 {
		if session.BillDiscountType != nil && *session.BillDiscountType == "percent" {
			total -= total * (session.BillDiscountValue / 100)
		} else if session.BillDiscountType != nil && *session.BillDiscountType == "fixed" {
			total -= session.BillDiscountValue
		}
	}

	return total, nil
}

// ApplyBillDiscount applies a discount to entire bill
func (s *POSService) ApplyBillDiscount(sessionID string, discountType string, discountValue float64) error {
	if discountValue < 0 {
		return errors.New("discount value must be non-negative")
	}
	if discountType != "percent" && discountType != "fixed" {
		return errors.New("invalid discount type")
	}

	session, err := s.GetSession(sessionID)
	if err != nil {
		return err
	}
	if session == nil {
		return errors.New("session not found")
	}

	session.BillDiscountType = &discountType
	session.BillDiscountValue = discountValue

	return s.sessionRepo.UpdateSession(session)
}

// CompleteSession marks a session as completed
func (s *POSService) CompleteSession(sessionID string) error {
	return s.sessionRepo.UpdateSessionStatus(sessionID, "completed")
}

// AbandonSession marks a session as abandoned
func (s *POSService) AbandonSession(sessionID string) error {
	return s.sessionRepo.UpdateSessionStatus(sessionID, "abandoned")
}

// GetSessionItems retrieves all items in a session
func (s *POSService) GetSessionItems(sessionID string) ([]models.SalesSessionItem, error) {
	items, err := s.sessionRepo.GetSessionItems(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch items: %w", err)
	}
	return items, nil
}

// CleanupAbandonedSessions cleans up old sessions
func (s *POSService) CleanupAbandonedSessions() error {
	// Cleanup sessions inactive for more than 24 hours
	return s.sessionRepo.CleanupAbandonedSessions(24 * time.Hour)
}
