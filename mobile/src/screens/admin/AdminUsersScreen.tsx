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
import type { AdminUser, AdminTransaction } from '../../types/api';
import { getUsers, getTransactions } from '../../api/admin';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminUsers'>;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const AdminUsersScreen: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allTransactions, setAllTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, txRes] = await Promise.all([getUsers(), getTransactions()]);
      setUsers(usersRes.data);
      setAllTransactions(txRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderItem = ({ item }: { item: AdminUser }) => {
    const isAdmin = item.role === 'admin';
    const isExpanded = expandedId === item.id;
    const userTransactions = isExpanded
      ? allTransactions
          .filter((tx) => tx.user.id === item.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.cardRight}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: isAdmin ? Colors.warningMuted : Colors.successMuted },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  { color: isAdmin ? Colors.warning : Colors.success },
                ]}
              >
                {item.role}
              </Text>
            </View>
            <Text style={styles.pointsText}>
              {item.pointsBalance.toLocaleString()} pts
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{item.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Role</Text>
              <Text style={styles.detailValue}>{item.role}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Points Balance</Text>
              <Text style={styles.detailValue}>{item.pointsBalance.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
            </View>

            <Text style={styles.txSectionTitle}>
              Transactions ({userTransactions.length})
            </Text>
            {userTransactions.length === 0 ? (
              <Text style={styles.noTxText}>No transactions yet</Text>
            ) : (
              userTransactions.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txInfo}>
                    <Text style={styles.txStore}>{tx.store.name}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txPoints}>+{tx.pointsEarned} pts</Text>
                    <Text style={styles.txAmount}>
                      {Number(tx.totalAmount).toFixed(2)} RSD
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            users.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found</Text>
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
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  roleText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  expandedSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  txSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noTxText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  txInfo: {
    flex: 1,
  },
  txStore: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txPoints: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  txAmount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
