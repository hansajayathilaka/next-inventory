import { apiClient } from './api';

export interface SalesSessionDTO {
  id?: number;
  session_id: string;
  staff_id: number;
  customer_id?: number;
  bill_discount_type?: string;
  bill_discount_value: number;
  status: string;
  last_activity: string;
  items?: SalesSessionItemDTO[];
}

export interface SalesSessionItemDTO {
  id?: number;
  session_id: string;
  inventory_batch_id: number;
  quantity: number;
  unit_price: number;
  discount_type?: string;
  discount_value: number;
  line_total: number;
  created_at?: string;
}

class POSService {
  // Create a new sales session
  async createSession(staffID: number, customerID?: number): Promise<SalesSessionDTO> {
    const response = await apiClient.post<SalesSessionDTO>('/pos/sessions', {
      staff_id: staffID,
      customer_id: customerID,
    });
    return response.data as SalesSessionDTO;
  }

  // Get a session by ID
  async getSession(sessionID: string): Promise<SalesSessionDTO> {
    const response = await apiClient.get<SalesSessionDTO>(`/pos/sessions/${sessionID}`);
    return response.data as SalesSessionDTO;
  }

  // List active sessions for a staff member
  async listActiveSessions(staffID: number): Promise<SalesSessionDTO[]> {
    const response = await apiClient.get<SalesSessionDTO[]>(`/pos/sessions/staff/${staffID}`);
    return response.data as SalesSessionDTO[];
  }

  // Add item to session
  async addItemToSession(
    sessionID: string,
    batchID: number,
    quantity: number,
    unitPrice: number,
    discountType?: string,
    discountValue?: number
  ): Promise<SalesSessionItemDTO> {
    const response = await apiClient.post<SalesSessionItemDTO>(
      `/pos/sessions/${sessionID}/items`,
      {
        inventory_batch_id: batchID,
        quantity,
        unit_price: unitPrice,
        discount_type: discountType,
        discount_value: discountValue || 0,
      }
    );
    return response.data as SalesSessionItemDTO;
  }

  // Update item in session
  async updateSessionItem(
    itemID: number,
    quantity: number,
    unitPrice: number,
    discountType?: string,
    discountValue?: number
  ): Promise<void> {
    await apiClient.put(`/pos/items/${itemID}`, {
      quantity,
      unit_price: unitPrice,
      discount_type: discountType,
      discount_value: discountValue || 0,
    });
  }

  // Remove item from session
  async removeItemFromSession(itemID: number): Promise<void> {
    await apiClient.delete(`/pos/items/${itemID}`);
  }

  // Calculate session total
  async calculateSessionTotal(sessionID: string): Promise<number> {
    const response = await apiClient.get<{ total: number }>(
      `/pos/sessions/${sessionID}/total`
    );
    return (response.data as { total: number }).total;
  }

  // Apply bill discount
  async applyBillDiscount(
    sessionID: string,
    discountType: string,
    discountValue: number
  ): Promise<void> {
    await apiClient.post(`/pos/sessions/${sessionID}/discount`, {
      discount_type: discountType,
      discount_value: discountValue,
    });
  }

  // Complete session
  async completeSession(sessionID: string): Promise<void> {
    await apiClient.post(`/pos/sessions/${sessionID}/complete`, {});
  }

  // Abandon session
  async abandonSession(sessionID: string): Promise<void> {
    await apiClient.post(`/pos/sessions/${sessionID}/abandon`, {});
  }

  // Get session items
  async getSessionItems(sessionID: string): Promise<SalesSessionItemDTO[]> {
    const response = await apiClient.get<SalesSessionItemDTO[]>(
      `/pos/sessions/${sessionID}/items`
    );
    return response.data as SalesSessionItemDTO[];
  }
}

export const posService = new POSService();
