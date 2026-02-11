export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

import type { ScanResponse, Transaction } from './api';

export type MainStackParamList = {
  Scanner: undefined;
  ScanResult: { scanData: ScanResponse };
  History: undefined;
  TransactionDetail: { transaction: Transaction; isAdmin?: boolean };
  Profile: undefined;
  AdminDashboard: undefined;
  AdminReviewRequests: { autoExpandProductId?: string } | undefined;
  AdminProducts: undefined;
  AdminUsers: undefined;
  AdminTransactions: undefined;
  AdminAnalytics: undefined;
};
