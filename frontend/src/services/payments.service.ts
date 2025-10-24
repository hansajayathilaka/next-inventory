import { api } from './api';

export interface PaymentDetails {
  session_id: string;
  payment_method: 'cash' | 'card' | 'credit';
  amount_paid?: number;
  customer_id?: number;
}

export interface Sale {
  id: number;
  transaction_id: string;
  staff_id: number;
  customer_id?: number;
  subtotal: number;
  bill_discount: number;
  tax_amount: number;
  total: number;
  payment_method: string;
  amount_paid?: number;
  change_given?: number;
  sale_date: string;
  created_at: string;
}

export interface PaymentStats {
  cash_total: number;
  card_total: number;
  credit_total: number;
  sales_count: number;
  total_amount: number;
}

class PaymentsService {
  /**
   * Process a payment for a sales session
   */
  async processPayment(details: PaymentDetails): Promise<Sale> {
    const response = await api.post('/payments/process', details);
    return response.data;
  }

  /**
   * Get payment details by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<Sale> {
    const response = await api.get(`/payments/${transactionId}`);
    return response.data;
  }

  /**
   * List all payments for a customer
   */
  async listCustomerPayments(
    customerId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<Sale[]> {
    const response = await api.get(`/customers/${customerId}/payments`, {
      params: { limit, offset },
    });
    return response.data.payments || [];
  }

  /**
   * Get payment statistics for a date range
   */
  async getPaymentStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<PaymentStats> {
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const response = await api.get('/payments/stats', { params });
    return response.data;
  }

  /**
   * Generate receipt for a payment
   */
  async getReceipt(saleId: number): Promise<Blob> {
    const response = await api.get(`/sales/${saleId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const paymentsService = new PaymentsService();
