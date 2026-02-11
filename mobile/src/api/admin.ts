import client from './client';
import type {
  ReviewRequestItem,
  ReviewDecisionRequest,
  AdminProduct,
  UpdateProductRequest,
  AdminUser,
  AdminTransaction,
} from '../types/api';

// Review Requests
export const getReviewRequests = (status?: string) =>
  client.get<ReviewRequestItem[]>('/review-requests', {
    params: status ? { status } : undefined,
  });

export const decideReviewRequest = (id: string, data: ReviewDecisionRequest) =>
  client.patch<ReviewRequestItem>(`/review-requests/${id}`, data);

// Products
export const getProducts = () =>
  client.get<AdminProduct[]>('/products');

export const updateProduct = (id: string, data: UpdateProductRequest) =>
  client.patch<AdminProduct>(`/products/${id}`, data);

// Users
export const getUsers = () =>
  client.get<AdminUser[]>('/users');

// Transactions
export const getTransactions = () =>
  client.get<AdminTransaction[]>('/transactions');
