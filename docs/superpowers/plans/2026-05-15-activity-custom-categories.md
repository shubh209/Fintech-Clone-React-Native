# Activity Custom Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users assign default or custom category names to Activity transactions, persist those updates, and filter by custom categories.

**Architecture:** Keep categories stored directly on persisted transactions as normalized strings. Put normalization, display labels, derived category options, and filtering in `Store/balance/transactionUtils.ts`; put mutation in `Store/balance/balanceStore.ts`; keep Activity UI state local to the tab screen.

**Tech Stack:** Expo Router, React Native, TypeScript, Zustand persist, Jest.

---

## File Structure

- Modify `Store/balance/transactionUtils.ts`: category type aliases, default category metadata, normalization helpers, display label helper, custom category derivation, filtering updates.
- Modify `Store/balance/transactionUtils.test.ts`: utility coverage for custom category normalization, labels, category derivation, and filtering.
- Create `Store/balance/balanceStore.test.ts`: store-level coverage for updating a single transaction category.
- Modify `Store/balance/balanceStore.ts`: add `updateTransactionCategory(transactionId, category)` to persist category edits.
- Modify `app/(authenticated)/(tabs)/activity.tsx`: derive category chips from transactions and add category editing UI.
- Modify `__tests__/activity-tab-wiring.test.ts`: source-level guard that Activity exposes category editing UI.
- Modify `README.md` and `docs/project-reference/project-overview.md`: note editable custom Activity categories.

## Task 1: Category Utilities

**Files:**
- Modify: `Store/balance/transactionUtils.test.ts`
- Modify: `Store/balance/transactionUtils.ts`

- [ ] **Step 1: Write failing utility tests**

Update the import in `Store/balance/transactionUtils.test.ts`:

```typescript
import {
  DEFAULT_TRANSACTION_CATEGORIES,
  filterTransactions,
  formatTransactionCategoryLabel,
  formatTransactionDate,
  getMonthlyTransactionSummary,
  getTransactionCategories,
  getTransactionsNewestFirst,
  inferTransactionCategory,
  normalizePersistedTransactions,
  normalizeTransaction,
  normalizeTransactionCategory,
} from './transactionUtils';
```

Add these tests inside `describe('transaction utils', () => { ... })`:

```typescript
  it('normalizes custom category names before persistence', () => {
    expect(normalizeTransactionCategory('  Weekend   Dining  ')).toBe('weekend dining');
    expect(normalizeTransactionCategory('')).toBe('other');
    expect(normalizeTransactionCategory('     ')).toBe('other');
  });

  it('formats category labels for default and custom names', () => {
    expect(formatTransactionCategoryLabel('food')).toBe('Food');
    expect(formatTransactionCategoryLabel('weekend dining')).toBe('Weekend Dining');
  });

  it('keeps default categories first and adds custom categories from transactions', () => {
    const categories = getTransactionCategories([
      {
        id: 'custom',
        amount: -80,
        title: 'Dinner',
        category: 'weekend dining',
        date: '2024-01-02T12:00:00.000Z',
      },
      {
        id: 'default',
        amount: -8,
        title: 'Coffee',
        category: 'food',
        date: '2024-01-03T12:00:00.000Z',
      },
    ]);

    expect(categories.slice(0, DEFAULT_TRANSACTION_CATEGORIES.length)).toEqual(
      DEFAULT_TRANSACTION_CATEGORIES
    );
    expect(categories).toContain('weekend dining');
  });

  it('filters transactions by normalized custom category names', () => {
    const transactions = [
      {
        id: 'custom',
        amount: -80,
        title: 'Dinner',
        category: 'weekend dining',
        date: '2024-01-02T12:00:00.000Z',
      },
      {
        id: 'food',
        amount: -8,
        title: 'Coffee',
        category: 'food',
        date: '2024-01-03T12:00:00.000Z',
      },
    ];

    expect(
      filterTransactions(transactions, { query: '', category: ' Weekend   Dining ' }).map(
        (transaction) => transaction.id
      )
    ).toEqual(['custom']);
  });
```

