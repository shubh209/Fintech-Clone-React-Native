# Path Aliases For Feature Structure

We will use simple TypeScript path aliases as part of the restructure. Frontend product imports should use an app source alias for feature and shared frontend code, while cross-runtime contracts should use a separate shared package alias.

The existing `@/*` alias currently points at `apps/frontend/*`; during the restructure it should move to `apps/frontend/src/*` so route files can import feature-owned screens cleanly and avoid deep relative paths.
