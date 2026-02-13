import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ScanResultScreen } from '../screens/ScanResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminReviewRequestsScreen } from '../screens/admin/AdminReviewRequestsScreen';
import { AdminProductsScreen } from '../screens/admin/AdminProductsScreen';
import { AdminUsersScreen } from '../screens/admin/AdminUsersScreen';
import { AdminTransactionsScreen } from '../screens/admin/AdminTransactionsScreen';
import { AdminAnalyticsScreen } from '../screens/admin/AdminAnalyticsScreen';
import { PromotionsScreen } from '../screens/PromotionsScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { AdminPromotionsScreen } from '../screens/admin/AdminPromotionsScreen';
import { AdminOffersScreen } from '../screens/admin/AdminOffersScreen';
import { OfferBarcodeScreen } from '../screens/OfferBarcodeScreen';
import { UsePointsScreen } from '../screens/UsePointsScreen';
import type { MainStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Scanner" component={ScannerScreen} />
    <Stack.Screen name="ScanResult" component={ScanResultScreen} />
    <Stack.Screen name="History" component={HistoryScreen} />
    <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="AdminReviewRequests" component={AdminReviewRequestsScreen} />
    <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen} />
    <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
    <Stack.Screen name="Promotions" component={PromotionsScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
    <Stack.Screen name="AdminPromotions" component={AdminPromotionsScreen} />
    <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
    <Stack.Screen name="OfferBarcode" component={OfferBarcodeScreen} />
    <Stack.Screen name="UsePoints" component={UsePointsScreen} />
  </Stack.Navigator>
);
