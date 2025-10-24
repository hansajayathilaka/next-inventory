import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditStatusCard } from '@/components/credits/CreditStatusCard';
import { SettlementForm } from '@/components/credits/SettlementForm';
import { creditsService, CreditTransaction, CreditStatus } from '@/services/credits.service';
import { AlertCircle, ChevronLeft } from 'lucide-react';

export function CreditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const customerIdParam = searchParams.get('customer_id');
  const creditIdParam = searchParams.get('credit_id');

  const [customerId, setCustomerId] = useState<number | null>(
    customerIdParam ? parseInt(customerIdParam) : null
  );
  const [creditId, setCreditId] = useState<number | null>(
    creditIdParam ? parseInt(creditIdParam) : null
  );

  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [credits, setCredits] = useState<CreditTransaction[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<CreditTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>(customerIdParam || '');

  // Fetch customer credit status
  useEffect(() => {
    if (!customerId) return;

    const fetchCreditStatus = async () => {
      setIsLoading(true);
      setError('');
      try {
        const status = await creditsService.getCustomerCreditStatus(customerId);
        setCreditStatus(status);

        const creditsList = await creditsService.listCustomerCredits(customerId);
        setCredits(creditsList);

        // If credit_id is specified, select it
        if (creditIdParam) {
          const selected = creditsList.find((c) => c.id === parseInt(creditIdParam));
          setSelectedCredit(selected || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch credit information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditStatus();
  }, [customerId, creditIdParam]);

  const handleSearchCustomer = () => {
    const id = parseInt(searchInput);
    if (isNaN(id) || id <= 0) {
      setError('Please enter a valid customer ID');
      return;
    }
    setCustomerId(id);
    setSearchParams({ customer_id: id.toString() });
  };

  const handleSettleCredit = async (amount: number, paymentMethod: string, notes?: string) => {
    if (!selectedCredit) return;

    setIsLoading(true);
    try {
      await creditsService.settleCredit(selectedCredit.id, {
        amount,
        payment_method: paymentMethod as 'cash' | 'card',
        notes,
      });

      // Refresh credit status and list
      const updatedStatus = await creditsService.getCustomerCreditStatus(
        selectedCredit.customer_id
      );
      setCreditStatus(updatedStatus);

      const updatedCredits = await creditsService.listCustomerCredits(
        selectedCredit.customer_id
      );
      setCredits(updatedCredits);

      // Update selected credit
      const updated = updatedCredits.find((c) => c.id === selectedCredit.id);
      setSelectedCredit(updated || null);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // If no customer selected, show search
  if (!customerId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Credit Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Search for a customer to view and manage their credit.</p>

            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Enter customer ID"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchCustomer()}
              />
              <Button onClick={handleSearchCustomer}>Search</Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show customer's credits
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCustomerId(null);
            setSearchParams({});
          }}
        >
          <ChevronLeft size={18} className="mr-1" />
          Back to Search
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Customer Credits</h1>
          <p className="text-gray-600">Customer ID: {customerId}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Credit Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditStatusCard status={creditStatus} isLoading={isLoading} />

        {/* Credits List */}
        {credits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Credit Transactions ({credits.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {credits.map((credit) => (
                <button
                  key={credit.id}
                  onClick={() => setSelectedCredit(credit)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCredit?.id === credit.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        Transaction #{credit.id} - Sale #{credit.sale_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(credit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${credit.amount.toFixed(2)}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        credit.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : credit.status === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {credit.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {credit.remaining_balance > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Remaining: ${credit.remaining_balance.toFixed(2)}
                    </p>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settlement Form */}
      {selectedCredit && selectedCredit.remaining_balance > 0 && (
        <SettlementForm
          remainingBalance={selectedCredit.remaining_balance}
          onSubmit={handleSettleCredit}
          isLoading={isLoading}
        />
      )}

      {selectedCredit && selectedCredit.remaining_balance === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">✓ This credit is fully paid</p>
              <p className="text-gray-600 mt-2">No further action needed for this transaction.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
