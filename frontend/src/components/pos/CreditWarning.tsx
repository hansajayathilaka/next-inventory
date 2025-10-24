import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CreditWarningProps {
  customerName?: string;
  outstandingBalance?: number;
  creditLimit?: number;
  totalAmount: number;
  onManageCredit?: () => void;
}

export function CreditWarning({
  customerName,
  outstandingBalance = 0,
  creditLimit,
  totalAmount,
  onManageCredit,
}: CreditWarningProps) {
  // No warning if no customer or no outstanding balance
  if (!customerName || outstandingBalance === 0) {
    return null;
  }

  const willExceedLimit =
    creditLimit && outstandingBalance + totalAmount > creditLimit;

  if (willExceedLimit && creditLimit) {
    return (
      <Card className="bg-red-50 border-red-200 border-2">
        <div className="p-4 flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900 mb-2">Credit Limit Warning</h3>
            <div className="text-sm text-red-800 space-y-2 mb-3">
              <p>
                <span className="font-semibold">{customerName}</span> will exceed their credit
                limit if this sale is completed:
              </p>
              <div className="bg-white rounded p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Current Outstanding:</span>
                  <span className="font-semibold">${outstandingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>This Sale:</span>
                  <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between text-xs font-bold">
                  <span>Projected Total:</span>
                  <span className="text-red-600">
                    ${(outstandingBalance + totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Credit Limit:</span>
                  <span>${creditLimit.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-red-700 font-semibold">
                Exceeds limit by ${((outstandingBalance + totalAmount) - creditLimit).toFixed(2)}
              </p>
            </div>
            {onManageCredit && (
              <Button
                onClick={onManageCredit}
                variant="outline"
                size="sm"
                className="border-red-300 hover:bg-red-100"
              >
                Manage Credit
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (outstandingBalance > 0 && creditLimit && outstandingBalance > creditLimit * 0.8) {
    return (
      <Card className="bg-yellow-50 border-yellow-200 border">
        <div className="p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-1">Credit Limit Approaching</h3>
            <p className="text-sm text-yellow-800 mb-2">
              <span className="font-semibold">{customerName}</span> is approaching their credit
              limit:
            </p>
            <div className="text-xs space-y-1 mb-3">
              <div className="flex justify-between">
                <span>Outstanding Balance:</span>
                <span className="font-semibold">${outstandingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Credit Limit:</span>
                <span>${creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-semibold text-yellow-700">
                  ${(creditLimit - outstandingBalance).toFixed(2)}
                </span>
              </div>
            </div>
            {onManageCredit && (
              <Button
                onClick={onManageCredit}
                variant="outline"
                size="sm"
                className="border-yellow-300 hover:bg-yellow-100"
              >
                View Credit Details
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (outstandingBalance > 0) {
    return (
      <Card className="bg-blue-50 border-blue-200 border">
        <div className="p-3 flex items-start gap-3">
          <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{customerName}</span> has an outstanding credit
              balance of <span className="font-bold">${outstandingBalance.toFixed(2)}</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
