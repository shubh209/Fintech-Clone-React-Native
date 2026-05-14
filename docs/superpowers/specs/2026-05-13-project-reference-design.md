# Project Reference System Design

**Date:** 2026-05-13
**Scope:** Documentation-only audit pass for `Fintech-Clone-React-Native`

## Goal

Create a durable, repo-local project reference system that lets future sessions recover context quickly, understand the app architecture, and pick up known bugs without re-auditing the entire codebase.

This pass does not change runtime behavior. It focuses on creating documentation, issue tracking notes, and agent guidance that future sessions can rely on before attempting fixes.

## Why This Is Needed

The current repository has useful code but weak project memory:

- The README is generic and does not describe the actual app structure.
- There is no single source of truth for architecture, data flow, or environment setup.
- Known bugs such as Zustand persistence issues and broken crypto data flow are not documented in a durable place.
- Future sessions would need to rediscover key implementation details such as Expo Router API usage, Clerk auth flow, and MMKV persistence behavior.

## Proposed Structure

The reference system will use a lightweight docs hub plus root-level agent guidance:

- `AGENTS.md`
  - Short entrypoint for future coding sessions.
  - Points to the project reference docs first.
  - Lists repo conventions, risky areas, and how to approach this codebase.
- `docs/project-reference/README.md`
  - Index page for all project-reference docs.
- `docs/project-reference/project-overview.md`
  - What the app is, current feature set, and major dependencies.
- `docs/project-reference/architecture.md`
  - Route layout, state/storage architecture, auth flow, API/data flow, and notable platform assumptions.
- `docs/project-reference/issues.md`
  - Consolidated issue ledger with severity, symptoms, suspected causes, and affected files.
- `docs/project-reference/troubleshooting.md`
  - Practical notes for common failure areas such as crypto fetches, Expo Router API routes, Clerk env setup, and Zustand/MMKV persistence.
- `docs/project-reference/session-checklist.md`
  - Fast-start checklist for future sessions.
- `docs/project-reference/SKILLS.md`
  - Project-specific workflow guidance for future agents. This is not a Codex-installed skill bundle; it is a repo-local instruction document describing how to navigate and modify this project safely.

## Content Design

### 1. Project Overview

This document should answer:

- What kind of app this is
- Which app areas are real versus placeholder
- Which libraries matter most
- Which environments are implied by the code

It should explicitly call out:

- Expo SDK 54 + Expo Router app
- Clerk authentication
- Zustand + MMKV persistence
- React Query for crypto data fetching
- Native and web server assumptions from Expo Router API routes

### 2. Architecture Map

This document should cover:

- File/folder layout and why it matters
- App navigation shape:
  - public routes
  - authenticated tab group
  - authenticated modal routes
  - crypto detail route
- Data flow:
  - local UI state
  - persisted balance store
  - auth session state
  - crypto data fetched from local `+api` handlers
- Notable inconsistencies:
  - mixed directory casing (`Components`, `Store`, `app`)
  - local API routes serving as a proxy layer
  - placeholder tabs versus implemented screens

### 3. Issue Ledger

This document should be the main durable bug inventory for future sessions.

Each issue entry should include:

- Title
- Severity
- Current symptom
- Likely cause
- Affected files
- Suggested next step

It should include at minimum:

- Zustand persistence/date rehydration issue
- `transactions.reverse()` mutating persisted state during render
- custom Zustand MMKV storage contract mismatch risk
- crypto API routes depending on brittle server/origin configuration
- wrong Expo Router `origin` value in `app.json`
- crypto UI showing EUR data with `$` labels
- crypto routes currently mixing live-fetch intent with static stubbed responses
- placeholder tabs (`invest`, `transfer`, `lifestyle`) with no real implementation
- generic README not matching real app state
- root query client has no retry/error strategy documentation

### 4. Troubleshooting Guide

This document should focus on operational reasoning:

- How Expo Router API routes are expected to work in this repo
- Why native relative fetches may fail depending on deployment/origin
- Why CoinMarketCap/CoinPaprika integration may be broken even if static fallback data exists
- Why Zustand persisted objects should avoid raw `Date` assumptions
- How to validate Clerk env configuration

### 5. Session Checklist

This document should make future sessions faster by giving them a fixed opening routine:

1. Read `AGENTS.md`
2. Read `docs/project-reference/README.md`
3. Read `issues.md` before changing data or auth code
4. Verify env assumptions in `.env`, `app.json`, and `app/_layout.tsx`
5. Verify whether the task is docs-only, audit, or runtime-fix work

### 6. Repo-Local SKILLS Guide

This document should act as a project operating guide for future agents:

- where to start for auth work
- where to start for storage work
- where to start for crypto/API work
- what to avoid changing casually
- which files are high-risk

This is intentionally a markdown guide, not a plugin bundle, to keep maintenance low.

## Approach Alternatives Considered

### Option A: Docs hub only

Pros:

- Simple
- Easy to maintain
- Low repo overhead

Cons:

- Weaker entrypoint for future agents
- Easier for sessions to miss important docs

### Option B: Docs hub + `AGENTS.md` + repo-local skills guide

Pros:

- Clear onboarding path
- Durable and low-maintenance
- Best balance of structure and practicality

Cons:

- Slightly more upfront setup

### Option C: Full plugin-style scaffold

Pros:

- Highly extensible
- Strong formalization

Cons:

- Overkill for this project
- Adds maintenance burden without proportional value right now

**Recommended option:** Option B.

## File Creation Plan

The implementation should create only documentation and guidance files. No runtime code should be modified in this pass unless a typo in a new doc needs correction.

Expected new files:

- `AGENTS.md`
- `docs/project-reference/README.md`
- `docs/project-reference/project-overview.md`
- `docs/project-reference/architecture.md`
- `docs/project-reference/issues.md`
- `docs/project-reference/troubleshooting.md`
- `docs/project-reference/session-checklist.md`
- `docs/project-reference/SKILLS.md`

## Testing Strategy

Because this is a docs-only pass, testing is limited to validation that:

- all referenced files exist
- references are internally consistent
- issue descriptions match the current codebase
- no runtime source files are changed

## Risks And Boundaries

- The issue ledger must clearly separate confirmed issues from likely issues.
- The docs should avoid pretending that the crypto flow is fully live if the current implementation uses hardcoded fallback data.
- The docs should not over-prescribe architecture changes during an audit-only pass.
- The structure should remain lightweight so the repo does not become documentation-heavy without clear value.

## Success Criteria

This design is successful if a future session can:

- understand the project structure within a few minutes
- find the known Zustand and crypto problems quickly
- identify which screens are implemented versus placeholder
- understand where auth, persistence, and crypto data enter the app
- begin a targeted fix pass without repeating this full audit
