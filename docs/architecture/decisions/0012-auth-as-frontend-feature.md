# Auth As Frontend Feature

Auth route UI will move into `apps/frontend/src/features/auth`, with Expo Router files staying as thin wrappers. Clerk remains the auth provider boundary; we should not create a broad custom auth abstraction unless product behavior demands it.

This keeps route structure consistent while avoiding unnecessary wrapping around Clerk.
