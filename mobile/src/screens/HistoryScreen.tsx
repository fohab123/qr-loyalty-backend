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
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getTransactions } from '../api/user';
import type { Transaction } from '../types/api';
import type { MainStackParamList } from '../types/navigation';
import { Colors, Gradient } from '../constants/theme';
import { formatRSD } from '../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'History'>;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const TransactionCard: React.FC<{
  item: Transaction;
  onShowDetails: (transaction: Transaction) => void;
}> = ({ item, onShowDetails }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.storeName}>{item.store?.name ?? 'Unknown Store'}</Text>
          <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
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
          <Text style={styles.itemCount}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {expanded && item.items.length > 0 && (
        <View style={styles.itemsContainer}>
          {item.items.map((ti) => (
            <View key={ti.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{ti.productName}</Text>
                <Text style={styles.itemDetail}>
                  {ti.quantity} x {formatRSD(ti.unitPrice)}
                </Text>
              </View>
              <Text style={styles.itemPoints}>
                {ti.pointsAwarded > 0 ? `+${ti.pointsAwarded} pts` : '0 pts'}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {formatRSD(item.totalAmount)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onShowDetails(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.detailsButtonGradient}
            >
              <Text style={styles.detailsButtonText}>Show Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.expandIndicator}>
        <Text style={styles.expandArrow}>{expanded ? '\u25B2' : '\u25BC'}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await getTransactions();
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTransactions(sorted);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchTransactions().finally(() => setLoading(false));
  }, [fetchTransactions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
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
          renderItem={({ item }) => (
            <TransactionCard
              item={item}
              onShowDetails={(tx) => navigation.navigate('TransactionDetail', { transaction: tx })}
            />
          )}
          contentContainerStyle={
            transactions.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\uD83D\uDCCB'}</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Scan a receipt to get started
              </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: 24,
    color: Colors.primaryLight,
    paddingRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  productPreviewList: {
    marginTop: 6,
  },
  productPreviewItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  productPreviewMore: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  pointsPill: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  pointsText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandArrow: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  itemsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  itemDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPoints: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailsButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  detailsButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
