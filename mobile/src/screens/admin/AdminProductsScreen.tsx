import React, { useState, useEffect, useCallback } from 'react';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types/navigation';
import type { AdminProduct } from '../../types/api';
import { getProducts, updateProduct } from '../../api/admin';
import { Colors, Gradient, Spacing, BorderRadius, FontSize } from '../../constants/theme';

type Props = NativeStackScreenProps<MainStackParamList, 'AdminProducts'>;

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: Colors.successMuted, text: Colors.success },
  pending: { bg: Colors.warningMuted, text: Colors.warning },
  rejected: { bg: Colors.dangerMuted, text: Colors.danger },
};

export const AdminProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (product: AdminProduct) => {
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

  const renderItem = ({ item }: { item: AdminProduct }) => {
    const isEditing = editingId === item.id;
    const sc = statusColors[item.status];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleEdit(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.nameRow}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.price != null && (
                <Text style={styles.priceText}>
                  {Number(item.price).toFixed(2)} RSD
                </Text>
              )}
            </View>
            <View style={styles.pointsPill}>
              <Text style={styles.pointsPillText}>
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
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            products.length === 0 ? styles.emptyContainer : styles.listContent
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
});
