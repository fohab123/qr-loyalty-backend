import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { createReviewRequest } from '../api/review';
import { Colors, Gradient } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'ScanResult'>;

export const ScanResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { scanData } = route.params;
  const [reviewedIndices, setReviewedIndices] = useState<Set<number>>(new Set());
  const [loadingIndices, setLoadingIndices] = useState<Set<number>>(new Set());

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Result</Text>
        <View style={styles.backButton} />
      </View>

      <LinearGradient
        colors={[...Gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>Points Earned</Text>
        <Text style={styles.summaryPoints}>+{scanData.pointsEarned}</Text>
        <Text style={styles.summaryBalance}>
          New Balance: {scanData.newBalance.toLocaleString()} pts
        </Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Items ({scanData.items.length})</Text>

      <FlatList
        data={scanData.items}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const isReviewed = reviewedIndices.has(index);
          const isLoading = loadingIndices.has(index);

          return (
            <View style={styles.itemRow}>
              <View style={[styles.statusIcon, item.matched ? styles.matchedIcon : styles.unmatchedIcon]}>
                <Text style={[styles.statusIconText, { color: item.matched ? Colors.success : Colors.warning }]}>
                  {item.matched ? '\u2713' : '?'}
                </Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPoints}>
                  +{item.pointsAwarded} pts{!item.matched ? ' (default)' : ''}
                </Text>
              </View>
              {!item.matched && (
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
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryPoints: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  summaryBalance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
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
  itemPoints: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