- [ ] **Step 2: Run utility tests to verify RED**

Run:

```bash
npx jest --runTestsByPath Store/balance/transactionUtils.test.ts --runInBand --watchman=false
```

Expected: FAIL because `normalizeTransactionCategory`, `formatTransactionCategoryLabel`, `getTransactionCategories`, and `DEFAULT_TRANSACTION_CATEGORIES` are not exported.

- [ ] **Step 3: Implement utility behavior**

In `Store/balance/transactionUtils.ts`, replace the fixed `TransactionCategory` union with default category metadata plus a string category type:

```typescript
export const DEFAULT_TRANSACTION_CATEGORIES = [
  'income',
  'food',
  'transport',
  'shopping',
  'crypto',
  'other',
] as const;

export type DefaultTransactionCategory = (typeof DEFAULT_TRANSACTION_CATEGORIES)[number];
export type TransactionCategory = DefaultTransactionCategory | (string & {});
```

Update `normalizeTransaction` and `normalizePersistedTransactions` so category values are normalized:

```typescript
export function normalizeTransaction(transaction: TransactionInput): PersistedTransaction {
  return {
    ...transaction,
    date: new Date(transaction.date).toISOString(),
    category: normalizeTransactionCategory(
      transaction.category ?? inferTransactionCategory(transaction)
    ),
  };
}

export function normalizePersistedTransactions(
  transactions: Array<Omit<PersistedTransaction, 'category'> & Partial<Pick<PersistedTransaction, 'category'>>>
): PersistedTransaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: normalizeTransactionCategory(
      transaction.category ?? inferTransactionCategory(transaction)
    ),
  }));
}
```

Add these helpers below `inferTransactionCategory`:

```typescript
export function normalizeTransactionCategory(category: string): TransactionCategory {
  const normalized = category.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : 'other';
}

export function formatTransactionCategoryLabel(category: string) {
  return normalizeTransactionCategory(category)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getTransactionCategories<T extends Pick<PersistedTransaction, 'category'>>(
  transactions: T[]
) {
  const categories = new Set<TransactionCategory>(DEFAULT_TRANSACTION_CATEGORIES);

  transactions.forEach((transaction) => {
    categories.add(normalizeTransactionCategory(transaction.category));
  });

  return Array.from(categories);
}
```

Update `filterTransactions` to normalize selected categories:

```typescript
export function filterTransactions<T extends PersistedTransaction>(
  transactions: T[],
  {
    query,
    category,
  }: {
    query: string;
    category: TransactionCategory | 'all';
  }
) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedCategory = category === 'all' ? 'all' : normalizeTransactionCategory(category);

  return transactions.filter((transaction) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      transaction.title.toLowerCase().includes(normalizedQuery) ||
      transaction.amount.toString().includes(normalizedQuery);
    const matchesCategory =
      normalizedCategory === 'all' ||
      normalizeTransactionCategory(transaction.category) === normalizedCategory;

    return matchesQuery && matchesCategory;
  });
}
```

- [ ] **Step 4: Run utility tests to verify GREEN**

Run:

```bash
npx jest --runTestsByPath Store/balance/transactionUtils.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 5: Commit utilities**

Run:

```bash
git add Store/balance/transactionUtils.ts Store/balance/transactionUtils.test.ts
git commit -m "Add custom transaction category utilities"
```

## Task 2: Persist Category Updates In The Balance Store

**Files:**
- Create: `Store/balance/balanceStore.test.ts`
- Modify: `Store/balance/balanceStore.ts`

- [ ] **Step 1: Write failing store tests**

Create `Store/balance/balanceStore.test.ts`:

```typescript
import { MMKV } from 'react-native-mmkv';
import { useBalanceStore } from './balanceStore';

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(),
}));

