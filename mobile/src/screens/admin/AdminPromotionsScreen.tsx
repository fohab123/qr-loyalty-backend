import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import type { Promotion } from '../../types/api';
import {
  getAllPromotions,
  createPromotion,
  deletePromotion,
  generateOffers,
  getStores,
} from '../../api/promotions';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminPromotions'>;

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: Colors.successMuted, text: Colors.success },
  inactive: { bg: Colors.warningMuted, text: Colors.warning },
};

const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const AdminPromotionsScreen: React.FC<Props> = ({ navigation }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newMinPoints, setNewMinPoints] = useState('');
  const [selectedStoreIdx, setSelectedStoreIdx] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        try {
          const [promoRes, storesRes] = await Promise.all([
            getAllPromotions(),
            getStores().catch(() => ({ data: [] as Array<{ id: string; name: string }> })),
          ]);
          setPromotions(promoRes.data);
          setStores(storesRes.data);
        } catch {
          // silently fail
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, []),
  );

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    const discountPercentage = parseFloat(newDiscount);
    if (isNaN(discountPercentage) || discountPercentage <= 0) {
      Alert.alert('Error', 'Please enter a valid discount percentage.');
      return;
    }
    if (stores.length === 0) {
      Alert.alert('Error', 'No stores available.');
      return;
    }
    if (!newStartDate || !newEndDate) {
      Alert.alert('Error', 'Please enter start and end dates (YYYY-MM-DD).');
      return;
    }

    setCreating(true);
    try {
      const res = await createPromotion({
        title,
        description: newDescription.trim() || undefined,
        discountPercentage,
        storeId: stores[selectedStoreIdx].id,
        startDate: newStartDate,
        endDate: newEndDate,
        minPointsRequired: newMinPoints ? parseInt(newMinPoints, 10) : undefined,
      });
      setPromotions((prev) => [res.data, ...prev]);
      setShowCreateForm(false);
      setNewTitle('');
      setNewDescription('');
      setNewDiscount('');
      setNewStartDate('');
      setNewEndDate('');
      setNewMinPoints('');
      setSelectedStoreIdx(0);
    } catch {
      Alert.alert('Error', 'Failed to create promotion.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Promotion', 'Are you sure you want to delete this promotion?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePromotion(id);
            setPromotions((prev) => prev.filter((p) => p.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete promotion.');
          }
        },
      },
    ]);
  };

  const handleGenerate = async (promotionId: string) => {
    setGenerating(promotionId);
    try {
      const res = await generateOffers(promotionId);
      const count = res.data?.generated ?? 0;
      Alert.alert('Offers Generated', `${count} offer(s) created.`);
    } catch {
      Alert.alert('Error', 'Failed to generate offers.');
    } finally {
      setGenerating(null);
    }
  };

  const renderItem = ({ item }: { item: Promotion }) => {
    const sc = statusColors[item.status] ?? statusColors.inactive;
    const isGenerating = generating === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.storeName}>{item.store?.name ?? 'Store'}</Text>
            <Text style={styles.discountText}>{item.discountPercentage}% OFF</Text>
            <Text style={styles.dateText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.generateButtonWrap}
            onPress={() => handleGenerate(item.id)}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[...Gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButton}
            >
              <Text style={styles.generateButtonText}>
                {isGenerating ? '...' : 'Generate Offers'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <TouchableOpacity onPress={() => setShowCreateForm((v) => !v)}>
          <Text style={styles.addButton}>{showCreateForm ? '\u2715' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            promotions.length === 0 && !showCreateForm ? styles.emptyContainer : styles.listContent
          }
          ListHeaderComponent={
            showCreateForm ? (
              <View style={styles.createCard}>
                <Text style={styles.createTitle}>New Promotion</Text>
                <TextInput
                  style={styles.createInput}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Title *"
                  placeholderTextColor={Colors.textMuted}
                  keyboardAppearance="dark"
                />
                <TextInput
                  style={styles.createInput}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="Description"
                  placeholderTextColor={Colors.textMuted}
                  keyboardAppearance="dark"
                  multiline
                />
                <TextInput
                  style={styles.createInput}
                  value={newDiscount}
                  onChangeText={setNewDiscount}
                  placeholder="Discount % *"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                />

                {/* Store picker */}
                <Text style={styles.pickerLabel}>Store</Text>
                <View style={styles.storePicker}>
                  {stores.map((s, idx) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.storeChip,
                        selectedStoreIdx === idx && styles.storeChipActive,
                      ]}
                      onPress={() => setSelectedStoreIdx(idx)}
                    >
                      <Text
                        style={[
                          styles.storeChipText,
                          selectedStoreIdx === idx && styles.storeChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {s.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.createRow}>
                  <TextInput
                    style={[styles.createInput, styles.createHalfInput]}
                    value={newStartDate}
                    onChangeText={setNewStartDate}
                    placeholder="Start (YYYY-MM-DD) *"
                    placeholderTextColor={Colors.textMuted}
                    keyboardAppearance="dark"
                  />
                  <TextInput
                    style={[styles.createInput, styles.createHalfInput]}
                    value={newEndDate}
                    onChangeText={setNewEndDate}
                    placeholder="End (YYYY-MM-DD) *"
                    placeholderTextColor={Colors.textMuted}
                    keyboardAppearance="dark"
                  />
                </View>
                <TextInput
                  style={styles.createInput}
                  value={newMinPoints}
                  onChangeText={setNewMinPoints}
                  placeholder="Min Points (optional)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  keyboardAppearance="dark"
                />
                <TouchableOpacity
                  style={styles.createButtonWrap}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  <LinearGradient
                    colors={[...Gradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.createButton}
                  >
                    <Text style={styles.createButtonText}>
                      {creating ? 'Creating...' : 'Create Promotion'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No promotions found</Text>
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
  addButton: {
    fontSize: FontSize.xxxl,
    color: Colors.primaryLight,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
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
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  storeName: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    marginBottom: 2,
  },
  discountText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 2,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  generateButtonWrap: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  generateButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  deleteButton: {
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  // Create form
  createCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  createTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  createInput: {
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  createHalfInput: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  storePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  storeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  storeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  storeChipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  storeChipTextActive: {
    color: '#fff',
  },
  createButtonWrap: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  createButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.base,
  },
});
