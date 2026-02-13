import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import type { Promotion, PromotionsForUser } from '../types/api';
import { getPromotionsForMe } from '../api/promotions';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Promotions'>;

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PromotionCard: React.FC<{ item: Promotion }> = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.storeBadge}>
        <Text style={styles.storeBadgeText}>{item.store?.name ?? 'Store'}</Text>
      </View>
      <LinearGradient
        colors={[...Gradient]}
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
    <View style={styles.cardFooter}>
      <Text style={styles.dateText}>
        {formatDate(item.startDate)} - {formatDate(item.endDate)}
      </Text>
      {item.minPointsRequired != null && item.minPointsRequired > 0 && (
        <Text style={styles.minPointsText}>Min {item.minPointsRequired} pts</Text>
      )}
    </View>
  </View>
);

export const PromotionsScreen: React.FC<Props> = ({ navigation }) => {
  const [data, setData] = useState<PromotionsForUser | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        setLoading(true);
        try {
          const res = await getPromotionsForMe();
          setData(res.data);
        } catch {
          // silently fail
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, []),
  );

  const hasFavorites = (data?.favoriteStorePromotions?.length ?? 0) > 0;
  const hasOther = (data?.otherPromotions?.length ?? 0) > 0;
  const isEmpty = !hasFavorites && !hasOther;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>{'\uD83C\uDF81'}</Text>
          <Text style={styles.emptyText}>No promotions available</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {hasFavorites && (
            <>
              <Text style={styles.sectionTitle}>From Your Favorite Stores</Text>
              {data!.favoriteStorePromotions.map((p) => (
                <PromotionCard key={p.id} item={p} />
              ))}
            </>
          )}

          {hasOther && (
            <>
              <Text style={[styles.sectionTitle, hasFavorites && { marginTop: Spacing.xl }]}>
                Other Promotions
              </Text>
              {data!.otherPromotions.map((p) => (
                <PromotionCard key={p.id} item={p} />
              ))}
            </>
          )}

          <TouchableOpacity
            style={styles.offersButtonWrap}
            onPress={() => navigation.navigate('Offers')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.offersButton}
            >
              <Text style={styles.offersButtonText}>View My Offers {'\u2192'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  minPointsText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  offersButtonWrap: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  offersButton: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  offersButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.base,
  },
});