describe('balance store', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const MockedMMKV = MMKV as any;

    MockedMMKV.mockImplementation(() => ({
      getString: (key: string) => values.get(key),
      set: (key: string, value: string) => {
        values.set(key, value);
      },
      delete: (key: string) => {
        values.delete(key);
      },
    }));

    useBalanceStore.setState({ transactions: [] });
  });

  it('updates one transaction category with normalized custom names', () => {
    const store = useBalanceStore.getState();

    store.runTransaction({
      id: 'tx-1',
      amount: -28,
      title: 'Dinner',
      date: '2024-01-02T12:00:00.000Z',
    });
    store.runTransaction({
      id: 'tx-2',
      amount: -8,
      title: 'Coffee',
      date: '2024-01-03T12:00:00.000Z',
    });

    useBalanceStore.getState().updateTransactionCategory('tx-1', ' Weekend   Dining ');

    expect(useBalanceStore.getState().transactions).toEqual([
      {
        id: 'tx-1',
        amount: -28,
        title: 'Dinner',
        date: '2024-01-02T12:00:00.000Z',
        category: 'weekend dining',
      },
      {
        id: 'tx-2',
        amount: -8,
        title: 'Coffee',
        date: '2024-01-03T12:00:00.000Z',
        category: 'food',
      },
    ]);
  });

  it('falls back to other for blank category updates', () => {
    useBalanceStore.getState().runTransaction({
      id: 'tx-1',
      amount: -28,
      title: 'Dinner',
      date: '2024-01-02T12:00:00.000Z',
    });

    useBalanceStore.getState().updateTransactionCategory('tx-1', '   ');

    expect(useBalanceStore.getState().transactions[0].category).toBe('other');
  });
});
```

- [ ] **Step 2: Run store tests to verify RED**

Run:

```bash
npx jest --runTestsByPath Store/balance/balanceStore.test.ts --runInBand --watchman=false
```

Expected: FAIL because `updateTransactionCategory` does not exist on `BalanceState`.

- [ ] **Step 3: Implement the store action**

In `Store/balance/balanceStore.ts`, update the import:

```typescript
import {
    normalizeTransaction,
    normalizePersistedTransactions,
    normalizeTransactionCategory,
    PersistedTransaction,
    TransactionInput,
} from "./transactionUtils";
```

Update `BalanceState`:

```typescript
export interface BalanceState{
    transactions:  Array<Transaction>;
    runTransaction: (transaction: TransactionInput) => void;
    updateTransactionCategory: (transactionId: string, category: string) => void;
    balance: () => number;
    clearTansactions: () => void;
}
```

Add the action after `runTransaction`:

```typescript
            updateTransactionCategory: (transactionId: string, category: string) => {
                set((state) => ({
                    transactions: state.transactions.map((transaction) =>
                        transaction.id === transactionId
                            ? {
                                ...transaction,
                                category: normalizeTransactionCategory(category),
                            }
                            : transaction
                    ),
                }));
            },
```

- [ ] **Step 4: Run store tests to verify GREEN**

Run:

```bash
npx jest --runTestsByPath Store/balance/balanceStore.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 5: Commit store action**

Run:

```bash
git add Store/balance/balanceStore.ts Store/balance/balanceStore.test.ts
git commit -m "Persist activity category edits"
```

## Task 3: Activity Category Editing UI

**Files:**
- Modify: `app/(authenticated)/(tabs)/activity.tsx`
- Modify: `__tests__/activity-tab-wiring.test.ts`

- [ ] **Step 1: Write failing wiring test**

Add this test to `__tests__/activity-tab-wiring.test.ts`:

```typescript
  it('activity screen exposes category editing controls', () => {
    const activitySource = readFileSync(
      join(process.cwd(), 'app/(authenticated)/(tabs)/activity.tsx'),
      'utf8'
    );

    expect(activitySource.includes('Edit category')).toBe(true);
    expect(activitySource.includes('Custom category')).toBe(true);
    expect(activitySource.includes('updateTransactionCategory')).toBe(true);
    expect(activitySource.includes('getTransactionCategories')).toBe(true);
  });
```

- [ ] **Step 2: Run wiring test to verify RED**

Run:

```bash
npx jest --runTestsByPath __tests__/activity-tab-wiring.test.ts --runInBand --watchman=false
```

