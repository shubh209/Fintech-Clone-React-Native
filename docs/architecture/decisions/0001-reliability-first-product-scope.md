# ADR 0001: Reliability-First Product Scope

## Status

Accepted

## Context

The app started as a fintech clone with several placeholder tabs. For a portfolio project, many shallow features make the project look less credible than fewer features with strong correctness, observability, and failure handling.

## Decision

The app will prioritize a small set of reliable finance workflows:

- account overview and transaction state
- activity and spending visibility
- live crypto market data with freshness and fallback states
- goals and responsible guidance
- profile/security/privacy controls

Placeholder tabs should be removed, renamed, or converted into real workflows before they are presented as product features.

## Consequences

- New features need tests and explicit failure states.
- UI polish is valuable only when the underlying data behavior is reliable.
- AI features must be explainable, scoped, and privacy-aware.
