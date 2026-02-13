import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../types/navigation';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'OfferBarcode'>;

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatBarcodeNumber = (id: string) => {
  const digits = id.replace(/[^a-f0-9]/gi, '').toUpperCase().slice(0, 12);
  return digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
};

const generateBarWidths = (id: string): number[] => {
  const widths: number[] = [];
  const chars = id.replace(/-/g, '');
  for (let i = 0; i < chars.length && widths.length < 50; i++) {
    const code = chars.charCodeAt(i);
    widths.push(((code % 3) + 1));
  }
  // Pad to at least 40 bars
  while (widths.length < 40) {
    widths.push(((widths.length % 3) + 1));
  }
  return widths;
};

export const OfferBarcodeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { offer } = route.params;
  const barWidths = generateBarWidths(offer.id);
  const barcodeNumber = formatBarcodeNumber(offer.id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[...Gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.storeName}>{offer.store?.name ?? 'Store'}</Text>
          <Text style={styles.discount}>{offer.discountPercentage}% OFF</Text>
          <Text style={styles.title}>{offer.title}</Text>
        </LinearGradient>

        <View style={styles.barcodeCard}>
          <Text style={styles.barcodeLabel}>Show this barcode at the store</Text>
          <View style={styles.barcodeContainer}>
            {barWidths.map((width, index) => (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    width,
                    backgroundColor: index % 2 === 0 ? '#000' : '#fff',
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.barcodeNumber}>{barcodeNumber}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.claimedBadge}>
              <Text style={styles.claimedBadgeText}>Claimed {'\u2713'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Claimed on</Text>
            <Text style={styles.infoValue}>{formatDate(offer.claimedAt)}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Expires</Text>
            <Text style={styles.infoValue}>{formatDate(offer.expiresAt)}</Text>
          </View>
        </View>
      </ScrollView>

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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  backArrow: {
    fontSize: FontSize.xxxl,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  summaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  storeName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  discount: {
    fontSize: FontSize.display,
    fontWeight: '800',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  barcodeCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  barcodeLabel: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginBottom: Spacing.md,
  },
  barcodeContainer: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'stretch',
    marginBottom: Spacing.md,
  },
  bar: {
    height: '100%',
  },
  barcodeNumber: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 2,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
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
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  doneButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
});
