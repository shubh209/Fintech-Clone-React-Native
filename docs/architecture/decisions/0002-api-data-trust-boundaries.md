# ADR 0002: API Data Trust Boundaries

## Status

Accepted

## Context

Finance users need to know whether data is live, stale, fallback, or unavailable. The app currently relies on local Expo Router API handlers for crypto data and can fall back to local fixtures.

## Decision

API-backed features must expose:

- source: `live` or `fallback`
- provider name when known
- `updatedAt` timestamp when available
- user-visible loading, retry, error, and fallback states
- runtime validation before rendering external payloads

Screens should not rely on raw provider response shapes when a focused normalizer can make the contract explicit.

## Consequences

- API route tests should cover live success and fallback paths.
- UI tests should guard against hiding stale/fallback data.
- Docs must explain which data is live and which data is fixture-backed.
