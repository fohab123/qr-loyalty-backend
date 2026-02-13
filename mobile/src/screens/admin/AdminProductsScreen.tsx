import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
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
import type { AdminProduct, ProductByStoreItem } from '../../types/api';
import { getProducts, updateProduct, createProduct, getProductsByStore } from '../../api/admin';
import { createReviewRequest } from '../../api/review';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import { formatRSD } from '../../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminProducts'>;

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: Colors.successMuted, text: Colors.success },
  pending: { bg: Colors.warningMuted, text: Colors.warning },
  rejected: { bg: Colors.dangerMuted, text: Colors.danger },
};

interface ProductSection {
  title: string;
  data: AdminProduct[];
}

export const AdminProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [storeData, setStoreData] = useState<ProductByStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [creating, setCreating] = useState(false);
  const [sendingToReview, setSendingToReview] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, storeRes] = await Promise.all([
        getProducts(),
        getProductsByStore().catch(() => ({ data: [] as ProductByStoreItem[] })),
      ]);
      setProducts(productsRes.data);
      setStoreData(storeRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const sections = useMemo((): ProductSection[] => {
    // Build productId → set of store names from transaction history
    const productStoresMap = new Map<string, Set<string>>();
    for (const row of storeData) {
      let stores = productStoresMap.get(row.productId);
      if (!stores) {
        stores = new Set();
        productStoresMap.set(row.productId, stores);
      }
      stores.add(row.storeName);
    }

    // Group products by store — a product appears in every store it was scanned at
    const storeGroups = new Map<string, AdminProduct[]>();
    for (const product of products) {
      const stores = productStoresMap.get(product.id);
      if (!stores || stores.size === 0) {
        const group = storeGroups.get('Other');
        if (group) { group.push(product); } else { storeGroups.set('Other', [product]); }
      } else {
        for (const storeName of stores) {
          const group = storeGroups.get(storeName);
          if (group) { group.push(product); } else { storeGroups.set(storeName, [product]); }
        }
      }
    }

    // Convert to sections, sorted alphabetically ("Other" last)
    return Array.from(storeGroups.entries())
      .sort(([a], [b]) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
      })
      .map(([title, data]) => ({ title, data }));
  }, [products, storeData]);

  const filteredSections = useMemo((): ProductSection[] => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        data: s.data.filter((p) => (p.name ?? '').toLowerCase().includes(q)),
      }))
      .filter((s) => s.data.length > 0);
  }, [sections, search]);

  const handleEdit = (product: AdminProduct) => {
    if (product.status === 'rejected') return;

    if (editingId === product.id) {
      setEditingId(null);
      return;
    }
    setEditingId(product.id);
    setEditValue(String(product.pointsValue));
  };

  const handleSave = async (id: string) => {
    const pointsValue = parseInt(editValue, 10);
    if (isNaN(pointsValue) || pointsValue < 0) {
      Alert.alert('Error', 'Please enter a valid points value.');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProduct(id, { pointsValue });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? res.data : p)),
      );
      setEditingId(null);
    } catch {
      Alert.alert('Error', 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }
    setCreating(true);
    try {
      const res = await createProduct({
        name: trimmed,
        price: newPrice ? parseFloat(newPrice) : undefined,
        pointsValue: newPoints ? parseInt(newPoints, 10) : undefined,
        status: 'approved',
      });
      setProducts((prev) => [res.data, ...prev]);
      setShowCreateForm(false);
      setNewName('');
      setNewPrice('');
      setNewPoints('');
    } catch {
      Alert.alert('Error', 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }: { item: AdminProduct }) => {
    const isEditing = editingId === item.id;
    const sc = statusColors[item.status] ?? { bg: Colors.elevated, text: Colors.textMuted };
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        style={[styles.card, isRejected && styles.cardRejected]}
        onPress={() => handleEdit(item)}
        activeOpacity={isRejected ? 1 : 0.7}
        disabled={isRejected}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.nameRow}>
              <Text style={[styles.productName, isRejected && styles.textMuted]}>{item.name}</Text>
              {item.price != null && (
                <Text style={[styles.priceText, isRejected && styles.textMuted]}>
                  {formatRSD(item.price)}
                </Text>
              )}
            </View>
            <View style={[styles.pointsPill, isRejected && styles.pointsPillRejected]}>
              <Text style={[styles.pointsPillText, isRejected && styles.textMuted]}>
                {item.pointsValue} pts
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {isEditing && (
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>Points Value</Text>
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
                style={styles.saveButtonWrap}
                onPress={() => handleSave(item.id)}
                disabled={saving}
              >
                <LinearGradient
                  colors={[...Gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? '...' : 'Save'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {isPending && (
              <TouchableOpacity
                style={[styles.reviewButtonWrap, { marginTop: Spacing.md }]}
                disabled={sendingToReview}
                onPress={async () => {
                  setSendingToReview(true);
                  try {
                    await createReviewRequest({ productId: item.id });
                    setEditingId(null);
                    navigation.navigate('AdminReviewRequests', { autoExpandProductId: item.id });
                  } catch (err: any) {
                    const msg = err?.response?.data?.message;
                    if (msg?.includes('already have a pending')) {
                      setEditingId(null);
                      navigation.navigate('AdminReviewRequests', { autoExpandProductId: item.id });
                    } else {
                      Alert.alert('Error', typeof msg === 'string' ? msg : 'Failed to send to review.');
                    }
                  } finally {
                    setSendingToReview(false);
                  }
                }}
              >
                <LinearGradient
                  colors={[Colors.warning, '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.reviewButton}
                >
                  <Text style={styles.reviewButtonText}>
                    {sendingToReview ? 'Sending...' : 'Send to Review'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: ProductSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity onPress={() => setShowCreateForm((v) => !v)}>
          <Text style={styles.addButton}>{showCreateForm ? '\u2715' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardAppearance="dark"
        />
        {search.length > 0 && (
          <TouchableOpacity style={styles.searchClear} onPress={() => setSearch('')}>
            <Text style={styles.searchClearText}>{'\u2715'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={
            products.length === 0 && !showCreateForm ? styles.emptyContainer : styles.listContent
          }
          ListHeaderComponent={
            showCreateForm ? (
              <View style={styles.createCard}>
                <Text style={styles.createTitle}>New Product</Text>
                <TextInput
                  style={styles.createInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Product Name *"
                  placeholderTextColor={Colors.textMuted}
                  keyboardAppearance="dark"
                />
                <View style={styles.createRow}>
                  <TextInput
                    style={[styles.createInput, styles.createHalfInput]}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder="Price (RSD)"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    keyboardAppearance="dark"
                  />
                  <TextInput
                    style={[styles.createInput, styles.createHalfInput]}
                    value={newPoints}
                    onChangeText={setNewPoints}
                    placeholder="Points Value"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    keyboardAppearance="dark"
                  />
                </View>
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
                      {creating ? 'Creating...' : 'Create Product'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  searchClear: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  searchClearText: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: FontSize.sm,
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
  cardRejected: {
    opacity: 0.5,
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
  textMuted: {
    color: Colors.textMuted,
  },
  priceText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  pointsPill: {
    backgroundColor: 'rgba(99,102,241,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  pointsPillRejected: {
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  pointsPillText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primaryLight,
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
  editSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  editRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  editInput: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  saveButtonWrap: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  reviewButtonWrap: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  reviewButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSize.base,
  },
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
