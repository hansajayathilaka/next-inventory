import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PaymentMethodsProps {
  total: number;
  onPaymentSelect: (method: string, details?: PaymentDetails) => void;
  isLoading?: boolean;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'credit';
  amountPaid?: number;
  customerId?: number;
}

export function PaymentMethods({ total, onPaymentSelect, isLoading = false }: PaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(total);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const handlePayment = () => {
    const details: PaymentDetails = { method: selectedMethod as 'cash' | 'card' | 'credit' };

    if (selectedMethod === 'cash') {
      if (amountPaid < total) {
        alert(`Amount paid must be at least ${total.toFixed(2)}`);
        return;
      }
      details.amountPaid = amountPaid;
    } else if (selectedMethod === 'credit') {
      if (!selectedCustomerId) {
        alert('Please select a customer for credit payment');
        return;
      }
      details.customerId = selectedCustomerId;
    }

    onPaymentSelect(selectedMethod, details);
  };

  const changeGiven = selectedMethod === 'cash' ? amountPaid - total : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="text-sm text-gray-600">Total Amount Due:</div>
          <div className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="mb-4 block font-semibold">Select Payment Method:</Label>
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            <div className="flex items-center space-x-2 mb-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer flex-1">
                <div className="font-medium">Cash</div>
                <div className="text-sm text-gray-500">Pay with cash</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 mb-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="cursor-pointer flex-1">
                <div className="font-medium">Card</div>
                <div className="text-sm text-gray-500">Pay with debit/credit card</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="credit" id="credit" />
              <Label htmlFor="credit" className="cursor-pointer flex-1">
                <div className="font-medium">Credit</div>
                <div className="text-sm text-gray-500">Pay on customer credit account</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Cash Payment Details */}
        {selectedMethod === 'cash' && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="amountPaid" className="block mb-2">
                Amount Paid
              </Label>
              <Input
                id="amountPaid"
                type="number"
                value={amountPaid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountPaid(parseFloat(e.target.value) || 0)}
                step="0.01"
                min={total}
                className="text-lg font-semibold"
              />
              <div className="text-sm text-gray-600 mt-1">Minimum: ${total.toFixed(2)}</div>
            </div>

            {changeGiven > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-sm text-gray-600">Change to Give:</div>
                <div className="text-xl font-bold text-green-600">${changeGiven.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {/* Credit Payment Details */}
        {selectedMethod === 'credit' && (
          <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
            <div>
              <Label htmlFor="customerId" className="block mb-2">
                Select Customer for Credit
              </Label>
              <Input
                id="customerId"
                type="number"
                placeholder="Enter customer ID"
                value={selectedCustomerId || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
              />
              <div className="text-sm text-gray-600 mt-1">Customer ID is required for credit payments</div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-800">
                ⚠️ Credit amount will be added to customer's credit balance
              </div>
            </div>
          </div>
        )}

        {/* Card Payment Note */}
        {selectedMethod === 'card' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              🔒 Card payment will be processed securely. Amount: ${total.toFixed(2)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoading ? 'Processing...' : `Confirm Payment (${selectedMethod.toUpperCase()})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
