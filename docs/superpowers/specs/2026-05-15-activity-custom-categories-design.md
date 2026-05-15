# Activity Custom Categories Design

## Purpose

Activity already makes transaction history searchable and filterable, but its categories are inferred. Users need a reliable way to correct those categories and create names that match their real spending patterns.

## Scope

This feature adds editable transaction categories with custom category names. It does not add budgets, category colors, category icons, recurring transaction detection, or bulk editing.

## User Experience

- The Activity screen keeps the default category filters: income, food, transport, shopping, crypto, and other.
- Custom category names appear in the filter row after they are assigned to at least one transaction.
- Each transaction row exposes a category edit action.
- Editing opens a small category picker with default category choices and a custom category text input.
- Saving updates the selected transaction in persisted balance state.
- Empty custom names save as `other`.

## Data Model

Categories are stored as normalized strings on each transaction.

- Default categories remain first-class strings.
- Custom names are trimmed, lowercased, and collapsed to single spaces before persistence.
- Display labels title-case stored category names.
- Legacy persisted transactions without categories continue to be backfilled through the balance store migration.

This keeps transaction persistence self-contained and avoids a separate category catalog until the app needs rename/delete semantics across many transactions.

## Components And Boundaries

- `Store/balance/transactionUtils.ts` owns category normalization, display labels, derived category lists, filtering, and default category metadata.
- `Store/balance/balanceStore.ts` owns the transaction category update action.
- `app/(authenticated)/(tabs)/activity.tsx` owns the category editing UI and calls the store action.
- Tests cover utility behavior and store-level persistence behavior without relying on visual snapshots.

## Error Handling And Reliability

- Invalid or blank category input normalizes to `other`.
- Unknown category strings render with a generic category icon.
- Filtering uses normalized category values so display casing does not affect results.
- Existing inferred categories remain valid after the migration.

## Testing

- Add utility tests for category normalization, display labels, custom category lists, and custom category filtering.
- Add balance store tests for updating one transaction category without changing unrelated transactions.
- Extend Activity wiring tests to verify the screen exposes category editing UI.
- Run `npx jest --runInBand --watchman=false` and `npx tsc --noEmit` before claiming completion.
