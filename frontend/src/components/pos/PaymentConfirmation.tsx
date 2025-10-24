import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Printer, Home } from 'lucide-react';

interface Sale {
  id: number;
  transaction_id: string;
  total: number;
  payment_method: string;
  change_given?: number;
  sale_date: string;
}

interface PaymentConfirmationProps {
  sale: Sale;
  onPrint?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function PaymentConfirmation({
  sale,
  onPrint,
  onComplete,
  isLoading = false,
}: PaymentConfirmationProps) {
  const [displaySuccess, setDisplaySuccess] = useState(false);

  useEffect(() => {
    // Trigger success animation after a short delay
    const timer = setTimeout(() => setDisplaySuccess(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const saleDate = new Date(sale.sale_date);
  const formattedDate = saleDate.toLocaleDateString() + ' ' + saleDate.toLocaleTimeString();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform ${
              displaySuccess
                ? 'bg-green-100 scale-100'
                : 'bg-gray-100 scale-75'
            }`}
          >
            <Check
              size={32}
              className={`text-green-600 transition-all ${
                displaySuccess ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>
        <CardTitle className="text-center mt-4 text-2xl text-green-600">
          Payment Successful!
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-mono font-semibold">{sale.transaction_id}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-semibold uppercase">{sale.payment_method}</span>
          </div>

          <div className="flex justify-between text-lg">
            <span className="text-gray-600 font-medium">Total Amount:</span>
            <span className="font-bold text-green-600">${sale.total.toFixed(2)}</span>
          </div>

          {sale.payment_method === 'cash' && sale.change_given !== undefined && (
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600">Change Given:</span>
              <span className="font-semibold text-blue-600">${sale.change_given.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-500 border-t pt-3">
            <span>Date & Time:</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <strong>✓</strong> Sale has been recorded successfully
            </p>
            {sale.payment_method === 'credit' && (
              <p className="text-sm text-blue-800 mt-2">
                <strong>✓</strong> Credit amount added to customer account
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          {onPrint && (
            <Button
              onClick={onPrint}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Printer size={18} className="mr-2" />
              Print Receipt
            </Button>
          )}

          {onComplete && (
            <Button
              onClick={onComplete}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Home size={18} className="mr-2" />
              New Transaction
            </Button>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>Transaction ID: <span className="font-mono">{sale.transaction_id}</span></p>
          <p className="mt-1">Keep this reference for your records</p>
        </div>
      </CardContent>
    </Card>
  );
}
