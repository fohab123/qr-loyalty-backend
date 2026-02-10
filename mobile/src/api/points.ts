import client from './client';
import type { PointsResponse, ScanRequest, ScanResponse } from '../types/api';

export const getPoints = () =>
  client.get<PointsResponse>('/points/get');

export const scanQrCode = (data: ScanRequest) =>
  client.post<ScanResponse>('/points/add', data);
