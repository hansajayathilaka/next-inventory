// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: Meta;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface Meta {
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
}

// Auth types
export interface User {
  id: number;
  username: string;
  full_name: string;
  role_id: number;
  role?: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Common form types
export interface FormOption {
  value: string | number;
  label: string;
}

// Error types
export interface ValidationErrors {
  [key: string]: string[];
}