import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState } from '@/types';
import { apiClient } from '@/services/api';

interface AuthContextType {
  authState: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // TODO: Validate token and get user info
          // For now, just check if token exists
          await refreshToken();
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiClient.post('/auth/login', { username, password });

      if (response.success) {
        // Store access token
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }

        // Update auth state - backend returns permissions directly in user object
        setAuthState({
          user: response.data.user,
          permissions: response.data.user.permissions || [],
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Call logout endpoint to clear refresh token cookie
    apiClient.post('/auth/logout', {}).catch(console.error);

    setAuthState({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      const response = await apiClient.post('/auth/refresh', { refresh_token: refreshTokenValue });

      if (response.success) {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }

        setAuthState({
          user: response.data.user,
          permissions: response.data.user.permissions || [],
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      logout();
      throw error;
    }
  };

  const hasPermission = (permission: string) => {
    return authState.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => authState.permissions.includes(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        refreshToken,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}