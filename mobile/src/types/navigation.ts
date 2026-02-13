export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

import type { ScanResponse, Transaction, Offer } from './api';

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
  Promotions: undefined;
  Offers: undefined;
  AdminPromotions: undefined;
  AdminOffers: undefined;
  OfferBarcode: { offer: Offer };
  UsePoints: undefined;
};
