import { apiClient } from './api';

export interface CreditTransaction {
  id: number;
  customer_id: number;
  sale_id: number;
  amount: number;
  remaining_balance: number;
  status: 'outstanding' | 'partially_paid' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface CreditSettlement {
  id: number;
  credit_transaction_id: number;
  customer_id: number;
  amount: number;
  payment_method: 'cash' | 'card';
  payment_date: string;
  staff_id: number;
  notes?: string;
  created_at: string;
}

export interface CreditStatus {
  outstanding_balance: number;
  total_credit: number;
  total_settled: number;
  transaction_count: number;
  outstanding_transactions: number;
  paid_transactions: number;
}

export interface SettlementStats {
  cash_total: number;
  card_total: number;
  settlement_count: number;
  total_settled: number;
}

interface SettlementRequest {
  amount: number;
  payment_method: 'cash' | 'card';
  notes?: string;
}

class CreditsService {
  /**
   * Get credit status for a customer
   */
  async getCustomerCreditStatus(customerId: number): Promise<CreditStatus> {
    const response = await apiClient.get(`/customers/${customerId}/credits/status`);
    return response.data;
  }

  /**
   * Get a specific credit transaction
   */
  async getCreditTransaction(creditId: number): Promise<CreditTransaction> {
    const response = await apiClient.get(`/credits/${creditId}`);
    return response.data;
  }

  /**
   * List all credit transactions for a customer
   */
  async listCustomerCredits(customerId: number): Promise<CreditTransaction[]> {
    const response = await apiClient.get(`/customers/${customerId}/credits`);
    return response.data.credits || [];
  }

  /**
   * Settle a portion of a credit transaction
   */
  async settleCredit(
    creditId: number,
    settlement: SettlementRequest
  ): Promise<CreditSettlement> {
    const response = await apiClient.post(`/credits/${creditId}/settle`, settlement);
    return response.data;
  }

  /**
   * Get a specific settlement
   */
  async getSettlement(settlementId: number): Promise<CreditSettlement> {
    const response = await apiClient.get(`/settlements/${settlementId}`);
    return response.data;
  }

  /**
   * List all settlements for a customer
   */
  async listCustomerSettlements(
    customerId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<CreditSettlement[]> {
    const response = await apiClient.get(`/customers/${customerId}/settlements`, {
      params: { limit, offset },
    });
    return response.data.settlements || [];
  }

  /**
   * List all settlements for a credit transaction
   */
  async listCreditSettlements(creditId: number): Promise<CreditSettlement[]> {
    const response = await apiClient.get(`/credits/${creditId}/settlements`);
    return response.data.settlements || [];
  }

  /**
   * Get settlement statistics for a date range
   */
  async getSettlementStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<SettlementStats> {
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const response = await apiClient.get('/settlements/stats', { params });
    return response.data;
  }
}

export const creditsService = new CreditsService();
