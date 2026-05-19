# Shared Package Contract Boundary

`packages/shared` will contain only cross-runtime contracts used by both frontend and backend: API result metadata, crypto API types, and runtime validators for data crossing the app boundary. Frontend-only formatting, UI helpers, backend provider logic, and feature-specific utilities should stay in their owning app or feature folder.

This keeps the shared package small and meaningful. Importing from `packages/shared` should signal that code is part of the frontend/backend contract, not merely convenient reuse.
