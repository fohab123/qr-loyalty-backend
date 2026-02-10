export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export interface PointsResponse {
  userId: string;
  pointsBalance: number;
}

export interface ScanRequest {
  qrCodeData: string;
}

export interface ScanResponse {
  transactionId: string;
  pointsEarned: number;
  newBalance: number;
  items: Array<{
    name: string;
    matched: boolean;
    pointsAwarded: number;
  }>;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
