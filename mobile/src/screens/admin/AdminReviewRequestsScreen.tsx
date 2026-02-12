import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import type { GroupedReviewRequest, GroupedReviewTransactions } from '../../types/api';
import { getReviewRequests, decideReviewRequest, getReviewRequestTransactions } from '../../api/admin';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { formatRSD } from '../../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminReviewRequests'>;

const tabs = ['pending', 'approved', 'rejected'] as const;

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.warningMuted, text: Colors.warning },
  approved: { bg: Colors.successMuted, text: Colors.success },
  rejected: { bg: Colors.dangerMuted, text: Colors.danger },
};

export const AdminReviewRequestsScreen: React.FC<Props> = ({ navigation, route }) => {
  const autoExpandProductId = route.params?.autoExpandProductId;
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [items, setItems] = useState<GroupedReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pointsInputs, setPointsInputs] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [pointsMode, setPointsMode] = useState<Record<string, 'default' | 'custom'>>({});
  const [deciding, setDeciding] = useState<string | null>(null);
  const [txData, setTxData] = useState<Record<string, GroupedReviewTransactions>>({});
  const [txLoading, setTxLoading] = useState<Record<string, boolean>>({});

  const fetchTransactions = async (productId: string) => {
    if (txData[productId]) return;
    setTxLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await getReviewRequestTransactions(productId);
      setTxData((prev) => ({ ...prev, [productId]: res.data }));
    } catch {
      // silently fail
    } finally {
      setTxLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleExpand = (productId: string) => {
    const newId = expandedId === productId ? null : productId;
    setExpandedId(newId);
    if (newId) {
      fetchTransactions(newId);
      // Pre-populate default points so Approve works without touching the input
      if (pointsInputs[newId] === undefined) {
        const item = items.find((i) => i.productId === newId);
        if (item) {
          setPointsInputs((prev) => ({ ...prev, [newId]: String(getDefaultPoints(item)) }));
        }
      }
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReviewRequests(activeTab);
      setItems(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoExpandProductId && items.length > 0 && !expandedId) {
      const idx = items.findIndex((i) => i.productId === autoExpandProductId);
      if (idx >= 0) {
        // Move to top so the admin sees it immediately
        if (idx > 0) {
          setItems((prev) => {
            const item = prev[idx];
            return [item, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
          });
        }
        handleExpand(autoExpandProductId);
      }
    }
  }, [autoExpandProductId, items.length]);

  const handleDecide = async (productId: string, status: 'approved' | 'rejected') => {
    const pointsStr = pointsInputs[productId];
    const item = items.find((i) => i.productId === productId);
    const pointsValue = pointsStr
      ? parseInt(pointsStr, 10)
      : item ? getDefaultPoints(item) : undefined;

    if (status === 'approved' && (!pointsValue || pointsValue <= 0)) {
      Alert.alert('Error', 'Please enter a valid points value before approving.');
      return;
    }

    const comment = commentInputs[productId]?.trim() || undefined;

    setDeciding(productId);
    try {
      await decideReviewRequest(productId, { status, pointsValue, comment });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      setExpandedId(null);
    } catch {
      Alert.alert('Error', 'Failed to process decision.');
    } finally {
      setDeciding(null);
    }
  };

  const getDefaultPoints = (item: GroupedReviewRequest) => {
    if (item.product?.price != null && item.product.price > 0) {
      return Math.max(1, Math.floor(Number(item.product.price) / 10));
    }
    return (item.product?.pointsValue ?? 0) > 0 ? item.product!.pointsValue : 1;
  };

  const handlePointsMode = (productId: string, mode: 'default' | 'custom', item: GroupedReviewRequest) => {
    setPointsMode((prev) => ({ ...prev, [productId]: mode }));
    if (mode === 'default') {
      setPointsInputs((prev) => ({ ...prev, [productId]: String(getDefaultPoints(item)) }));
    } else {
      setPointsInputs((prev) => ({ ...prev, [productId]: '' }));
    }
  };

  const renderItem = ({ item }: { item: GroupedReviewRequest }) => {
    const isExpanded = expandedId === item.productId;
    const isDeciding = deciding === item.productId;
    const sc = statusColors[item.status];
    const txInfo = txData[item.productId];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleExpand(item.productId)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.productName}>{item.product?.name ?? 'Unknown Product'}</Text>
            {item.product?.price != null && (
              <Text style={styles.priceText}>
                {formatRSD(item.product.price)}
              </Text>
            )}
            {item.requestCount > 1 && (
              <View style={styles.requestCountBadge}>
                <Text style={styles.requestCountText}>{item.requestCount} requests</Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Requesters list */}
        <View style={styles.requestersList}>
          {(item.requesters ?? []).map((r) => (
            <View key={r.requestId} style={styles.requesterRow}>
              <Text style={styles.requesterName}>{r.name}</Text>
              {r.comment ? (
                <Text style={styles.requesterComment}>"{r.comment}"</Text>
              ) : null}
            </View>
          ))}
        </View>

        {isExpanded && (
          <View style={styles.txSection}>
            <Text style={styles.txSectionTitle}>Purchase History</Text>
            {txLoading[item.productId] ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.sm }} />
            ) : txInfo?.users?.length ? (
              txInfo.users.map((userGroup) => (
                <View key={userGroup.userId} style={styles.userTxGroup}>
                  {txInfo.users.length > 1 && (
                    <Text style={styles.userTxHeader}>{userGroup.userName}</Text>
                  )}
                  {userGroup.transactions.length > 0 ? (
                    userGroup.transactions.map((tx, i) => (
                      <View key={tx.transactionId + i} style={styles.txRow}>
                        <View style={styles.txRowLeft}>
                          <Text style={styles.txStore}>{tx.storeName}</Text>
                          <Text style={styles.txDate}>
                            {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={styles.txRowRight}>
                          <Text style={styles.txDetail}>{tx.quantity} x {formatRSD(tx.unitPrice)}</Text>
                          <Text style={styles.txPoints}>+{tx.pointsAwarded} pts</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.txEmpty}>No purchases</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.txEmpty}>No purchase history found</Text>
            )}
          </View>
        )}

        {isExpanded && activeTab === 'pending' && (
          <View style={styles.actionSection}>
            <Text style={styles.actionLabel}>Points Value</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  (pointsMode[item.productId] || 'default') === 'default' && styles.modeChipActive,
                ]}
                onPress={() => handlePointsMode(item.productId, 'default', item)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    (pointsMode[item.productId] || 'default') === 'default' && styles.modeChipTextActive,
                  ]}
                >
                  Default ({getDefaultPoints(item)})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  pointsMode[item.productId] === 'custom' && styles.modeChipActive,
                ]}
                onPress={() => handlePointsMode(item.productId, 'custom', item)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    pointsMode[item.productId] === 'custom' && styles.modeChipTextActive,
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pointsInput}
              placeholder="e.g. 10"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              keyboardAppearance="dark"
              value={pointsInputs[item.productId] ?? String(getDefaultPoints(item))}
              onChangeText={(val) => {
                setPointsInputs((prev) => ({ ...prev, [item.productId]: val }));
                setPointsMode((prev) => ({ ...prev, [item.productId]: 'custom' }));
              }}
            />
            <Text style={styles.actionLabel}>Rejection Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Reason for rejection..."
              placeholderTextColor={Colors.textMuted}
              keyboardAppearance="dark"
              value={commentInputs[item.productId] || ''}
              onChangeText={(val) =>
                setCommentInputs((prev) => ({ ...prev, [item.productId]: val }))
              }
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleDecide(item.productId, 'rejected')}
                disabled={isDeciding}
              >
                <Text style={styles.rejectButtonText}>
                  {isDeciding ? '...' : 'Reject'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButtonWrap}
                onPress={() => handleDecide(item.productId, 'approved')}
                disabled={isDeciding}
              >
                <LinearGradient
                  colors={[...Gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.approveButton}
                >
                  <Text style={styles.approveButtonText}>
                    {isDeciding ? '...' : 'Approve'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isExpanded && activeTab !== 'pending' && item.requesters?.some(r => r.comment) ? (
          <View style={styles.adminCommentSection}>
            {item.requesters.filter(r => r.comment).map(r => (
              <Text key={r.requestId} style={styles.adminComment}>
                {(item.requesters?.length ?? 0) > 1 ? `${r.name}: ` : ''}{r.comment}
              </Text>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Requests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.productId}
          renderItem={renderItem}
          contentContainerStyle={
            items.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {activeTab} requests</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primaryLight,
    fontWeight: '600',
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
  productName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  priceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  requestCountBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  requestCountText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  requestersList: {
    marginTop: Spacing.sm,
  },
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  requesterName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  requesterComment: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  actionSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeChipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  modeChipTextActive: {
    color: '#fff',
  },
  pointsInput: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  commentInput: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  approveButtonWrap: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  approveButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  adminCommentSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  adminComment: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  txSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  txSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  userTxGroup: {
    marginBottom: Spacing.sm,
  },
  userTxHeader: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primaryLight,
    marginBottom: Spacing.xs,
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
  txRowLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  txRowRight: {
    alignItems: 'flex-end',
  },
  txStore: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txDetail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  txPoints: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  txEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
