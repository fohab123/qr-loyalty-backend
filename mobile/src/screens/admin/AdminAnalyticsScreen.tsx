import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import type {
  ProductByStoreItem,
  TopStoreItem,
  UserActivityItem,
  NewProductsResponse,
} from '../../types/api';
import * as adminApi from '../../api/admin';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminAnalytics'>;
type Period = 'daily' | 'weekly' | 'monthly';

export const AdminAnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [productsByStore, setProductsByStore] = useState<ProductByStoreItem[]>([]);
  const [topStores, setTopStores] = useState<TopStoreItem[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityItem[]>([]);
  const [newProducts, setNewProducts] = useState<NewProductsResponse>({ trend: [], recentPending: [] });
  const [activityPeriod, setActivityPeriod] = useState<Period>('daily');
  const [productsPeriod, setProductsPeriod] = useState<Period>('daily');

  const fetchAll = useCallback(async () => {
    try {
      const [pbs, ts, ua, np] = await Promise.all([
        adminApi.getProductsByStore(),
        adminApi.getTopStores(),
        adminApi.getUserActivity(activityPeriod),
        adminApi.getNewProducts(productsPeriod),
      ]);
      setProductsByStore(pbs.data);
      setTopStores(ts.data);
      setUserActivity(ua.data);
      setNewProducts(np.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activityPeriod, productsPeriod]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderPeriodSelector = (
    value: Period,
    onChange: (p: Period) => void,
  ) => (
    <View style={styles.periodRow}>
      {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.periodChip, value === p && styles.periodChipActive]}
          onPress={() => onChange(p)}
        >
          <Text style={[styles.periodText, value === p && styles.periodTextActive]}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Products by Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Products by Store</Text>
          {productsByStore.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            productsByStore.map((item, i) => (
              <View key={`${item.storeId}-${item.productId}`} style={styles.row}>
                <Text style={styles.rowText} numberOfLines={1}>
                  {item.storeName} {'>'} {item.productName}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.scanCount} scans, {item.totalPointsAwarded} pts
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Top Stores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Stores</Text>
          {topStores.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            topStores.map((item, i) => (
              <View key={item.storeId} style={styles.row}>
                <Text style={styles.rowText} numberOfLines={1}>
                  #{i + 1} {item.storeName}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.scanCount} scans, {item.totalPointsEarned} pts, {Number(item.totalAmount).toFixed(0)} RSD
                </Text>
              </View>
            ))
          )}
        </View>

        {/* User Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Activity</Text>
          {renderPeriodSelector(activityPeriod, setActivityPeriod)}
          {userActivity.length === 0 ? (
            <Text style={styles.emptyText}>No data yet</Text>
          ) : (
            userActivity.map((item, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowText}>{formatDate(item.period)}</Text>
                <Text style={styles.rowMeta}>
                  {item.scanCount} scans, {item.uniqueUsers} users, {item.totalPointsEarned} pts
                </Text>
              </View>
            ))
          )}
        </View>

        {/* New Unknown Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Unknown Products</Text>
          {renderPeriodSelector(productsPeriod, setProductsPeriod)}
          {newProducts.trend.length > 0 && (
            <View style={styles.trendBlock}>
              {newProducts.trend.map((t, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.rowText}>{formatDate(t.period)}</Text>
                  <Text style={styles.rowMeta}>{t.count} new pending</Text>
                </View>
              ))}
            </View>
          )}
          {newProducts.recentPending.length === 0 ? (
            <Text style={styles.emptyText}>No pending products</Text>
          ) : (
            <>
              <Text style={styles.subTitle}>Recent Pending</Text>
              {newProducts.recentPending.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.rowText} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.rowMeta}>{formatDate(p.createdAt)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: FontSize.xxxl,
    color: Colors.primaryLight,
    paddingRight: Spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  rowMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  periodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.elevated,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
  },
  trendBlock: {
    marginBottom: Spacing.sm,
  },
});
