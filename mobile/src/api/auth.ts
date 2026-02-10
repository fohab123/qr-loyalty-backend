import client from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/api';

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/auth/login', data);

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/auth/register', data);
