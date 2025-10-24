import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Eye } from 'lucide-react';
import { ReceiptViewer } from './ReceiptViewer';

interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

interface Receipt {
  transaction_id: string;
  sale_date: string;
  customer_name?: string;
  staff_name?: string;
  items: ReceiptItem[];
  subtotal: number;
  bill_discount: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  amount_paid?: number;
  change_given?: number;
  store_name: string;
  store_address: string;
  store_phone: string;
  receipt_number: string;
}

interface PrintReceiptProps {
  receipt: Receipt;
  onPrint?: () => void;
  onDownload?: () => void;
  isLoading?: boolean;
}

export function PrintReceipt({
  receipt,
  onPrint,
  onDownload,
  isLoading = false,
}: PrintReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.transaction_id}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            max-width: 400px;
          }
          .receipt {
            border: 1px solid #000;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 5px 0;
            font-size: 11px;
          }
          .info {
            font-size: 11px;
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .items {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .item {
            font-size: 11px;
            margin-bottom: 8px;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
          }
          .item-discount {
            color: red;
            font-size: 9px;
          }
          .totals {
            font-size: 11px;
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total-amount {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
          }
          .payment {
            font-size: 11px;
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .footer {
            text-align: center;
            font-size: 11px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .receipt { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${receipt.store_name}</h1>
            <p>${receipt.store_address}</p>
            <p>${receipt.store_phone}</p>
          </div>

          <div class="info">
            <div class="info-row">
              <span>Receipt:</span>
              <span>${receipt.receipt_number}</span>
            </div>
            <div class="info-row">
              <span>Transaction ID:</span>
              <span>${receipt.transaction_id}</span>
            </div>
            <div class="info-row">
              <span>Date:</span>
              <span>${new Date(receipt.sale_date).toLocaleString()}</span>
            </div>
            ${receipt.customer_name ? `<div class="info-row"><span>Customer:</span><span>${receipt.customer_name}</span></div>` : ''}
            ${receipt.staff_name ? `<div class="info-row"><span>Cashier:</span><span>${receipt.staff_name}</span></div>` : ''}
          </div>

          <div class="items">
            <strong>ITEMS</strong>
            ${receipt.items.map((item) => `
              <div class="item">
                <div class="item-name">${item.description}</div>
                <div class="item-details">
                  <span>${item.quantity}x $${item.unit_price.toFixed(2)}</span>
                  <span>$${item.line_total.toFixed(2)}</span>
                </div>
                ${item.discount > 0 ? `<div class="item-discount">Discount: -$${item.discount.toFixed(2)}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${receipt.subtotal.toFixed(2)}</span>
            </div>
            ${receipt.bill_discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-$${receipt.bill_discount.toFixed(2)}</span></div>` : ''}
            ${receipt.tax_amount > 0 ? `<div class="total-row"><span>Tax:</span><span>$${receipt.tax_amount.toFixed(2)}</span></div>` : ''}
            <div class="total-row total-amount">
              <span>TOTAL:</span>
              <span>$${receipt.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="payment">
            <div class="payment-row">
              <span>Payment:</span>
              <span>${receipt.payment_method.toUpperCase()}</span>
            </div>
            ${receipt.payment_method === 'cash' && receipt.amount_paid ? `
              <div class="payment-row">
                <span>Amount Paid:</span>
                <span>$${receipt.amount_paid.toFixed(2)}</span>
              </div>
              ${receipt.change_given ? `<div class="payment-row"><span>Change:</span><span>$${receipt.change_given.toFixed(2)}</span></div>` : ''}
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Please come again!</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      if (onPrint) onPrint();
    }, 250);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [
        `${receipt.store_name}\n`,
        `${receipt.store_address}\n`,
        `${receipt.store_phone}\n\n`,
        `Receipt: ${receipt.receipt_number}\n`,
        `Transaction ID: ${receipt.transaction_id}\n`,
        `Date: ${new Date(receipt.sale_date).toLocaleString()}\n\n`,
        `ITEMS:\n`,
        ...receipt.items.map(
          (item) =>
            `${item.description}\n` +
            `${item.quantity}x $${item.unit_price.toFixed(2)} = $${item.line_total.toFixed(2)}\n`
        ),
        `\nSubtotal: $${receipt.subtotal.toFixed(2)}\n`,
        receipt.bill_discount > 0 ? `Discount: -$${receipt.bill_discount.toFixed(2)}\n` : '',
        receipt.tax_amount > 0 ? `Tax: $${receipt.tax_amount.toFixed(2)}\n` : '',
        `\nTOTAL: $${receipt.total.toFixed(2)}\n`,
        `Payment: ${receipt.payment_method.toUpperCase()}\n`,
        receipt.payment_method === 'cash' && receipt.amount_paid
          ? `Amount Paid: $${receipt.amount_paid.toFixed(2)}\n`
          : '',
        receipt.change_given ? `Change: $${receipt.change_given.toFixed(2)}\n` : '',
        `\nThank you for your purchase!\n`,
        `Please come again!\n`,
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${receipt.transaction_id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    if (onDownload) onDownload();
  };

  return (
    <div className="space-y-4" ref={printRef}>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowPreview(!showPreview)}
          variant="outline"
          disabled={isLoading}
          size="sm"
        >
          <Eye size={16} className="mr-2" />
          {showPreview ? 'Hide' : 'Preview'}
        </Button>

        <Button onClick={handlePrint} disabled={isLoading} size="sm">
          <Printer size={16} className="mr-2" />
          Print
        </Button>

        <Button onClick={handleDownload} variant="outline" disabled={isLoading} size="sm">
          <Download size={16} className="mr-2" />
          Download
        </Button>
      </div>

      {/* Preview */}
      {showPreview && <ReceiptViewer receipt={receipt} isLoading={isLoading} />}
    </div>
  );
}
