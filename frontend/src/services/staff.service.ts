import { apiClient } from './api';

export interface Staff {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class StaffService {
  async createStaff(username: string, password: string, firstName: string, lastName: string, email: string, roleId: number): Promise<Staff> {
    const response = await apiClient.post<Staff>('/staff', {
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      email,
      role_id: roleId,
    });
    return response.data || response as any;
  }

  async getStaff(id: number): Promise<Staff> {
    const response = await apiClient.get<Staff>(`/staff/${id}`);
    return response.data || response as any;
  }

  async listStaff(): Promise<Staff[]> {
    const response = await apiClient.get<Staff[]>('/staff');
    return response.data || response as any;
  }

  async updateStaff(id: number, firstName?: string, lastName?: string, email?: string, roleId?: number): Promise<Staff> {
    const payload: any = {};
    if (firstName) payload.first_name = firstName;
    if (lastName) payload.last_name = lastName;
    if (email) payload.email = email;
    if (roleId) payload.role_id = roleId;

    const response = await apiClient.put<Staff>(`/staff/${id}`, payload);
    return response.data || response as any;
  }

  async deactivateStaff(id: number): Promise<void> {
    await apiClient.put(`/staff/${id}/deactivate`, {});
  }
}

export const staffService = new StaffService();
