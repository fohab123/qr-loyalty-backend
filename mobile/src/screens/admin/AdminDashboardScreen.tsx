import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import * as adminApi from '../../api/admin';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminDashboard'>;

interface SectionCount {
  reviewRequests: number;
  products: number;
  users: number;
  transactions: number;
}

const sections = [
  { key: 'reviewRequests' as const, label: 'Review Requests', icon: '\u2709', route: 'AdminReviewRequests' as const },
  { key: 'products' as const, label: 'Products', icon: '\u{1F4E6}', route: 'AdminProducts' as const },
  { key: 'users' as const, label: 'Users', icon: '\u{1F465}', route: 'AdminUsers' as const },
  { key: 'transactions' as const, label: 'Transactions', icon: '\u{1F4B3}', route: 'AdminTransactions' as const },
];

export const AdminDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [counts, setCounts] = useState<SectionCount>({
    reviewRequests: 0,
    products: 0,
    users: 0,
    transactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        try {
          const [rr, prod, usr, tx] = await Promise.all([
            adminApi.getReviewRequests(),
            adminApi.getProducts(),
            adminApi.getUsers(),
            adminApi.getTransactions(),
          ]);
          setCounts({
            reviewRequests: rr.data.length,
            products: prod.data.length,
            users: usr.data.length,
            transactions: tx.data.length,
          });
        } catch {
          // silently fail
        } finally {
          setLoading(false);
        }
      };
      fetchCounts();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section.key}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(section.route)}
            >
              <LinearGradient
                colors={[...Gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <Text style={styles.cardIcon}>{section.icon}</Text>
              </LinearGradient>
              <Text style={styles.cardCount}>{counts[section.key]}</Text>
              <Text style={styles.cardLabel}>{section.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.analyticsCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AdminAnalytics')}
          >
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyticsGradient}
            >
              <Text style={styles.analyticsIcon}>{'\u{1F4CA}'}</Text>
              <Text style={styles.analyticsLabel}>Analytics</Text>
              <Text style={styles.analyticsArrow}>{'\u2192'}</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardCount: {
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  analyticsCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  analyticsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  analyticsIcon: {
    fontSize: 22,
    marginRight: Spacing.md,
  },
  analyticsLabel: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
  analyticsArrow: {
    fontSize: FontSize.xl,
    color: '#fff',
  },
});
