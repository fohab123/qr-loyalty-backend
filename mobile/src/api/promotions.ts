import client from './client';
import type {
  Promotion,
  PromotionsForUser,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  Offer,
} from '../types/api';

// User endpoints
export const getActivePromotions = () =>
  client.get<Promotion[]>('/promotions');

export const getPromotionsForMe = () =>
  client.get<PromotionsForUser>('/promotions/me');

export const getMyOffers = () =>
  client.get<Offer[]>('/offers/me');

export const claimOffer = (offerId: string) =>
  client.post<Offer>(`/offers/me/${offerId}/claim`);

export const autoGenerateOffers = () =>
  client.post<{ generated: number }>('/offers/me/auto-generate');

// Admin endpoints
export const getAllPromotions = () =>
  client.get<Promotion[]>('/promotions/all');

export const createPromotion = (data: CreatePromotionRequest) =>
  client.post<Promotion>('/promotions', data);

export const updatePromotion = (id: string, data: UpdatePromotionRequest) =>
  client.patch<Promotion>(`/promotions/${id}`, data);

export const deletePromotion = (id: string) =>
  client.delete(`/promotions/${id}`);

export const getAllOffers = (status?: string) =>
  client.get<Offer[]>('/offers', {
    params: status ? { status } : undefined,
  });

export const generateOffers = (promotionId: string) =>
  client.post<{ generated: number }>(`/offers/generate/${promotionId}`);

export const deleteOffer = (id: string) =>
  client.delete(`/offers/${id}`);

// Stores (needed by admin promotions form)
export const getStores = () =>
  client.get<Array<{ id: string; name: string }>>('/stores');
