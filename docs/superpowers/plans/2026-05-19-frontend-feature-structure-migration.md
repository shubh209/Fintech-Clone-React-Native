# Frontend Feature Structure Migration

## Goal

Restructure the frontend so product code is easier to find, test, and change while the app pivots into a crypto market simulator.

This first migration is frontend-only. Backend domain restructuring and deeper shared package cleanup are documented but out of scope for this PR.

## Agreed Rules

- Use feature/domain folders for frontend product code.
- Keep Expo Router route files thin.
- Use one primary exported unit per file.
- Use descriptive camelCase source filenames.
- Avoid barrel files.
- Co-locate tests beside the unit they verify.
- Features may import shared code, but should not import other features directly.
- `packages/shared` remains limited to cross-runtime contracts.

## Target Scope

Migrate crypto market and obvious shared frontend basics.

Move crypto market code into:

```text
apps/frontend/src/features/crypto-market/
  api/
  chart/
  screens/
  types/
```

Move shared frontend code into:

```text
apps/frontend/src/shared/
  api/
  formatting/
  metrics/
  theme/
  ui/
```

Keep assets in:

```text
apps/frontend/assets/
```

## File Moves

### Route Wrappers

- `apps/frontend/app/(authenticated)/(tabs)/crypto.tsx`
  - keep as thin wrapper to `cryptoMarketScreen`
- `apps/frontend/app/(authenticated)/crypto/[id].tsx`
  - keep as thin wrapper to `cryptoAssetDetailScreen`

### Crypto Market Feature

- Move crypto list screen logic to:
  - `apps/frontend/src/features/crypto-market/screens/cryptoMarketScreen.tsx`
- Move crypto detail screen logic to:
  - `apps/frontend/src/features/crypto-market/screens/cryptoAssetDetailScreen.tsx`
- Move crypto API URL helper to:
  - `apps/frontend/src/features/crypto-market/api/getCryptoApiUrl.ts`
- Move ticker normalization to:
  - `apps/frontend/src/features/crypto-market/chart/normalizeTickerPoints.ts`
- Move crypto market type group to:
  - `apps/frontend/src/features/crypto-market/types/cryptoMarketTypes.ts`

### Shared Frontend

- Move `apps/frontend/Components/layout/CustomHeader.tsx` to:
  - `apps/frontend/src/shared/ui/customHeader.tsx`
- Move `apps/frontend/constants/Colors.ts` to:
  - `apps/frontend/src/shared/theme/colors.ts`
- Move `apps/frontend/constants/Styles.ts` to:
  - `apps/frontend/src/shared/theme/defaultStyles.ts`
- Move `apps/frontend/utils/currency.ts` to:
  - `apps/frontend/src/shared/formatting/formatEuroPrice.ts`
- Move `apps/frontend/utils/metrics.ts` to:
  - `apps/frontend/src/shared/metrics/metrics.ts`
- Move `apps/frontend/utils/apiResult.ts` to:
  - `apps/frontend/src/shared/api/apiResult.ts`
- Move `apps/frontend/utils/cryptoValidators.ts` to:
  - `apps/frontend/src/shared/api/cryptoValidators.ts`

## Test Moves

Co-locate these tests:

- `apps/frontend/utils/currency.test.ts`
  - beside `formatEuroPrice.ts`
- `apps/frontend/utils/metrics.test.ts`
  - beside `metrics.ts`
- `apps/frontend/utils/apiResult.test.ts`
  - beside `apiResult.ts`
- `apps/frontend/utils/cryptoValidators.test.ts`
  - beside `cryptoValidators.ts`
- `apps/frontend/utils/tickers.test.ts`
  - beside `normalizeTickerPoints.ts`
- crypto API wiring tests
  - beside the crypto market API/screen area they verify

Keep cross-cutting structure tests in:

```text
tests/
```

## TypeScript Alias Changes

Update `tsconfig.json`:

```json
"paths": {
  "@/*": ["./apps/frontend/src/*"],
  "@assets/*": ["./apps/frontend/assets/*"],
  "@shared/*": ["./packages/shared/src/*"]
}
```

Update imports currently using old `@/constants`, `@/utils`, `@/interfaces`, and `@/Components` paths.

## Out Of Scope

- Moving auth screens into `src/features/auth`.
- Backend domain folder restructure.
- Adding lint-enforced import boundaries.
- Reworking UI design.
- Adding crypto simulation behavior.
- Changing Cloudflare Worker behavior.

## Verification

Run:

```bash
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/jest --runInBand --watchman=false
git diff --check
```

Expected result:

- TypeScript passes.
- Full Jest suite passes.
- No whitespace errors.
- Expo Router routes still resolve by exporting feature-owned screens.
