import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { TransactionItem } from '../types/api';
import { createReviewRequest } from '../api/review';
import { updateProduct } from '../api/admin';
import { Colors, Gradient } from '../constants/theme';
import { formatRSD } from '../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'TransactionDetail'>;

const isMatched = (item: TransactionItem) =>
  item.product?.status === 'approved' && item.product.pointsValue > 0;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const TransactionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transaction, isAdmin } = route.params;
  const [reviewedIndices, setReviewedIndices] = useState<Set<number>>(new Set());
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const handleRequestReview = async (index: number, productId: string) => {
    setLoadingIndices((prev) => new Set(prev).add(index));
    try {
      await createReviewRequest({ productId });
      setReviewedIndices((prev) => new Set(prev).add(index));
    } catch (err: any) {
      if (err?.response?.status === 409) {
        Alert.alert('Already Requested', 'You already have a pending review request for this product.');
        setReviewedIndices((prev) => new Set(prev).add(index));
      } else {
        Alert.alert('Error', 'Failed to submit review request. Please try again.');
      }
    } finally {
      setLoadingIndices((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleEditPoints = (index: number, item: TransactionItem) => {
    if (editingIndex === index) {
      setEditingIndex(null);
      return;
    }
    setEditingIndex(index);
    setEditValue(String(item.product?.pointsValue ?? 0));
  };

  const handleSavePoints = async (index: number, productId: string) => {
    const pointsValue = parseInt(editValue, 10);
    if (isNaN(pointsValue) || pointsValue < 0) {
      Alert.alert('Error', 'Please enter a valid points value.');
      return;
    }
    setSavingIndex(index);
    try {
      await updateProduct(productId, { pointsValue });
      Alert.alert('Saved', 'Points value updated successfully.');
      setEditingIndex(null);
    } catch {
      Alert.alert('Error', 'Failed to update points value.');
    } finally {
      setSavingIndex(null);
    }
  };

  const handleGoToReview = async (index: number, productId: string) => {
    await handleRequestReview(index, productId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.backButton} />
      </View>

      <LinearGradient
        colors={[...Gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <Text style={styles.storeName}>{transaction.store?.name ?? 'Unknown Store'}</Text>
        <Text style={styles.summaryDate}>{formatDate(transaction.date)}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Points Earned</Text>
            <Text style={styles.summaryPoints}>+{transaction.pointsEarned}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryAmount}>
              {formatRSD(transaction.totalAmount)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Items ({transaction.items.length})</Text>

      <FlatList
        data={transaction.items}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const matched = isMatched(item);
          const isReviewed = reviewedIndices.has(index);
          const isLoading = loadingIndices.has(index);
          const isPending = item.product?.status === 'pending';
          const isEditing = editingIndex === index;
          const isSaving = savingIndex === index;

          return (
            <View style={styles.itemRow}>
              <View style={[styles.statusIcon, matched ? styles.matchedIcon : styles.unmatchedIcon]}>
                <Text style={[styles.statusIconText, { color: matched ? Colors.success : Colors.warning }]}>
                  {matched ? '\u2713' : '?'}
                </Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.itemDetail}>
                  {item.quantity} x {formatRSD(item.unitPrice)}
                </Text>
                <Text style={styles.itemPoints}>
                  +{item.pointsAwarded} pts{!matched ? ' (default)' : ''}
                </Text>
              </View>
              {isAdmin && matched && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditPoints(index, item)}
                >
                  <Text style={styles.editButtonText}>
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              )}
              {isAdmin && isPending && (
                <TouchableOpacity
                  style={[styles.goReviewButton, (reviewedIndices.has(index) || loadingIndices.has(index)) && styles.reviewButtonDisabled]}
                  onPress={() => handleGoToReview(index, item.productId)}
                  disabled={reviewedIndices.has(index) || loadingIndices.has(index)}
                >
                  <Text style={[styles.goReviewButtonText, reviewedIndices.has(index) && styles.reviewButtonTextDisabled]}>
                    {loadingIndices.has(index) ? 'Sending...' : reviewedIndices.has(index) ? 'Review Requested' : 'Request Review'}
                  </Text>
                </TouchableOpacity>
              )}
              {!isAdmin && !matched && (
                <TouchableOpacity
                  style={[styles.reviewButton, (isReviewed || isLoading) && styles.reviewButtonDisabled]}
                  onPress={() => handleRequestReview(index, item.productId)}
                  disabled={isReviewed || isLoading}
                >
                  <Text style={[styles.reviewButtonText, isReviewed && styles.reviewButtonTextDisabled]}>
                    {isLoading ? 'Sending...' : isReviewed ? 'Review Requested' : 'Request Review'}
                  </Text>
                </TouchableOpacity>
              )}
              {isEditing && (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    keyboardAppearance="dark"
                    placeholder="Points"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSavePoints(index, item.productId)}
                    disabled={isSaving}
                  >
                    <LinearGradient
                      colors={[...Gradient]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButtonGradient}
                    >
                      <Text style={styles.saveButtonText}>
                        {isSaving ? '...' : 'Save'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[...Gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.doneButtonGradient}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryPoints: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchedIcon: {
    backgroundColor: Colors.successMuted,
  },
  unmatchedIcon: {
    backgroundColor: Colors.warningMuted,
  },
  statusIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemPoints: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  goReviewButton: {
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  goReviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  editRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewButton: {
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  reviewButtonDisabled: {
    backgroundColor: Colors.elevated,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  reviewButtonTextDisabled: {
    color: Colors.textMuted,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  },
  doneButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
