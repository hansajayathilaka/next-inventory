package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/services"
)

// CreditHandler handles credit management endpoints
type CreditHandler struct {
	creditService *services.CreditService
}

// NewCreditHandler creates a new credit handler
func NewCreditHandler(creditService *services.CreditService) *CreditHandler {
	return &CreditHandler{
		creditService: creditService,
	}
}

// GetCustomerCreditStatus retrieves credit status for a customer
// GET /api/v1/customers/:customerId/credits/status
func (h *CreditHandler) GetCustomerCreditStatus(c *gin.Context) {
	customerID, err := strconv.ParseUint(c.Param("customerId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer id"})
		return
	}

	status, err := h.creditService.GetCustomerCreditStatus(uint(customerID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch credit status"})
		return
	}

	c.JSON(http.StatusOK, status)
}

// GetCreditTransaction retrieves a credit transaction
// GET /api/v1/credits/:creditId
func (h *CreditHandler) GetCreditTransaction(c *gin.Context) {
	creditID, err := strconv.ParseUint(c.Param("creditId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credit id"})
		return
	}

	transaction, err := h.creditService.GetCreditTransaction(uint(creditID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch credit transaction"})
		return
	}
	if transaction == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "credit transaction not found"})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// ListCustomerCredits lists all credit transactions for a customer
// GET /api/v1/customers/:customerId/credits
func (h *CreditHandler) ListCustomerCredits(c *gin.Context) {
	customerID, err := strconv.ParseUint(c.Param("customerId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer id"})
		return
	}

	transactions, err := h.creditService.ListCustomerCredits(uint(customerID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list customer credits"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"credits": transactions})
}

// SettleCredit settles a portion of a credit transaction
// POST /api/v1/credits/:creditId/settle
func (h *CreditHandler) SettleCredit(c *gin.Context) {
	creditID, err := strconv.ParseUint(c.Param("creditId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credit id"})
		return
	}

	var req struct {
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method" binding:"required"` // cash or card
		Notes         *string `json:"notes"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Get staff ID from auth context
	staffIDRaw, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "staff not authenticated"})
		return
	}
	staffID := staffIDRaw.(uint)

	settlement, err := h.creditService.SettleCredit(
		uint(creditID),
		req.Amount,
		req.PaymentMethod,
		staffID,
		req.Notes,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, settlement)
}

// GetCreditSettlement retrieves a settlement
// GET /api/v1/settlements/:settlementId
func (h *CreditHandler) GetCreditSettlement(c *gin.Context) {
	settlementID, err := strconv.ParseUint(c.Param("settlementId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid settlement id"})
		return
	}

	settlement, err := h.creditService.GetCreditSettlement(uint(settlementID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch settlement"})
		return
	}
	if settlement == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "settlement not found"})
		return
	}

	c.JSON(http.StatusOK, settlement)
}

// ListCustomerSettlements lists settlements for a customer
// GET /api/v1/customers/:customerId/settlements
func (h *CreditHandler) ListCustomerSettlements(c *gin.Context) {
	customerID, err := strconv.ParseUint(c.Param("customerId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid customer id"})
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	settlements, err := h.creditService.ListCustomerSettlements(uint(customerID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list settlements"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settlements": settlements})
}

// ListCreditTransactionSettlements lists settlements for a specific credit transaction
// GET /api/v1/credits/:creditId/settlements
func (h *CreditHandler) ListCreditTransactionSettlements(c *gin.Context) {
	creditID, err := strconv.ParseUint(c.Param("creditId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credit id"})
		return
	}

	settlements, err := h.creditService.ListSettlementsForTransaction(uint(creditID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list settlements"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settlements": settlements})
}

// GetSettlementStats retrieves settlement statistics
// GET /api/v1/settlements/stats
func (h *CreditHandler) GetSettlementStats(c *gin.Context) {
	dateFromStr := c.Query("date_from")
	dateToStr := c.Query("date_to")

	var dateFrom, dateTo time.Time
	var err error

	if dateFromStr != "" {
		dateFrom, err = time.Parse("2006-01-02", dateFromStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_from format (use YYYY-MM-DD)"})
			return
		}
	} else {
		dateFrom = time.Now().AddDate(0, 0, -30) // Last 30 days
	}

	if dateToStr != "" {
		dateTo, err = time.Parse("2006-01-02", dateToStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date_to format (use YYYY-MM-DD)"})
			return
		}
	} else {
		dateTo = time.Now()
	}

	stats, err := h.creditService.GetSettlementStats(dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get settlement stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
