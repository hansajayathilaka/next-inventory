import { apiClient } from './api';

export interface UserInfo {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role_name: string;
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    const data = response.data || response as any;

    // Store tokens
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    await apiClient.post('/auth/logout', {});
  }

  async getSession(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/auth/session');
    return response.data || response as any;
  }

  async refreshToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    const data = response.data || response as any;

    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    return data;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export const authService = new AuthService();
