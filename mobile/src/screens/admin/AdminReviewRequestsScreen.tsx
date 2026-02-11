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
import type { ReviewRequestItem } from '../../types/api';
import { getReviewRequests, decideReviewRequest } from '../../api/admin';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';

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
  const [items, setItems] = useState<ReviewRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pointsInputs, setPointsInputs] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [pointsMode, setPointsMode] = useState<Record<string, 'default' | 'custom'>>({});
  const [deciding, setDeciding] = useState<string | null>(null);

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
      const match = items.find((i) => i.productId === autoExpandProductId);
      if (match) setExpandedId(match.id);
    }
  }, [autoExpandProductId, items, expandedId]);

  const handleDecide = async (id: string, status: 'approved' | 'rejected') => {
    const pointsStr = pointsInputs[id];
    const pointsValue = pointsStr ? parseInt(pointsStr, 10) : undefined;

    if (status === 'approved' && (!pointsValue || pointsValue <= 0)) {
      Alert.alert('Error', 'Please enter a valid points value before approving.');
      return;
    }

    const comment = commentInputs[id]?.trim() || undefined;

    setDeciding(id);
    try {
      await decideReviewRequest(id, { status, pointsValue, comment });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setExpandedId(null);
    } catch {
      Alert.alert('Error', 'Failed to process decision.');
    } finally {
      setDeciding(null);
    }
  };

  const getDefaultPoints = (item: ReviewRequestItem) => {
    if (item.product.price != null && item.product.price > 0) {
      return Math.max(1, Math.floor(Number(item.product.price) / 10));
    }
    return item.product.pointsValue > 0 ? item.product.pointsValue : 1;
  };

  const handlePointsMode = (id: string, mode: 'default' | 'custom', item: ReviewRequestItem) => {
    setPointsMode((prev) => ({ ...prev, [id]: mode }));
    if (mode === 'default') {
      setPointsInputs((prev) => ({ ...prev, [id]: String(getDefaultPoints(item)) }));
    } else {
      setPointsInputs((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const renderItem = ({ item }: { item: ReviewRequestItem }) => {
    const isExpanded = expandedId === item.id;
    const isDeciding = deciding === item.id;
    const sc = statusColors[item.status];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.nameRow}>
              <Text style={styles.productName}>{item.product.name}</Text>
              {item.product.price != null && (
                <Text style={styles.priceText}>
                  {Number(item.product.price).toFixed(2)} RSD
                </Text>
              )}
            </View>
            <Text style={styles.userName}>{item.submittedBy.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {item.comment ? (
          <Text style={styles.comment}>"{item.comment}"</Text>
        ) : null}

        {isExpanded && activeTab === 'pending' && (
          <View style={styles.actionSection}>
            <Text style={styles.actionLabel}>Points Value</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  (pointsMode[item.id] || 'default') === 'default' && styles.modeChipActive,
                ]}
                onPress={() => handlePointsMode(item.id, 'default', item)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    (pointsMode[item.id] || 'default') === 'default' && styles.modeChipTextActive,
                  ]}
                >
                  Default ({getDefaultPoints(item)})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeChip,
                  pointsMode[item.id] === 'custom' && styles.modeChipActive,
                ]}
                onPress={() => handlePointsMode(item.id, 'custom', item)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    pointsMode[item.id] === 'custom' && styles.modeChipTextActive,
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
              value={pointsInputs[item.id] ?? String(getDefaultPoints(item))}
              onChangeText={(val) => {
                setPointsInputs((prev) => ({ ...prev, [item.id]: val }));
                setPointsMode((prev) => ({ ...prev, [item.id]: 'custom' }));
              }}
            />
            <Text style={styles.actionLabel}>Rejection Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Reason for rejection..."
              placeholderTextColor={Colors.textMuted}
              keyboardAppearance="dark"
              value={commentInputs[item.id] || ''}
              onChangeText={(val) =>
                setCommentInputs((prev) => ({ ...prev, [item.id]: val }))
              }
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleDecide(item.id, 'rejected')}
                disabled={isDeciding}
              >
                <Text style={styles.rejectButtonText}>
                  {isDeciding ? '...' : 'Reject'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveButtonWrap}
                onPress={() => handleDecide(item.id, 'approved')}
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

        {isExpanded && activeTab !== 'pending' && item.comment ? (
          <Text style={styles.adminComment}>Comment: {item.comment}</Text>
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
          keyExtractor={(item) => item.id}
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  productName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  priceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
  comment: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
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
  adminComment: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
