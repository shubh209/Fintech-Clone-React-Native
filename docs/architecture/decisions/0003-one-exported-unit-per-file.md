# One Exported Unit Per File

We will restructure product code around one primary exported unit per file: one screen, component, hook, validator, service function, or route handler. This keeps files easy to move, test, and reason about without forcing every tiny private helper into its own file, which would create noisy fragmentation.

Private helpers may stay in the same file only when they are trivial and exist solely to support that file's exported unit.

File names should describe the exported unit's job. Prefer names like `CryptoMarketScreen.tsx`, `CryptoAssetDetailScreen.tsx`, `getCryptoListingsApiUrl.ts`, `normalizeTickerPoints.ts`, `formatEuroPrice.ts`, `LoginScreen.tsx`, and `VerifyPhoneScreen.tsx`. Avoid vague names like `utils.ts`, `helpers.ts`, `Config.tsx`, or `Item.tsx`.