Expected: FAIL because Activity does not yet include category editing controls.

- [ ] **Step 3: Implement Activity editing imports and constants**

In `app/(authenticated)/(tabs)/activity.tsx`, include `Modal` in the React Native import:

```typescript
  Modal,
```

Update the transaction utility import:

```typescript
  DEFAULT_TRANSACTION_CATEGORIES,
  DefaultTransactionCategory,
  filterTransactions,
  formatTransactionCategoryLabel,
  formatTransactionDate,
  getMonthlyTransactionSummary,
  getTransactionCategories,
  getTransactionsNewestFirst,
  TransactionCategory,
```

Replace the local `categories` constant with dynamic category options inside the component:

```typescript
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
```

- [ ] **Step 4: Implement Activity editing state and handlers**

Inside `Activity`, replace the store destructuring and add local editor state:

```typescript
  const { transactions, updateTransactionCategory } = useBalanceStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TransactionCategory | 'all'>('all');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
```

Add derived category options and editor helpers after `monthlySummary`:

```typescript
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
```

- [ ] **Step 5: Render dynamic chips and row edit buttons**

Replace `{categories.map(...)}` with:

```typescript
        {categoryOptions.map((category) => {
```

Replace the row icon block with:

```typescript
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
```

Replace the metadata label with:

```typescript
                  {formatTransactionCategoryLabel(transaction.category)} • {formatTransactionDate(transaction.date)}
```

Add a compact edit button before the transaction amount:

```typescript
              <TouchableOpacity
                accessibilityLabel={`Edit category for ${transaction.title}`}
                style={styles.editCategoryButton}
                onPress={() => openCategoryEditor(transaction.id, transaction.category)}
              >
                <Text style={styles.editCategoryText}>Edit category</Text>
              </TouchableOpacity>
```

- [ ] **Step 6: Render the category editor modal**

Place this modal before the closing `</ScrollView>`:

```typescript
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
```

- [ ] **Step 7: Add Activity editor styles**

Add these styles to `StyleSheet.create`:

```typescript
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
```

- [ ] **Step 8: Run wiring test to verify GREEN**

Run:

```bash
npx jest --runTestsByPath __tests__/activity-tab-wiring.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 9: Commit UI**

Run:

```bash
git add 'app/(authenticated)/(tabs)/activity.tsx' __tests__/activity-tab-wiring.test.ts
git commit -m "Add activity category editor"
```

## Task 4: Documentation And Full Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/project-reference/project-overview.md`

- [ ] **Step 1: Update README**

In `README.md`, change the Activity bullet to:

```markdown
- Activity provides searchable/filterable transaction history, editable category labels including custom names, and monthly totals.
```

- [ ] **Step 2: Update project overview**

In `docs/project-reference/project-overview.md`, add this note under current implementation notes:

```markdown
- Activity category labels can be corrected with custom names that are normalized and stored on the transaction.
```

- [ ] **Step 3: Run focused Activity and store tests**

Run:

```bash
npx jest --runTestsByPath Store/balance/transactionUtils.test.ts Store/balance/balanceStore.test.ts __tests__/activity-tab-wiring.test.ts --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 4: Run full Jest suite**

Run:

```bash
npx jest --runInBand --watchman=false
```

Expected: PASS.

- [ ] **Step 5: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 6: Run diff whitespace check**

Run:

```bash
git diff --check
```

Expected: exit code `0`.

- [ ] **Step 7: Commit docs and verification-complete implementation**

Run:

```bash
git add README.md docs/project-reference/project-overview.md
git commit -m "Document editable activity categories"
```

If implementation files are still uncommitted after Task 4 verification, stage and commit them with:

```bash
git add Store/balance/transactionUtils.ts Store/balance/transactionUtils.test.ts Store/balance/balanceStore.ts Store/balance/balanceStore.test.ts 'app/(authenticated)/(tabs)/activity.tsx' __tests__/activity-tab-wiring.test.ts README.md docs/project-reference/project-overview.md
git commit -m "Add editable activity custom categories"
```
