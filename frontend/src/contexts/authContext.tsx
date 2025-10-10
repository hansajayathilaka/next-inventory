import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthState } from '@/types';

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
      // TODO: Implement actual login API call
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // For refresh token cookie
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.success) {
        // Store access token
        localStorage.setItem('access_token', data.data.access_token);

        // Update auth state
        setAuthState({
          user: data.data.user,
          permissions: data.data.user.role?.permissions?.map((p: any) => p.name) || [],
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error(data.error?.message || 'Login failed');
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');

    // Call logout endpoint to clear refresh token cookie
    fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error);

    setAuthState({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('access_token', data.data.access_token);

        setAuthState({
          user: data.data.user,
          permissions: data.data.user.role?.permissions?.map((p: any) => p.name) || [],
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