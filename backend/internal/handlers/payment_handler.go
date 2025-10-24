package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/services"
)

// PaymentHandler handles payment processing endpoints
type PaymentHandler struct {
	paymentService *services.PaymentService
}

// NewPaymentHandler creates a new payment handler
func NewPaymentHandler(paymentService *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
	}
}

// ProcessPayment processes a payment for a session
// POST /api/v1/payments/process
func (h *PaymentHandler) ProcessPayment(c *gin.Context) {
	var req struct {
		SessionID     string   `json:"session_id" binding:"required"`
		PaymentMethod string   `json:"payment_method" binding:"required"` // cash, card, credit
		AmountPaid    *float64 `json:"amount_paid"`                       // Required for cash
		CustomerID    *uint    `json:"customer_id"`                       // Required for credit
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

	sale, err := h.paymentService.ProcessPayment(
		req.SessionID,
		req.PaymentMethod,
		req.AmountPaid,
		staffID,
		req.CustomerID,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sale)
}

// GetPayment retrieves a payment by transaction ID
// GET /api/v1/payments/:transactionId
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	transactionID := c.Param("transactionId")

	sale, err := h.paymentService.GetPaymentByTransactionID(transactionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payment"})
		return
	}
	if sale == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	c.JSON(http.StatusOK, sale)
}

// ListCustomerPayments lists payments for a customer
// GET /api/v1/customers/:customerId/payments
func (h *PaymentHandler) ListCustomerPayments(c *gin.Context) {
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

	payments, err := h.paymentService.ListPaymentsByCustomer(uint(customerID), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list payments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"payments": payments})
}

// GetPaymentStats retrieves payment statistics
// GET /api/v1/payments/stats
func (h *PaymentHandler) GetPaymentStats(c *gin.Context) {
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

	stats, err := h.paymentService.GetPaymentStats(dateFrom, dateTo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get payment stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
