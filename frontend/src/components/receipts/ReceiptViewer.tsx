import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface ReceiptViewerProps {
  receipt: Receipt;
  isLoading?: boolean;
}

export function ReceiptViewer({ receipt, isLoading = false }: ReceiptViewerProps) {
  const saleDate = useMemo(() => {
    try {
      const date = new Date(receipt.sale_date);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return receipt.sale_date;
    }
  }, [receipt.sale_date]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading receipt...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto font-mono">
      <CardContent className="p-6 bg-white">
        {/* Receipt Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
          <h2 className="text-xl font-bold">{receipt.store_name}</h2>
          <p className="text-sm text-gray-600">{receipt.store_address}</p>
          <p className="text-sm text-gray-600">{receipt.store_phone}</p>
        </div>

        {/* Receipt Info */}
        <div className="text-xs mb-6 pb-4 border-b border-dashed border-gray-300 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt:</span>
            <span className="font-semibold">{receipt.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-mono font-semibold text-xs">{receipt.transaction_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{saleDate}</span>
          </div>

          {receipt.customer_name && (
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-semibold">{receipt.customer_name}</span>
            </div>
          )}

          {receipt.staff_name && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span className="font-semibold">{receipt.staff_name}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-6 pb-4 border-b border-dashed border-gray-300">
          <div className="text-sm font-bold mb-3">ITEMS</div>
          {receipt.items.map((item, idx) => (
            <div key={idx} className="text-xs mb-3">
              <div className="font-semibold">{item.description}</div>
              <div className="flex justify-between text-gray-700">
                <span>
                  {item.quantity}x ${item.unit_price.toFixed(2)}
                </span>
                <span>${item.line_total.toFixed(2)}</span>
              </div>
              {item.discount > 0 && (
                <div className="text-red-600">
                  Discount: -${item.discount.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mb-6 pb-4 border-b border-dashed border-gray-300 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </div>

          {receipt.bill_discount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Discount:</span>
              <span>-${receipt.bill_discount.toFixed(2)}</span>
            </div>
          )}

          {receipt.tax_amount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>Tax:</span>
              <span>${receipt.tax_amount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>${receipt.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-6 pb-4 border-b border-dashed border-gray-300 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <Badge variant="outline" className="font-semibold">
              {receipt.payment_method.toUpperCase()}
            </Badge>
          </div>

          {receipt.payment_method === 'cash' && receipt.amount_paid !== undefined && (
            <>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>${receipt.amount_paid.toFixed(2)}</span>
              </div>
              {receipt.change_given !== undefined && (
                <div className="flex justify-between font-semibold">
                  <span>Change:</span>
                  <span className="text-green-600">${receipt.change_given.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 space-y-1">
          <p>Thank you for your purchase!</p>
          <p>Please come again!</p>
          <p className="mt-3 pt-3 border-t border-gray-300">
            <span className="font-semibold">Receipt #: {receipt.receipt_number}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
