import client from './client';
import type {
  GroupedReviewRequest,
  ReviewDecisionRequest,
  GroupedReviewTransactions,
  AdminProduct,
  UpdateProductRequest,
  CreateProductRequest,
  AdminUser,
  AdminTransaction,
  ProductByStoreItem,
  TopStoreItem,
  UserActivityItem,
  NewProductsResponse,
} from '../types/api';

// Review Requests
export const getReviewRequests = (status?: string) =>
  client.get<GroupedReviewRequest[]>('/review-requests', {
    params: status ? { status } : undefined,
  });

export const decideReviewRequest = (productId: string, data: ReviewDecisionRequest) =>
  client.patch(`/review-requests/product/${productId}`, data);

export const getReviewRequestTransactions = (productId: string) =>
  client.get<GroupedReviewTransactions>(`/review-requests/product/${productId}/transactions`);

// Products
export const getProducts = () =>
  client.get<AdminProduct[]>('/products');

export const updateProduct = (id: string, data: UpdateProductRequest) =>
  client.patch<AdminProduct>(`/products/${id}`, data);

export const createProduct = (data: CreateProductRequest) =>
  client.post<AdminProduct>('/products', data);

// Users
export const getUsers = () =>
  client.get<AdminUser[]>('/users');

// Transactions
export const getTransactions = () =>
  client.get<AdminTransaction[]>('/transactions');

// Analytics
export const getProductsByStore = () =>
  client.get<ProductByStoreItem[]>('/analytics/products-by-store');

export const getTopProductsByStore = () =>
  client.get<ProductByStoreItem[]>('/analytics/products-by-store', {
    params: { top: 'true' },
  });

export const getTopStores = () =>
  client.get<TopStoreItem[]>('/analytics/top-stores');

export const getUserActivity = (period: 'daily' | 'weekly' | 'monthly') =>
  client.get<UserActivityItem[]>('/analytics/user-activity', {
    params: { period },
  });

export const getNewProducts = (period: 'daily' | 'weekly' | 'monthly') =>
  client.get<NewProductsResponse>('/analytics/new-products', {
    params: { period },
  });
