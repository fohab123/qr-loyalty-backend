import client from './client';
import type { PointsResponse, ScanRequest, ScanResponse, UsePointsResponse } from '../types/api';

export const getPoints = () =>
  client.get<PointsResponse>('/points/get');

export const scanQrCode = (data: ScanRequest) =>
  client.post<ScanResponse>('/points/add', data);

export const usePoints = (points: number) =>
  client.post<UsePointsResponse>('/points/use', { points });
