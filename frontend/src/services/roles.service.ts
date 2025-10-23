import { apiClient } from './api';

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export class RoleService {
  async createRole(payload: CreateRolePayload): Promise<Role> {
    const response = await apiClient.post<Role>('/roles', payload);
    return response.data || response as any;
  }

  async getRole(id: number): Promise<Role> {
    const response = await apiClient.get<Role>(`/roles/${id}`);
    return response.data || response as any;
  }

  async listRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/roles');
    return response.data || response as any;
  }

  async updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
    const response = await apiClient.put<Role>(`/roles/${id}`, payload);
    return response.data || response as any;
  }

  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  }

  async assignPermission(roleId: number, permissionId: number): Promise<void> {
    await apiClient.post(`/roles/${roleId}/permissions`, { permission_id: permissionId });
  }

  async removePermission(roleId: number, permissionId: number): Promise<void> {
    await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>(`/roles/${roleId}/permissions`);
    return response.data || response as any;
  }

  async createPermission(name: string, resource: string, action: string, description?: string): Promise<Permission> {
    const response = await apiClient.post<Permission>('/permissions', {
      name,
      resource,
      action,
      description,
    });
    return response.data || response as any;
  }

  async getPermission(id: number): Promise<Permission> {
    const response = await apiClient.get<Permission>(`/permissions/${id}`);
    return response.data || response as any;
  }

  async listPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/permissions');
    return response.data || response as any;
  }
}

export const roleService = new RoleService();
