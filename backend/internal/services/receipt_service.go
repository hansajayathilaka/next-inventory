package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/hardware-store/pos-backend/internal/repositories"
)

// ReceiptService handles receipt generation for sales and returns
type ReceiptService struct {
	saleRepo *repositories.SaleRepository
}

// NewReceiptService creates a new receipt service
func NewReceiptService(saleRepo *repositories.SaleRepository) *ReceiptService {
	return &ReceiptService{
		saleRepo: saleRepo,
	}
}

// ReceiptData represents the data needed to generate a receipt
type ReceiptData struct {
	TransactionID   string
	SaleDate        time.Time
	CustomerName    string
	StaffName       string
	Items           []ReceiptItem
	Subtotal        float64
	BillDiscount    float64
	TaxAmount       float64
	Total           float64
	PaymentMethod   string
	AmountPaid      *float64
	ChangeGiven     *float64
	StoreName       string
	StoreAddress    string
	StorePhone      string
	ReceiptNumber   string
}

// ReceiptItem represents a line item in a receipt
type ReceiptItem struct {
	Description  string
	Quantity     int
	UnitPrice    float64
	Discount     float64
	LineTotal    float64
}

// GetSaleReceipt retrieves receipt data for a sale
func (s *ReceiptService) GetSaleReceipt(saleID uint) (*ReceiptData, error) {
	sale, err := s.saleRepo.GetSaleByID(saleID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch sale: %w", err)
	}
	if sale == nil {
		return nil, fmt.Errorf("sale not found")
	}

	receiptData := &ReceiptData{
		TransactionID:  sale.TransactionID,
		SaleDate:       sale.SaleDate,
		Subtotal:       sale.Subtotal,
		BillDiscount:   sale.BillDiscount,
		TaxAmount:      sale.TaxAmount,
		Total:          sale.Total,
		PaymentMethod:  sale.PaymentMethod,
		AmountPaid:     sale.AmountPaid,
		ChangeGiven:    sale.ChangeGiven,
		StoreName:      "Hardware Store",
		StoreAddress:   "123 Main Street",
		StorePhone:     "(555) 123-4567",
		ReceiptNumber:  fmt.Sprintf("REC-%s", sale.TransactionID),
	}

	// Add customer name if available
	if sale.Customer != nil {
		receiptData.CustomerName = sale.Customer.Name
	}

	// Add staff name if available
	if sale.Staff != nil {
		receiptData.StaffName = fmt.Sprintf("%s %s", sale.Staff.FirstName, sale.Staff.LastName)
	}

	// Convert sale items to receipt items
	receiptData.Items = make([]ReceiptItem, 0)
	for _, item := range sale.Items {
		receiptItem := ReceiptItem{
			Description: item.ProductDescription,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Discount:    item.DiscountValue,
			LineTotal:   item.LineTotal,
		}
		receiptData.Items = append(receiptData.Items, receiptItem)
	}

	return receiptData, nil
}

// GenerateTextReceipt generates a plain text receipt
func (s *ReceiptService) GenerateTextReceipt(receipt *ReceiptData) (string, error) {
	var buf bytes.Buffer

	// Header
	buf.WriteString("╔════════════════════════════════════════╗\n")
	buf.WriteString(fmt.Sprintf("║ %-40s ║\n", receipt.StoreName))
	buf.WriteString("╠════════════════════════════════════════╣\n")
	buf.WriteString(fmt.Sprintf("║ %-40s ║\n", receipt.StoreAddress))
	buf.WriteString(fmt.Sprintf("║ %-40s ║\n", receipt.StorePhone))
	buf.WriteString("╠════════════════════════════════════════╣\n")

	// Transaction info
	buf.WriteString(fmt.Sprintf("║ Receipt: %-30s ║\n", receipt.ReceiptNumber))
	buf.WriteString(fmt.Sprintf("║ Transaction ID: %-23s ║\n", receipt.TransactionID))
	buf.WriteString(fmt.Sprintf("║ Date: %-34s ║\n", receipt.SaleDate.Format("2006-01-02 15:04:05")))

	if receipt.CustomerName != "" {
		buf.WriteString(fmt.Sprintf("║ Customer: %-32s ║\n", receipt.CustomerName))
	}
	if receipt.StaffName != "" {
		buf.WriteString(fmt.Sprintf("║ Cashier: %-33s ║\n", receipt.StaffName))
	}

	buf.WriteString("╠════════════════════════════════════════╣\n")
	buf.WriteString("║ ITEMS                                  ║\n")
	buf.WriteString("╠════════════════════════════════════════╣\n")

	// Items
	for _, item := range receipt.Items {
		// Product name
		if len(item.Description) > 38 {
			buf.WriteString(fmt.Sprintf("║ %s\n", item.Description[:38]))
		} else {
			buf.WriteString(fmt.Sprintf("║ %s\n", item.Description))
		}

		// Item details
		qtyPrice := fmt.Sprintf("%dx $%.2f", item.Quantity, item.UnitPrice)
		total := fmt.Sprintf("$%.2f", item.LineTotal)
		spaces := 38 - len(qtyPrice) - len(total)
		if spaces < 1 {
			spaces = 1
		}
		buf.WriteString(fmt.Sprintf("║ %s%s%s ║\n", qtyPrice, repeatString(" ", spaces), total))

		// Discount if applicable
		if item.Discount > 0 {
			discountStr := fmt.Sprintf("Discount: -$%.2f", item.Discount)
			spaces := 37 - len(discountStr)
			buf.WriteString(fmt.Sprintf("║ %s%s ║\n", discountStr, repeatString(" ", spaces)))
		}
	}

	buf.WriteString("╠════════════════════════════════════════╣\n")

	// Totals
	buf.WriteString(fmt.Sprintf("║ Subtotal: %32.2f ║\n", receipt.Subtotal))

	if receipt.BillDiscount > 0 {
		buf.WriteString(fmt.Sprintf("║ Discount: %32.2f ║\n", -receipt.BillDiscount))
	}

	if receipt.TaxAmount > 0 {
		buf.WriteString(fmt.Sprintf("║ Tax: %36.2f ║\n", receipt.TaxAmount))
	}

	buf.WriteString("╠════════════════════════════════════════╣\n")
	buf.WriteString(fmt.Sprintf("║ TOTAL: %35.2f ║\n", receipt.Total))
	buf.WriteString("╠════════════════════════════════════════╣\n")

	// Payment info
	paymentMethod := receipt.PaymentMethod
	if paymentMethod == "cash" && receipt.AmountPaid != nil {
		buf.WriteString(fmt.Sprintf("║ Payment: CASH                          ║\n"))
		buf.WriteString(fmt.Sprintf("║ Amount Paid: %26.2f ║\n", *receipt.AmountPaid))
		if receipt.ChangeGiven != nil {
			buf.WriteString(fmt.Sprintf("║ Change: %32.2f ║\n", *receipt.ChangeGiven))
		}
	} else if paymentMethod == "card" {
		buf.WriteString(fmt.Sprintf("║ Payment: CARD                         ║\n"))
	} else if paymentMethod == "credit" {
		buf.WriteString(fmt.Sprintf("║ Payment: CREDIT ACCOUNT                ║\n"))
	}

	buf.WriteString("╠════════════════════════════════════════╣\n")
	buf.WriteString("║ Thank you for your purchase!           ║\n")
	buf.WriteString("║ Please come again!                     ║\n")
	buf.WriteString("╚════════════════════════════════════════╝\n")

	return buf.String(), nil
}

