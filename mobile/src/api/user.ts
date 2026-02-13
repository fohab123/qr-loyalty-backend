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

export const getFavoriteStores = () =>
  client.get<Array<{ id: string; name: string }>>('/users/me/favorite-stores');

export const addFavoriteStore = (storeId: string) =>
  client.post(`/users/me/favorite-stores/${storeId}`);

export const removeFavoriteStore = (storeId: string) =>
  client.delete(`/users/me/favorite-stores/${storeId}`);

export const registerPushToken = (pushToken: string) =>
  client.put('/users/me/push-token', { pushToken });
