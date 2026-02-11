import client from './client';
import type { CreateReviewRequest } from '../types/api';

export const createReviewRequest = (data: CreateReviewRequest) =>
  client.post('/product/review/request', data);
