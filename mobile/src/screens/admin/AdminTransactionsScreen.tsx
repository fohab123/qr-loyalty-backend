import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import type { AdminTransaction, Transaction } from '../../types/api';
import { getTransactions } from '../../api/admin';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { formatRSD } from '../../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminTransactions'>;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const AdminTransactionsScreen: React.FC<Props> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await getTransactions();
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTransactions(sorted);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePress = (item: AdminTransaction) => {
    const { user: _user, ...transaction } = item;
    navigation.navigate('TransactionDetail', { transaction: transaction as Transaction, isAdmin: true });
  };

  const renderItem = ({ item }: { item: AdminTransaction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.storeName}>{item.store?.name ?? 'Unknown Store'}</Text>
          <Text style={styles.userName}>{item.user?.name ?? 'Unknown User'}</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          {item.items.length > 0 && (
            <View style={styles.productPreviewList}>
              {item.items.slice(0, 3).map((i, idx) => (
                <Text key={idx} style={styles.productPreviewItem} numberOfLines={1}>
                  {i.productName}
                </Text>
              ))}
              {item.items.length > 3 && (
                <Text style={styles.productPreviewMore}>
                  +{item.items.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          <View style={styles.pointsPill}>
            <Text style={styles.pointsText}>+{item.pointsEarned} pts</Text>
          </View>
          <Text style={styles.amountText}>
            {formatRSD(item.totalAmount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            transactions.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      )}
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
  headerSpacer: {
    width: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  storeName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  productPreviewList: {
    marginTop: Spacing.xs,
  },
  productPreviewItem: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  productPreviewMore: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  pointsPill: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xs,
  },
  pointsText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  amountText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
