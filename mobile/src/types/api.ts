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
    productId: string;
    name: string;
    matched: boolean;
    pointsAwarded: number;
  }>;
}

export interface CreateReviewRequest {
  productId: string;
  comment?: string;
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
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pointsAwarded: number;
  product?: {
    id: string;
    name: string;
    price: number | null;
    status: 'approved' | 'pending' | 'rejected';
    pointsValue: number;
  };
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

// Admin types

export interface AdminProduct {
  id: string;
  name: string;
  price: number | null;
  status: 'approved' | 'pending' | 'rejected';
  pointsValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProductRequest {
  pointsValue: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  pointsBalance: number;
  createdAt: string;
}

export interface AdminTransaction {
  id: string;
  date: string;
  totalAmount: number;
  pointsEarned: number;
  store: { id: string; name: string };
  user: { id: string; name: string; email: string };
  items: TransactionItem[];
  createdAt: string;
}

export interface ReviewRequester {
  requestId: string;
  userId: string;
  name: string;
  email: string;
  comment?: string;
  createdAt: string;
}

export interface GroupedReviewRequest {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number | null;
    status: 'approved' | 'pending' | 'rejected';
    pointsValue: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestCount: number;
  requesters: ReviewRequester[];
  earliestRequestDate: string;
}

export interface ReviewDecisionRequest {
  status: 'approved' | 'rejected';
  comment?: string;
  pointsValue?: number;
}

export interface CreateProductRequest {
  name: string;
  price?: number;
  pointsValue?: number;
  status?: 'approved' | 'pending' | 'rejected';
}

// Analytics types

export interface ProductByStoreItem {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  scanCount: number;
  totalPointsAwarded: number;
}

export interface TopStoreItem {
  storeId: string;
  storeName: string;
  scanCount: number;
  totalPointsEarned: number;
  totalAmount: number;
}

export interface UserActivityItem {
  period: string;
  scanCount: number;
  uniqueUsers: number;
  totalPointsEarned: number;
}

export interface NewProductsTrend {
  period: string;
  count: number;
}

export interface NewProductsResponse {
  trend: NewProductsTrend[];
  recentPending: AdminProduct[];
}

export interface ReviewRequestTransaction {
  transactionId: string;
  date: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pointsAwarded: number;
}

export interface GroupedReviewTransactions {
  productId: string;
  users: Array<{
    userId: string;
    userName: string;
    transactions: ReviewRequestTransaction[];
  }>;
}
