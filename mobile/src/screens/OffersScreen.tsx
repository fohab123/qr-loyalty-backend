import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { Offer } from '../types/api';
import { getMyOffers, claimOffer, autoGenerateOffers } from '../api/promotions';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Offers'>;

const formatExpiry = (dateString: string) => {
  const now = new Date();
  const expires = new Date(dateString);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return `${diffDays} days left`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours}h left`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}m left`;
};

export const OffersScreen: React.FC<Props> = ({ navigation }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        setLoading(true);
        try {
          await autoGenerateOffers().catch(() => {});
          const res = await getMyOffers();
          setOffers(res.data);
        } catch {
          // silently fail
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, []),
  );

  const handleClaim = async (offerId: string) => {
    setClaiming(offerId);
    try {
      const res = await claimOffer(offerId);
      setOffers((prev) =>
        prev.map((o) => (o.id === offerId ? res.data : o)),
      );
    } catch {
      Alert.alert('Error', 'Failed to claim offer.');
    } finally {
      setClaiming(null);
    }
  };

  const renderItem = ({ item }: { item: Offer }) => {
    const isClaimed = item.status === 'claimed';
    const isExpired = item.status === 'expired';
    const isActive = item.status === 'active';
    const pointsCost = item.promotion?.minPointsRequired ?? 0;

    const cardContent = (
      <View style={[styles.card, (isClaimed || isExpired) && styles.cardDimmed]}>
        <View style={styles.cardTop}>
          <View style={styles.storeBadge}>
            <Text style={styles.storeBadgeText}>{item.store?.name ?? 'Store'}</Text>
          </View>
          <LinearGradient
            colors={isClaimed ? [Colors.success, Colors.success] : [...Gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountBadgeText}>{item.discountPercentage}% OFF</Text>
          </LinearGradient>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {pointsCost > 0 && (
          <View style={styles.pointsCostBadge}>
            <Text style={styles.pointsCostText}>{pointsCost} pts</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.expiryText, isExpired && { color: Colors.danger }]}>
            {isExpired ? 'Expired' : formatExpiry(item.expiresAt)}
          </Text>

          {isClaimed ? (
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedBadgeText}>Claimed {'\u2713'}</Text>
            </View>
          ) : isActive ? (
            <TouchableOpacity
              style={styles.claimButtonWrap}
              onPress={() => handleClaim(item.id)}
              disabled={claiming === item.id}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...Gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimButton}
              >
                <Text style={styles.claimButtonText}>
                  {claiming === item.id
                    ? '...'
                    : pointsCost > 0
                      ? `Claim (${pointsCost} pts)`
                      : 'Claim'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );

    if (isClaimed) {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('OfferBarcode', { offer: item })}
        >
          {cardContent}
        </TouchableOpacity>
      );
    }

    return cardContent;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Offers</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            offers.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\uD83C\uDF81'}</Text>
              <Text style={styles.emptyTitle}>No offers available</Text>
              <Text style={styles.emptySubtitle}>
                Favorite some stores to receive personalized offers!
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
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardDimmed: {
    opacity: 0.6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  storeBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  storeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  discountBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  discountBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  pointsCostBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.warningMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  pointsCostText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.warning,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  expiryText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  claimedBadge: {
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  claimedBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  claimButtonWrap: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  claimButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
});
