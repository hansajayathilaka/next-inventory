import { apiClient } from './api';

export interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface Receipt {
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

class ReceiptsService {
  /**
   * Get receipt data for a sale
   */
  async getSaleReceipt(saleId: number): Promise<Receipt> {
    const response = await apiClient.get(`/sales/${saleId}/receipt`);
    return response.data;
  }

  /**
   * Get receipt as plain text
   */
  async getTextReceipt(saleId: number): Promise<string> {
    const response = await apiClient.get(`/sales/${saleId}/receipt/text`);
    return response.data;
  }

  /**
   * Get receipt as HTML
   */
  async getHTMLReceipt(saleId: number): Promise<string> {
    const response = await apiClient.get(`/sales/${saleId}/receipt/html`);
    return response.data;
  }

  /**
   * Download receipt as a file
   */
  async downloadReceipt(saleId: number): Promise<Blob> {
    const response = await apiClient.get(`/sales/${saleId}/receipt/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Print receipt by opening it in a new window
   */
  async printReceipt(saleId: number): Promise<void> {
    const html = await this.getHTMLReceipt(saleId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Please allow popups to print');
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

export const receiptsService = new ReceiptsService();
