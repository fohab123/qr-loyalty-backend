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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pointsAwarded: number;
}

export interface Transaction {
  id: string;
  date: string;
  totalAmount: number;
  pointsEarned: number;
  store: {
    id: string;
    name: string;
  };
  items: TransactionItem[];
  createdAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
