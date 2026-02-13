import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPoints } from '../api/points';
import { usePoints } from '../api/points';
import type { ApiError } from '../types/api';
import type { MainStackParamList } from '../types/navigation';
import { AxiosError } from 'axios';
import { Colors, Gradient, Spacing, FontSize } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'UsePoints'>;

const QUICK_PERCENTAGES = [25, 50, 75, 100] as const;

export const UsePointsScreen: React.FC<Props> = ({ navigation }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [pointsInput, setPointsInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getPoints()
        .then((res) => {
          if (active) setBalance(res.data.pointsBalance);
        })
        .catch(() => {
          if (active) setBalance(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleQuickSelect = (pct: number) => {
    if (balance == null) return;
    const amount = Math.floor((balance * pct) / 100);
    setPointsInput(String(amount));
  };

  const handleRedeem = async () => {
    const points = parseInt(pointsInput, 10);
    if (!points || points <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number of points.');
      return;
    }
    setRedeeming(true);
    try {
      const res = await usePoints(points);
      Alert.alert(
        'Points Redeemed',
        `You used ${res.data.pointsUsed.toLocaleString()} points.\nNew balance: ${res.data.newBalance.toLocaleString()}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join('\n') : msg ?? 'Failed to redeem points';
      Alert.alert('Error', errorText);
    } finally {
      setRedeeming(false);
    }
  };

  const parsedPoints = parseInt(pointsInput, 10);
  const canRedeem = parsedPoints > 0 && !redeeming;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Use Points</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primaryLight} style={{ marginTop: Spacing.sm }} />
          ) : balance != null ? (
            <Text style={styles.balanceValue}>
              {balance.toLocaleString()}
            </Text>
          ) : (
            <Text style={styles.balanceError}>Could not load balance</Text>
          )}
          <Text style={styles.balanceUnit}>points</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Points to Redeem</Text>
          <TextInput
            style={styles.input}
            value={pointsInput}
            onChangeText={setPointsInput}
            placeholder="Enter amount"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            keyboardAppearance="dark"
          />

          <View style={styles.quickRow}>
            {QUICK_PERCENTAGES.map((pct) => (
              <TouchableOpacity
                key={pct}
                style={styles.quickButton}
                onPress={() => handleQuickSelect(pct)}
                disabled={balance == null || balance === 0}
                activeOpacity={0.7}
              >
                <Text style={styles.quickButtonText}>{pct}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={!canRedeem}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[...Gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.redeemButtonGradient}
          >
            {redeeming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.redeemButtonText}>Redeem Points</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  balanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  balanceError: {
    fontSize: FontSize.md,
    color: Colors.danger,
    marginTop: Spacing.sm,
  },
  balanceUnit: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  inputSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xxl,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickButton: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  quickButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  redeemButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '600',
  },
});
