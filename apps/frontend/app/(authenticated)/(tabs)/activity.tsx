import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/constants/Colors';
import { useBalanceStore } from '@/Store/balance/balanceStore';
import {
  DEFAULT_TRANSACTION_CATEGORIES,
  DefaultTransactionCategory,
  filterTransactions,
  formatTransactionCategoryLabel,
  formatTransactionDate,
  getMonthlyTransactionSummary,
  getTransactionCategories,
  getTransactionsNewestFirst,
  TransactionCategory,
} from '@/Store/balance/transactionUtils';

const categoryIcons: Record<DefaultTransactionCategory, keyof typeof Ionicons.glyphMap> = {
  income: 'trending-up',
  food: 'restaurant-outline',
  transport: 'train-outline',
  shopping: 'card-outline',
  crypto: 'logo-bitcoin',
  other: 'wallet-outline',
};

const getCategoryIcon = (category: TransactionCategory): keyof typeof Ionicons.glyphMap => {
  return category in categoryIcons
    ? categoryIcons[category as DefaultTransactionCategory]
    : 'pricetag-outline';
};

const formatDollarAmount = (amount: number) => {
  const absoluteAmount = Math.abs(amount).toLocaleString('en-US');
  return `${amount < 0 ? '-' : ''}$${absoluteAmount}`;
};

const Activity = () => {
  const headerHeight = useHeaderHeight();
  const { transactions, updateTransactionCategory } = useBalanceStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | 'all'>('all');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState('');

  const normalizedTransactions = useMemo(
    () => getTransactionsNewestFirst(transactions),
    [transactions]
  );
  const filteredTransactions = useMemo(
    () =>
      filterTransactions(normalizedTransactions, {
        query,
        category: activeCategory,
      }),
    [activeCategory, normalizedTransactions, query]
  );
  const monthlySummary = useMemo(
    () => getMonthlyTransactionSummary(transactions),
    [transactions]
  );
  const categoryOptions = useMemo(
    () => [
      { label: 'All', value: 'all' as const },
      ...getTransactionCategories(transactions).map((category) => ({
        label: formatTransactionCategoryLabel(category),
        value: category,
      })),
    ],
    [transactions]
  );
  const editingTransaction = useMemo(
    () =>
      editingTransactionId
        ? transactions.find((transaction) => transaction.id === editingTransactionId)
        : undefined,
    [editingTransactionId, transactions]
  );

  const openCategoryEditor = (transactionId: string, category: TransactionCategory) => {
    setEditingTransactionId(transactionId);
    setCategoryInput(formatTransactionCategoryLabel(category));
  };

  const closeCategoryEditor = () => {
    setEditingTransactionId(null);
    setCategoryInput('');
  };

  const saveCategory = (category: string) => {
    if (!editingTransactionId) return;

    updateTransactionCategory(editingTransactionId, category);
    closeCategoryEditor();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: headerHeight + 18 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Search, filter, and understand your cash flow.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValue}>{formatDollarAmount(monthlySummary.income)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Spending</Text>
          <Text style={styles.summaryValue}>{formatDollarAmount(monthlySummary.spending)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text
            style={[
              styles.summaryValue,
              monthlySummary.net >= 0 ? styles.amountPositive : styles.amountNegative,
            ]}
          >
            {formatDollarAmount(monthlySummary.net)}
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.gray} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search transactions"
          placeholderTextColor={Colors.gray}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categoryOptions.map((category) => {
          const isActive = activeCategory === category.value;

          return (
            <TouchableOpacity
              key={category.value}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              onPress={() => setActiveCategory(category.value)}
            >
              <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Transactions</Text>
        <Text style={styles.sectionCaption}>{filteredTransactions.length} shown</Text>
      </View>

      <View style={styles.transactionCard}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={28} color={Colors.gray} />
            <Text style={styles.emptyTitle}>No matching activity</Text>
            <Text style={styles.emptyCopy}>Try a different search or category.</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <TouchableOpacity
                accessibilityLabel={`Edit category for ${transaction.title}`}
                style={styles.transactionIcon}
                onPress={() => openCategoryEditor(transaction.id, transaction.category)}
              >
                <Ionicons
                  name={getCategoryIcon(transaction.category)}
                  size={21}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionMeta}>
                  {formatTransactionCategoryLabel(transaction.category)} • {formatTransactionDate(transaction.date)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Edit category for ${transaction.title}`}
                style={styles.editCategoryButton}
                onPress={() => openCategoryEditor(transaction.id, transaction.category)}
              >
                <Text style={styles.editCategoryText}>Edit category</Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.amount >= 0 ? styles.amountPositive : styles.amountNegative,
                ]}
              >
                {formatDollarAmount(transaction.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

      <Modal
        transparent
        visible={Boolean(editingTransaction)}
        animationType="fade"
        onRequestClose={closeCategoryEditor}
      >
        <View style={styles.modalScrim}>
          <View style={styles.categoryEditor}>
            <Text style={styles.editorTitle}>Edit category</Text>
            <Text style={styles.editorSubtitle}>{editingTransaction?.title}</Text>
            <View style={styles.editorOptionGrid}>
              {DEFAULT_TRANSACTION_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.editorOption}
                  onPress={() => saveCategory(category)}
                >
                  <Text style={styles.editorOptionText}>
                    {formatTransactionCategoryLabel(category)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={categoryInput}
              onChangeText={setCategoryInput}
              placeholder="Custom category"
              placeholderTextColor={Colors.gray}
              style={styles.customCategoryInput}
            />
            <View style={styles.editorActions}>
              <TouchableOpacity style={styles.editorSecondaryButton} onPress={closeCategoryEditor}>
                <Text style={styles.editorSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editorPrimaryButton}
                onPress={() => saveCategory(categoryInput)}
              >
                <Text style={styles.editorPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 140,
  },
  header: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    color: Colors.dark,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryLabel: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryValue: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  searchBox: {
    marginHorizontal: 20,
    marginTop: 18,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark,
    fontSize: 16,
    padding: 0,
  },
  categoryRow: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sectionHeaderRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    color: Colors.dark,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCaption: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  transactionCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 10,
  },
  emptyState: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: Colors.dark,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCopy: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '800',
  },
  transactionMeta: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  editCategoryButton: {
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editCategoryText: {
    color: Colors.dark,
    fontSize: 11,
    fontWeight: '800',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  categoryEditor: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  editorTitle: {
    color: Colors.dark,
    fontSize: 20,
    fontWeight: '800',
  },
  editorSubtitle: {
    color: Colors.gray,
    fontSize: 13,
    fontWeight: '700',
  },
  editorOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editorOption: {
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editorOptionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  customCategoryInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    color: Colors.dark,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  editorSecondaryButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editorSecondaryText: {
    color: Colors.gray,
    fontSize: 14,
    fontWeight: '800',
  },
  editorPrimaryButton: {
    borderRadius: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editorPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  amountPositive: {
    color: '#0A8F5A',
  },
  amountNegative: {
    color: '#C24135',
  },
});

export default Activity;
