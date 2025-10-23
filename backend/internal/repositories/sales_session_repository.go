package repositories

import (
	"errors"
	"time"

	"github.com/hardware-store/pos-backend/internal/models"
	"gorm.io/gorm"
)

// SalesSessionRepository handles database operations for sales sessions
type SalesSessionRepository struct {
	db *gorm.DB
}

// NewSalesSessionRepository creates a new sales session repository
func NewSalesSessionRepository(db *gorm.DB) *SalesSessionRepository {
	return &SalesSessionRepository{db: db}
}

// CreateSession creates a new sales session
func (r *SalesSessionRepository) CreateSession(session *models.SalesSession) error {
	return r.db.Create(session).Error
}

// GetSessionByID retrieves a session by database ID
func (r *SalesSessionRepository) GetSessionByID(id uint) (*models.SalesSession, error) {
	var session models.SalesSession
	err := r.db.Preload("Staff").Preload("Customer").Preload("Items").First(&session, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

// GetSessionBySessionID retrieves a session by session UUID
func (r *SalesSessionRepository) GetSessionBySessionID(sessionID string) (*models.SalesSession, error) {
	var session models.SalesSession
	err := r.db.Preload("Staff").Preload("Customer").Preload("Items").Where("session_id = ?", sessionID).First(&session).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

// ListActiveSessions retrieves all active sessions for a staff member
func (r *SalesSessionRepository) ListActiveSessions(staffID uint) ([]models.SalesSession, error) {
	var sessions []models.SalesSession
	err := r.db.
		Where("staff_id = ? AND status = ?", staffID, "active").
		Preload("Staff").
		Preload("Customer").
		Preload("Items").
		Order("last_activity DESC").
		Find(&sessions).Error
	return sessions, err
}

// ListAllSessions retrieves all sessions with optional filtering
func (r *SalesSessionRepository) ListAllSessions(status *string, staffID *uint, limit int, offset int) ([]models.SalesSession, error) {
	var sessions []models.SalesSession
	query := r.db.Preload("Staff").Preload("Customer").Preload("Items")

	if status != nil {
		query = query.Where("status = ?", *status)
	}
	if staffID != nil {
		query = query.Where("staff_id = ?", *staffID)
	}

	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&sessions).Error
	return sessions, err
}

// UpdateSession updates an existing session
func (r *SalesSessionRepository) UpdateSession(session *models.SalesSession) error {
	// Only update allowed fields
	return r.db.Model(session).
		Select("bill_discount_type", "bill_discount_value", "status", "customer_id", "last_activity", "updated_at").
		Updates(session).Error
}

// UpdateSessionStatus updates the status of a session
func (r *SalesSessionRepository) UpdateSessionStatus(sessionID string, status string) error {
	return r.db.Model(&models.SalesSession{}).
		Where("session_id = ?", sessionID).
		Update("status", status).Error
}

// DeleteSession deletes a session
func (r *SalesSessionRepository) DeleteSession(sessionID string) error {
	return r.db.Where("session_id = ?", sessionID).Delete(&models.SalesSession{}).Error
}

// GetSessionItems retrieves all items in a session
func (r *SalesSessionRepository) GetSessionItems(sessionID string) ([]models.SalesSessionItem, error) {
	var items []models.SalesSessionItem
	err := r.db.
		Where("session_id = ?", sessionID).
		Preload("InventoryBatch").
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

// AddItemToSession adds an item to a session
func (r *SalesSessionRepository) AddItemToSession(item *models.SalesSessionItem) error {
	return r.db.Create(item).Error
}

// UpdateSessionItem updates a session item
func (r *SalesSessionRepository) UpdateSessionItem(item *models.SalesSessionItem) error {
	return r.db.Model(item).
		Select("quantity", "unit_price", "discount_type", "discount_value", "line_total").
		Updates(item).Error
}

// RemoveSessionItem removes an item from a session
func (r *SalesSessionRepository) RemoveSessionItem(itemID uint) error {
	return r.db.Delete(&models.SalesSessionItem{}, itemID).Error
}

// CleanupAbandonedSessions marks sessions inactive if no activity for specified duration
func (r *SalesSessionRepository) CleanupAbandonedSessions(inactivityDuration time.Duration) error {
	cutoffTime := time.Now().Add(-inactivityDuration)
	return r.db.
		Where("status = ? AND last_activity < ?", "active", cutoffTime).
		Update("status", "abandoned").Error
}

// CountActiveSessions returns the count of active sessions
func (r *SalesSessionRepository) CountActiveSessions() (int64, error) {
	var count int64
	err := r.db.Model(&models.SalesSession{}).Where("status = ?", "active").Count(&count).Error
	return count, err
}
