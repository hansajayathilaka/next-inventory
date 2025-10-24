import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingDown, DollarSign } from 'lucide-react';

interface CreditStatus {
  outstanding_balance: number;
  total_credit: number;
  total_settled: number;
  transaction_count: number;
  outstanding_transactions: number;
  paid_transactions: number;
}

interface CreditStatusCardProps {
  status: CreditStatus | null;
  isLoading?: boolean;
}

export function CreditStatusCard({ status, isLoading = false }: CreditStatusCardProps) {
  if (isLoading || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Loading credit information...</div>
        </CardContent>
      </Card>
    );
  }

  const creditUtilization =
    status.total_credit > 0 ? (status.total_settled / status.total_credit) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Credit Summary</CardTitle>
          {status.outstanding_balance > 0 && (
            <Badge variant="destructive" className="ml-auto">
              Outstanding
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Outstanding Balance */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">
                ${status.outstanding_balance.toFixed(2)}
              </p>
            </div>
            {status.outstanding_balance > 0 && (
              <AlertCircle size={32} className="text-red-400" />
            )}
          </div>
        </div>

        {/* Total Credit Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-blue-600" />
              <p className="text-xs text-gray-600">Total Credit</p>
            </div>
            <p className="text-lg font-bold text-blue-600">${status.total_credit.toFixed(2)}</p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-green-600" />
              <p className="text-xs text-gray-600">Settled</p>
            </div>
            <p className="text-lg font-bold text-green-600">${status.total_settled.toFixed(2)}</p>
          </div>
        </div>

        {/* Transactions Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Transactions:</span>
            <span className="font-semibold">{status.transaction_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Outstanding:</span>
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              {status.outstanding_transactions}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Paid:</span>
            <Badge variant="outline" className="text-green-600 border-green-200">
              {status.paid_transactions}
            </Badge>
          </div>
        </div>

        {/* Settlement Progress */}
        {status.total_credit > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Settlement Progress</span>
              <span className="font-semibold">{creditUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${creditUtilization}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
