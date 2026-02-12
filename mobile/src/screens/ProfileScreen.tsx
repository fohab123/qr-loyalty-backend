import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getProfile, updateProfile, getTransactions } from '../api/user';
import { useAuth } from '../hooks/useAuth';
import type { UserProfile, ApiError } from '../types/api';
import type { MainStackParamList } from '../types/navigation';
import { AxiosError } from 'axios';
import { Colors, Gradient } from '../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

const formatMemberSince = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, txRes] = await Promise.all([
        getProfile(),
        getTransactions(),
      ]);
      setProfile(profileRes.data);
      setEditName(profileRes.data.name);
      setEditEmail(profileRes.data.email);
      setTransactionCount(txRes.data.length);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    if (!profile) return;
    setDirty(editName !== profile.name || editEmail !== profile.email);
  }, [editName, editEmail, profile]);

  const handleSave = async () => {
    if (!dirty || !profile) return;
    setSaving(true);
    try {
      const updates: { name?: string; email?: string } = {};
      if (editName !== profile.name) updates.name = editName.trim();
      if (editEmail !== profile.email) updates.email = editEmail.trim().toLowerCase();

      const res = await updateProfile(updates);
      setProfile(res.data);
      setEditName(res.data.name);
      setEditEmail(res.data.email);
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join('\n') : msg ?? 'Update failed';
      Alert.alert('Error', errorText);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (profile.name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {profile.pointsBalance.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{transactionCount}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              keyboardAppearance="dark"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Your email"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              keyboardAppearance="dark"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!dirty || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!dirty || saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...Gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.memberSince}>
            Member since {formatMemberSince(profile.createdAt)}
          </Text>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    fontSize: 24,
    color: Colors.primaryLight,
    paddingRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
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
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  editSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.elevated,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
    color: Colors.textPrimary,
  },
  saveButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonGradient: {
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  memberSince: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: Colors.dangerMuted,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    marginBottom: 32,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});
