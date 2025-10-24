package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/hardware-store/pos-backend/internal/services"
)

// ReceiptHandler handles receipt endpoints
type ReceiptHandler struct {
	receiptService *services.ReceiptService
}

// NewReceiptHandler creates a new receipt handler
func NewReceiptHandler(receiptService *services.ReceiptService) *ReceiptHandler {
	return &ReceiptHandler{
		receiptService: receiptService,
	}
}

// GetSaleReceipt retrieves receipt data for a sale
// GET /api/v1/sales/:saleId/receipt
func (h *ReceiptHandler) GetSaleReceipt(c *gin.Context) {
	saleID, err := strconv.ParseUint(c.Param("saleId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sale id"})
		return
	}

	receipt, err := h.receiptService.GetSaleReceipt(uint(saleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch receipt"})
		return
	}

	c.JSON(http.StatusOK, receipt)
}

// GetTextReceipt generates a text receipt for a sale
// GET /api/v1/sales/:saleId/receipt/text
func (h *ReceiptHandler) GetTextReceipt(c *gin.Context) {
	saleID, err := strconv.ParseUint(c.Param("saleId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sale id"})
		return
	}

	receipt, err := h.receiptService.GetSaleReceipt(uint(saleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch receipt"})
		return
	}

	textReceipt, err := h.receiptService.GenerateTextReceipt(receipt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate receipt"})
		return
	}

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.String(http.StatusOK, textReceipt)
}

// GetHTMLReceipt generates an HTML receipt for a sale
// GET /api/v1/sales/:saleId/receipt/html
func (h *ReceiptHandler) GetHTMLReceipt(c *gin.Context) {
	saleID, err := strconv.ParseUint(c.Param("saleId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sale id"})
		return
	}

	receipt, err := h.receiptService.GetSaleReceipt(uint(saleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch receipt"})
		return
	}

	htmlReceipt, err := h.receiptService.GenerateHTMLReceipt(receipt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate receipt"})
		return
	}

	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(http.StatusOK, htmlReceipt)
}

// DownloadReceipt downloads a receipt as a text file
// GET /api/v1/sales/:saleId/receipt/download
func (h *ReceiptHandler) DownloadReceipt(c *gin.Context) {
	saleID, err := strconv.ParseUint(c.Param("saleId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sale id"})
		return
	}

	receipt, err := h.receiptService.GetSaleReceipt(uint(saleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch receipt"})
		return
	}

	textReceipt, err := h.receiptService.GenerateTextReceipt(receipt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate receipt"})
		return
	}

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename=\"receipt-"+receipt.TransactionID+".txt\"")
	c.String(http.StatusOK, textReceipt)
}
