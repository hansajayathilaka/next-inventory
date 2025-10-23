package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/services"
)

// POSHandler handles POS endpoints
type POSHandler struct {
	posService *services.POSService
}

// NewPOSHandler creates a new POS handler
func NewPOSHandler(posService *services.POSService) *POSHandler {
	return &POSHandler{
		posService: posService,
	}
}

// CreateSession creates a new sales session
// POST /api/v1/pos/sessions
func (h *POSHandler) CreateSession(c *gin.Context) {
	var req struct {
		StaffID    uint  `json:"staff_id" binding:"required"`
		CustomerID *uint `json:"customer_id"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	session, err := h.posService.CreateSession(req.StaffID, req.CustomerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, session)
}

// GetSession retrieves a session
// GET /api/v1/pos/sessions/:sessionId
func (h *POSHandler) GetSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	session, err := h.posService.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch session"})
		return
	}
	if session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

// ListActiveSessions lists active sessions for current staff
// GET /api/v1/pos/sessions
func (h *POSHandler) ListActiveSessions(c *gin.Context) {
	// Get staff ID from auth context
	staffIDRaw, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "staff not authenticated"})
		return
	}

	staffID := staffIDRaw.(uint)

	sessions, err := h.posService.ListActiveSessions(staffID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// AddItemToSession adds an item to a session
// POST /api/v1/pos/sessions/:sessionId/items
func (h *POSHandler) AddItemToSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var req struct {
		InventoryBatchID uint    `json:"inventory_batch_id" binding:"required"`
		Quantity         int     `json:"quantity" binding:"required"`
		UnitPrice        float64 `json:"unit_price" binding:"required"`
		DiscountType     *string `json:"discount_type"`
		DiscountValue    float64 `json:"discount_value"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	item, err := h.posService.AddItemToSession(
		sessionID,
		req.InventoryBatchID,
		req.Quantity,
		req.UnitPrice,
		req.DiscountType,
		req.DiscountValue,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// UpdateSessionItem updates an item in a session
// PUT /api/v1/pos/sessions/:sessionId/items/:itemId
func (h *POSHandler) UpdateSessionItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("itemId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item id"})
		return
	}

	var req struct {
		Quantity      int     `json:"quantity" binding:"required"`
		UnitPrice     float64 `json:"unit_price" binding:"required"`
		DiscountType  *string `json:"discount_type"`
		DiscountValue float64 `json:"discount_value"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.posService.UpdateSessionItem(
		uint(itemID),
		req.Quantity,
		req.UnitPrice,
		req.DiscountType,
		req.DiscountValue,
	); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item updated"})
}

// RemoveSessionItem removes an item from a session
// DELETE /api/v1/pos/sessions/:sessionId/items/:itemId
func (h *POSHandler) RemoveSessionItem(c *gin.Context) {
	itemID, err := strconv.ParseUint(c.Param("itemId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item id"})
		return
	}

	if err := h.posService.RemoveItemFromSession(uint(itemID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "item removed"})
}

// ApplyBillDiscount applies a discount to the entire bill
// POST /api/v1/pos/sessions/:sessionId/discount
func (h *POSHandler) ApplyBillDiscount(c *gin.Context) {
	sessionID := c.Param("sessionId")

	var req struct {
		DiscountType  string  `json:"discount_type" binding:"required"`
		DiscountValue float64 `json:"discount_value" binding:"required"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.posService.ApplyBillDiscount(sessionID, req.DiscountType, req.DiscountValue); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "discount applied"})
}

// GetSessionTotal gets the total for a session
// GET /api/v1/pos/sessions/:sessionId/total
func (h *POSHandler) GetSessionTotal(c *gin.Context) {
	sessionID := c.Param("sessionId")

	total, err := h.posService.CalculateSessionTotal(sessionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"total": total})
}

// GetSessionItems gets all items in a session
// GET /api/v1/pos/sessions/:sessionId/items
func (h *POSHandler) GetSessionItems(c *gin.Context) {
	sessionID := c.Param("sessionId")

	items, err := h.posService.GetSessionItems(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// CompleteSession marks a session as completed
// POST /api/v1/pos/sessions/:sessionId/complete
func (h *POSHandler) CompleteSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	if err := h.posService.CompleteSession(sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to complete session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session completed"})
}

// AbandonSession marks a session as abandoned
// POST /api/v1/pos/sessions/:sessionId/abandon
func (h *POSHandler) AbandonSession(c *gin.Context) {
	sessionID := c.Param("sessionId")

	if err := h.posService.AbandonSession(sessionID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to abandon session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "session abandoned"})
}
