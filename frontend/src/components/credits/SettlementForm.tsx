import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

interface SettlementFormProps {
  remainingBalance: number;
  onSubmit: (amount: number, paymentMethod: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export function SettlementForm({
  remainingBalance,
  onSubmit,
  isLoading = false,
}: SettlementFormProps) {
  const [amount, setAmount] = useState<number>(remainingBalance);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    setError('');

    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (amount > remainingBalance) {
      setError(`Amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    try {
      await onSubmit(amount, paymentMethod, notes || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process settlement');
    }
  };

  const partialSettlement = amount < remainingBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settle Credit</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Balance Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Remaining Balance:</span>
            <span className="font-bold text-lg">${remainingBalance.toFixed(2)}</span>
          </div>
          {partialSettlement && (
            <div className="text-sm text-blue-700 mt-2">
              ℹ️ You can partially settle this credit
            </div>
          )}
        </div>

        {/* Settlement Amount */}
        <div>
          <Label htmlFor="amount" className="block mb-2">
            Settlement Amount
          </Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0.01"
                max={remainingBalance}
                placeholder="Enter amount to settle"
                className="text-lg"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">Max: ${remainingBalance.toFixed(2)}</p>
            </div>
            <Button
              onClick={() => setAmount(remainingBalance)}
              variant="outline"
              disabled={isLoading}
              className="whitespace-nowrap"
            >
              Full Amount
            </Button>
          </div>
        </div>

        {/* Remaining After Settlement */}
        {partialSettlement && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600">After settlement:</p>
            <p className="text-lg font-semibold text-orange-600">
              ${(remainingBalance - amount).toFixed(2)} remaining
            </p>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <Label className="block mb-3 font-semibold">Payment Method:</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
            <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer flex-1">
                <div className="font-medium">Cash</div>
                <div className="text-sm text-gray-500">Received in cash</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="cursor-pointer flex-1">
                <div className="font-medium">Card</div>
                <div className="text-sm text-gray-500">Received via card payment</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="block mb-2">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about this settlement..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || amount <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoading ? 'Processing...' : `Settle $${amount.toFixed(2)}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
