import React, { createContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as authApi from '../api/auth';
import { getPoints } from '../api/points';
import { setUnauthorizedHandler } from '../api/client';
import type { LoginRequest, RegisterRequest } from '../types/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn: (data: LoginRequest) => Promise<void>;
  signUp: (data: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  }, []);

  // Wire 401 interceptor to sign out
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
  }, [signOut]);

  // Check for stored token on mount
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const storedUser = await SecureStore.getItemAsync('user');

        if (token && storedUser) {
          // Validate token by calling a protected endpoint
          await getPoints();
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Token invalid or expired — clear storage
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const signIn = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const { accessToken, user: userData } = res.data;
    await SecureStore.setItemAsync('token', accessToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const signUp = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    const { accessToken, user: userData } = res.data;
    await SecureStore.setItemAsync('token', accessToken);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
