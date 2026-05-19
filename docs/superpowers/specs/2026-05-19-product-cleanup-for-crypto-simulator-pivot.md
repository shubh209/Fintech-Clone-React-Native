# Product Cleanup For Crypto Simulator Pivot

## Status

Draft for review.

## Goal

Remove misleading fintech-clone surfaces before building the crypto market simulator. The app should keep only features with real behavior or clear near-term value.

## Product Direction

The app is pivoting from a broad fintech clone toward a crypto market simulator:

- Users simulate buying crypto on a past date.
- Users compare historical purchase value against current value.
- Future phases may show purchasing power for assets by region.

This cleanup does not build the simulator yet. It makes the current codebase easier to manipulate and test.

## Cleanup Scope

### Remove Misleading Home Actions

Remove `Exchange` from Home because it currently clears all transactions. A user-facing exchange action must not delete state.

Remove `More` from Home because its menu items only log to console:

- Statement
- Converter
- Background
- Add new account

Keep `Details` while Activity remains available.

Remove random `Add Money` until the simulator creation flow exists.

### Simplify Header

Remove non-functional header search and decorative stats/card icons. Keep a minimal account/avatar affordance only if it opens the real account modal. If it does not currently navigate, remove it too.

### Remove Fake Auth Options

Keep phone login/signup because Clerk phone auth is implemented.

Remove or disable email, Google, and Apple login buttons because their flows are not implemented.

### Simplify Account Modal

Keep working actions:

- edit name
- update profile image
- log out
- app icon selection, if stable

Remove fake rows:

- Account
- Learn
- Inbox

### Remove Static Widgets

Remove widgets with hardcoded values or no product purpose:

- Spent this month with static `1024€`
- Cashback `5%`
- Cards

The recent transaction widget can stay only if Home keeps transaction history visible. Preferred for cleanup: remove widget section entirely until simulator widgets are designed.

### Keep Useful Infrastructure

Do not remove:

- Clerk auth provider
- Cloudflare Worker backend
- crypto market API client
- crypto list/detail screens
- shared validators/contracts
- transaction repository/store yet
- Activity screen yet

Reason: transaction infrastructure may become simulator-history/portfolio-history scaffolding later, and crypto screens already support the pivot.

## Files Likely Touched

- `apps/frontend/app/(authenticated)/(tabs)/home.tsx`
- `apps/frontend/Components/ui/DropDown.tsx`
- `apps/frontend/Components/layout/CustomHeader.tsx`
- `apps/frontend/Components/sortable-list/WidgetList.tsx`
- `apps/frontend/Components/sortable-list/Tile.tsx`
- `apps/frontend/app/login.tsx`
- `apps/frontend/app/(authenticated)/(modals)/account.tsx`
- tests that reference removed UI labels

Delete files only when no imports remain.

## State Impact

After cleanup:

- no Home button should randomly create transactions.
- no Home button should clear all transactions under a misleading label.
- no visible button should only `console.log`.
- no visible login option should appear implemented if it is not.
- no visible widget should show static finance data as if real.

## Measurement

Before:

- Home has 3 action buttons plus More menu; 2 mutate or fake behavior.
- More menu has 4 fake options.
- Header has search plus 2 non-functional icon controls.
- Login has 3 unimplemented social/email options.
- Account modal has 3 fake rows.
- Widgets include 3 fake/static finance surfaces.

After:

- misleading actionable controls reduced to 0 in cleaned surfaces.
- remaining visible controls either navigate, call implemented behavior, or are removed.
- tests/grep confirm removed labels are gone where intended.

## Verification

Run:

```bash
npx jest --runInBand --watchman=false
npx tsc --noEmit
```

Also run targeted checks:

```bash
rg "Exchange|Statement|Converter|Background|Add new account|Continue with email|Cashback|1024€" apps/frontend
```

Expected: no customer-facing fake feature labels remain, except inside tests or docs if intentionally referenced.

## Out Of Scope

- building crypto simulator flow.
- redesigning navigation around simulator tabs.
- deleting backend transaction storage.
- changing crypto provider/data architecture.
- adding new APIs.

## Decision

`Add Money` will be removed for cleanup. New simulator flow should later introduce a new action such as `Create simulation`.
