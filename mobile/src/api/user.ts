import client from './client';
import type {
  UserProfile,
  Transaction,
  UpdateProfileRequest,
} from '../types/api';

export const getProfile = () =>
  client.get<UserProfile>('/users/me');

export const updateProfile = (data: UpdateProfileRequest) =>
  client.patch<UserProfile>('/users/me', data);

export const getTransactions = () =>
  client.get<Transaction[]>('/users/me/transactions');