// GenerateHTMLReceipt generates an HTML receipt
func (s *ReceiptService) GenerateHTMLReceipt(receipt *ReceiptData) (string, error) {
	html := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt %s</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
    .receipt { border: 1px solid #ccc; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 5px 0; font-size: 12px; }
    .transaction-info { font-size: 12px; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
    .items { margin-bottom: 20px; }
    .item { margin-bottom: 10px; font-size: 12px; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
    .item-name { font-weight: bold; }
    .item-details { display: flex; justify-content: space-between; }
    .totals { margin-bottom: 20px; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 10px 0; }
    .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
    .total-amount { font-size: 16px; font-weight: bold; }
    .payment-info { font-size: 12px; margin-bottom: 20px; }
    .footer { text-align: center; font-size: 12px; color: #666; }
    @media print { body { margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>%s</h1>
      <p>%s</p>
      <p>%s</p>
    </div>

    <div class="transaction-info">
      <p><strong>Receipt:</strong> %s</p>
      <p><strong>Transaction ID:</strong> %s</p>
      <p><strong>Date:</strong> %s</p>
`, receipt.ReceiptNumber, receipt.StoreName, receipt.StoreAddress, receipt.StorePhone,
		receipt.ReceiptNumber, receipt.TransactionID, receipt.SaleDate.Format("2006-01-02 15:04:05"))

	if receipt.CustomerName != "" {
		html += fmt.Sprintf(`      <p><strong>Customer:</strong> %s</p>
`, receipt.CustomerName)
	}

	if receipt.StaffName != "" {
		html += fmt.Sprintf(`      <p><strong>Cashier:</strong> %s</p>
`, receipt.StaffName)
	}

	html += `    </div>

    <div class="items">
`

	for _, item := range receipt.Items {
		html += fmt.Sprintf(`      <div class="item">
        <div class="item-name">%s</div>
        <div class="item-details">
          <span>%d x $%.2f</span>
          <span>$%.2f</span>
        </div>
`, item.Description, item.Quantity, item.UnitPrice, item.LineTotal)
		if item.Discount > 0 {
			html += fmt.Sprintf(`        <div style="color: #d32f2f;">Discount: -$%.2f</div>
`, item.Discount)
		}
		html += `      </div>
`
	}

	html += `    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>$%.2f</span>
      </div>
`

	if receipt.BillDiscount > 0 {
		html += fmt.Sprintf(`      <div class="total-row">
        <span>Discount:</span>
        <span>-$%.2f</span>
      </div>
`, receipt.BillDiscount)
	}

	if receipt.TaxAmount > 0 {
		html += fmt.Sprintf(`      <div class="total-row">
        <span>Tax:</span>
        <span>$%.2f</span>
      </div>
`, receipt.TaxAmount)
	}

	html += fmt.Sprintf(`      <div class="total-row total-amount">
        <span>TOTAL:</span>
        <span>$%.2f</span>
      </div>
    </div>

    <div class="payment-info">
      <p><strong>Payment Method:</strong> %s</p>
`, receipt.Total, receipt.PaymentMethod)

	if receipt.PaymentMethod == "cash" && receipt.AmountPaid != nil {
		html += fmt.Sprintf(`      <p><strong>Amount Paid:</strong> $%.2f</p>
`, *receipt.AmountPaid)
		if receipt.ChangeGiven != nil {
			html += fmt.Sprintf(`      <p><strong>Change:</strong> $%.2f</p>
`, *receipt.ChangeGiven)
		}
	}

	html += `    </div>

    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p>Please come again!</p>
    </div>
  </div>
</body>
</html>
`

	return fmt.Sprintf(html, receipt.Subtotal), nil
}

// Helper function to repeat a string
func repeatString(s string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += s
	}
	return result
}
