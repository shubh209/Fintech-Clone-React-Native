# Thin Expo Router Routes

Expo Router route files will stay thin and delegate to feature-owned screens. Product UI, hooks, API calls, state derivation, validation, and tests should live under feature/domain folders rather than inside `apps/frontend/app`.

This keeps file-based routing from becoming the app architecture. Routes describe navigation locations; features own product behavior.
