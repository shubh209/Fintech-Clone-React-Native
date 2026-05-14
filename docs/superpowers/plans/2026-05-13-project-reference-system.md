# Project Reference System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repo-local documentation hub and agent guidance system that preserves project context, architecture, and known issues for future sessions.

**Architecture:** Add a lightweight root `AGENTS.md` entrypoint and a `docs/project-reference/` hub with focused documents for overview, architecture, issues, troubleshooting, and session startup. Keep the implementation documentation-only, grounded in the current codebase, and explicit about confirmed versus likely issues.

**Tech Stack:** Markdown docs, existing Expo Router/React Native codebase context, git workspace audit

---

### Task 1: Re-audit the current codebase inputs for documentation accuracy

**Files:**
- Review: `README.md`
- Review: `app/_layout.tsx`
- Review: `app/(authenticated)/(tabs)/home.tsx`
- Review: `app/(authenticated)/(tabs)/crypto.tsx`
- Review: `app/(authenticated)/crypto/[id].tsx`
- Review: `app/api/listings+api.ts`
- Review: `app/api/info+api.ts`
- Review: `app/api/tickers+api.ts`
- Review: `Store/balance/balanceStore.ts`
- Review: `Store/storage/mmkv-storage.ts`
- Review: `context/UserInactivity.tsx`
- Review: `package.json`
- Review: `app.json`

- [ ] **Step 1: Confirm the source files that define architecture and known issues**

Run:
```bash
rg -n "fetch\\('/api|fetch\\(`/api|persist\\(|createJSONStorage|MMKV|reverse\\(|toLocaleDateString\\(|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY|origin|QueryClient" app Store context package.json app.json
```

Expected: Matches across the auth, storage, and crypto files that the docs will reference.

- [ ] **Step 2: Re-read the relevant files to avoid stale assumptions**

Run:
```bash
sed -n '1,220p' app/_layout.tsx
sed -n '1,220p' Store/balance/balanceStore.ts
sed -n '1,220p' Store/storage/mmkv-storage.ts
```

Expected: Current implementations match the issues and architecture captured in the design spec.

- [ ] **Step 3: Record the exact documentation scope**

Write this scope into the working notes for execution:

```text
Create AGENTS.md plus docs/project-reference/{README,project-overview,architecture,issues,troubleshooting,session-checklist,SKILLS}. Do not modify runtime code. Keep issue statements clearly marked as confirmed or likely.
```

- [ ] **Step 4: Verify no runtime edits are required for this pass**

Run:
```bash
git status --short
```

Expected: Either clean working tree or only documentation changes from this session after implementation begins.

- [ ] **Step 5: Commit checkpoint is not required yet**

```bash
# No commit in this task; proceed to doc creation once the audit is confirmed.
```

### Task 2: Create the root agent entrypoint and docs index

**Files:**
- Create: `AGENTS.md`
- Create: `docs/project-reference/README.md`

- [ ] **Step 1: Write `AGENTS.md` with the repo-first guidance**

Add this content:

```md
# AGENTS.md

## Start Here

This repository is an Expo Router fintech clone with Clerk auth, Zustand + MMKV persistence, and local Expo Router API handlers for crypto data.

Before making changes:

1. Read `docs/project-reference/README.md`
2. Read `docs/project-reference/issues.md`
3. Check `app.json`, `.env`, and `app/_layout.tsx` for environment assumptions
4. Treat `Store/`, `app/api/`, and auth routes as high-risk areas

## High-Risk Areas

- `Store/balance/balanceStore.ts`
- `Store/storage/mmkv-storage.ts`
- `app/api/listings+api.ts`
- `app/api/info+api.ts`
- `app/api/tickers+api.ts`
- `app/(authenticated)/(tabs)/crypto.tsx`
- `app/(authenticated)/crypto/[id].tsx`
- `app/_layout.tsx`

## Project Notes

- The repo uses mixed directory casing such as `Components`, `Store`, and `app`.
- Several tabs are placeholders and should not be described as complete features.
- Crypto data flow is partially stubbed and has known integration risks.
- Persisted transaction dates need careful handling because serialized state does not preserve `Date` objects.
```

- [ ] **Step 2: Write the docs hub index**

Add this content:

```md
# Project Reference

This folder is the durable context hub for `Fintech-Clone-React-Native`.

## Read In This Order

1. `project-overview.md`
2. `architecture.md`
3. `issues.md`
4. `troubleshooting.md`
5. `session-checklist.md`
6. `SKILLS.md`

## Purpose

These docs are meant to let future sessions recover context quickly without re-auditing the whole repo.
```

- [ ] **Step 3: Verify the files exist and are readable**

Run:
```bash
sed -n '1,220p' AGENTS.md
sed -n '1,220p' docs/project-reference/README.md
```

Expected: Both files render with the intended startup guidance.

- [ ] **Step 4: Commit checkpoint is not required yet**

```bash
# No commit in this task; proceed to the detailed reference docs.
```

### Task 3: Write the core reference documents

**Files:**
- Create: `docs/project-reference/project-overview.md`
- Create: `docs/project-reference/architecture.md`
- Create: `docs/project-reference/session-checklist.md`
- Create: `docs/project-reference/SKILLS.md`

- [ ] **Step 1: Write the project overview**

Add content describing:

```md
# Project Overview

## Summary

`Fintech-Clone-React-Native` is an Expo Router React Native app that imitates a consumer fintech experience with phone-based auth, a home dashboard, transaction state, and crypto market screens.

## Current Feature State

- Public auth routes exist for signup, login, help, and phone verification.
- Authenticated tabs exist for home, invest, transfer, crypto, and lifestyle.
- Home and crypto have meaningful implementations.
- Invest, transfer, and lifestyle are currently placeholders.

## Key Libraries

- `expo` / `expo-router`
- `@clerk/clerk-expo`
- `zustand`
- `react-native-mmkv`
- `@tanstack/react-query`
- `victory-native`

## Important Constraints

- Crypto data currently depends on local `app/api/*+api.ts` handlers.
- Some crypto endpoints are stubbed with hardcoded data despite live API scaffolding being present.
- State persistence serializes data and may change runtime object shapes during rehydration.
```

- [ ] **Step 2: Write the architecture map**

Add content describing:

```md
# Architecture

## Routing

- `app/index.tsx` is the landing route.
- `app/login.tsx`, `app/signup.tsx`, `app/help.tsx`, and `app/verify/[phone].tsx` are public auth flows.
- `app/(authenticated)/(tabs)` contains the main signed-in tab shell.
- `app/(authenticated)/(modals)` contains lock/account modal flows.
- `app/(authenticated)/crypto/[id].tsx` is the crypto detail screen.

## State And Persistence

- Clerk auth state is provided from `app/_layout.tsx`.
- React Query is initialized globally in `app/_layout.tsx`.
- Transaction state is held in `Store/balance/balanceStore.ts`.
- The balance store persists through MMKV via `Store/storage/mmkv-storage.ts`.
- Inactivity lock state uses its own MMKV instance in `context/UserInactivity.tsx`.

## Crypto Data Flow

- `app/(authenticated)/(tabs)/crypto.tsx` fetches listings and logo/info metadata.
- `app/(authenticated)/crypto/[id].tsx` fetches detail metadata and chart ticker data.
- The fetch targets are local API routes:
  - `app/api/listings+api.ts`
  - `app/api/info+api.ts`
  - `app/api/tickers+api.ts`
- These routes currently contain live-fetch intent plus static fallback/stub data.

## Structural Notes

- The repo mixes `Components/`, `Store/`, and `app/` casing styles.
- The root README is generic and does not fully reflect the actual project.
- Some product areas are presentation-only and not backed by business logic yet.
```

- [ ] **Step 3: Write the session checklist**

Add content:

```md
# Session Checklist

1. Read `AGENTS.md`.
2. Read `docs/project-reference/README.md`.
3. Read `docs/project-reference/issues.md` before editing auth, storage, or crypto code.
4. Check `.env`, `app.json`, and `app/_layout.tsx` for environment assumptions.
5. Confirm whether the task is docs-only, audit-only, or runtime-fix work.
6. If touching persisted data, verify serialization and rehydration behavior first.
7. If touching crypto, verify whether the intended source of truth is live APIs or stubbed local responses.
```

- [ ] **Step 4: Write the repo-local skills guide**

Add content:

```md
# Project Skills Guide

## When Working On Auth

- Start with `app/_layout.tsx`, `app/login.tsx`, `app/signup.tsx`, and `app/verify/[phone].tsx`.
- Verify Clerk env keys before debugging UI logic.

## When Working On Storage

- Start with `Store/balance/balanceStore.ts` and `Store/storage/mmkv-storage.ts`.
- Assume serialized values may not rehydrate to their original runtime types.
- Avoid mutating arrays sourced from the Zustand store during render.

## When Working On Crypto

- Start with `app/(authenticated)/(tabs)/crypto.tsx` and `app/(authenticated)/crypto/[id].tsx`.
- Then inspect `app/api/listings+api.ts`, `app/api/info+api.ts`, and `app/api/tickers+api.ts`.
- Confirm whether fetch behavior is expected to work on native, web, or both before changing transport code.

## High-Risk Assumptions

- Relative `/api/...` fetches may depend on Expo Router server/origin behavior.
- `app.json` origin settings can affect API resolution.
- Static API fallback data can mask live integration failures.
```

- [ ] **Step 5: Verify the reference docs render cleanly**

Run:
```bash
sed -n '1,260p' docs/project-reference/project-overview.md
sed -n '1,320p' docs/project-reference/architecture.md
```

Expected: The new docs match the current codebase and avoid unsupported claims.

### Task 4: Write the issue ledger and troubleshooting guide

**Files:**
- Create: `docs/project-reference/issues.md`
- Create: `docs/project-reference/troubleshooting.md`

- [ ] **Step 1: Write the issue ledger with confirmed vs likely labels**

Add content:

```md
# Issues Ledger

## Confirmed Issues

### 1. Persisted transaction dates can rehydrate as strings
- Severity: High
- Symptom: `toLocaleDateString()` is called on `transaction.date` in `app/(authenticated)/(tabs)/home.tsx`.
- Likely cause: Zustand persistence serializes values, so `Date` instances are not preserved automatically.
- Affected files: `Store/balance/balanceStore.ts`, `Store/storage/mmkv-storage.ts`, `app/(authenticated)/(tabs)/home.tsx`
- Next step: Introduce explicit serialization/deserialization or store timestamps instead of `Date` objects.

### 2. Transactions are mutated during render
- Severity: Medium
- Symptom: `transactions.reverse()` is called directly in render.
- Likely cause: In-place array mutation on store-backed state.
- Affected files: `app/(authenticated)/(tabs)/home.tsx`
- Next step: Render a copied array instead, such as a reversed clone.

### 3. Crypto screens show EUR prices with dollar labels
- Severity: Low
- Symptom: Crypto list rows render `$` while reading `quote.EUR.price`.
- Affected files: `app/(authenticated)/(tabs)/crypto.tsx`
- Next step: Align labels and formatting with the actual currency source.

### 4. Crypto data flow is partially stubbed
- Severity: Medium
- Symptom: API route files contain live-fetch scaffolding but return hardcoded data.
- Affected files: `app/api/listings+api.ts`, `app/api/info+api.ts`, `app/api/tickers+api.ts`
- Next step: Decide whether the app should use live upstream data, local mock data, or an explicit environment switch.

### 5. Several tabs are placeholders
- Severity: Low
- Symptom: Invest, transfer, and lifestyle screens are minimal placeholder views.
- Affected files: `app/(authenticated)/(tabs)/invest.tsx`, `app/(authenticated)/(tabs)/transfer.tsx`, `app/(authenticated)/(tabs)/lifestyle.tsx`
- Next step: Treat these screens as incomplete during future planning and demos.

## Likely Issues Or Risk Areas

### 6. Custom Zustand MMKV storage may not match the expected JSON storage contract cleanly
- Severity: Medium
- Symptom: `zustandStorage.getItem()` parses JSON and `createJSONStorage()` also handles JSON semantics.
- Affected files: `Store/storage/mmkv-storage.ts`, `Store/balance/balanceStore.ts`
- Next step: Validate the adapter against the intended Zustand v5 storage contract before changing persisted state format.

### 7. Relative `/api/...` fetches may be fragile outside the expected Expo Router server context
- Severity: High
- Symptom: Native screens call `fetch('/api/...')` for crypto data.
- Affected files: `app/(authenticated)/(tabs)/crypto.tsx`, `app/(authenticated)/crypto/[id].tsx`
- Next step: Verify whether these routes are expected to run on web only, dev server only, or with a configured origin for native clients.

### 8. `app.json` contains a suspicious Expo Router `origin` value
- Severity: High
- Symptom: The `expo-router` plugin origin is set to `https://evanbacon.dev/`.
- Affected files: `app.json`
- Next step: Confirm whether this was intentional. If not, replace it during a runtime-fix pass with the app’s real API origin strategy.

### 9. Root README is too generic to onboard future sessions
- Severity: Low
- Symptom: `README.md` does not describe actual routes, data flow, or known issues.
- Affected files: `README.md`
- Next step: Update the README in a future docs pass if external-facing onboarding matters.
```

- [ ] **Step 2: Write the troubleshooting guide**

Add content:

```md
# Troubleshooting

## Crypto API Requests

If crypto screens fail to load:

1. Check whether the app is relying on local Expo Router API routes or should call an external endpoint directly.
2. Inspect `app/api/listings+api.ts`, `app/api/info+api.ts`, and `app/api/tickers+api.ts`.
3. Confirm whether the route returns stubbed data or live upstream data.
4. Check `app.json` for the Expo Router `origin` setting.
5. Verify that `.env` contains the expected crypto API key if live CoinMarketCap requests are enabled.

## Zustand + MMKV Persistence

If persisted transactions behave strangely:

1. Inspect `Store/balance/balanceStore.ts` and `Store/storage/mmkv-storage.ts`.
2. Assume `Date` objects will not survive persistence without explicit handling.
3. Check whether the custom storage adapter is duplicating JSON parsing/stringifying responsibilities.
4. Look for in-place mutations of store-backed arrays during render.

## Clerk Auth

If auth breaks:

1. Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the environment.
2. Check auth redirect logic in `app/_layout.tsx`.
3. Re-test phone auth flows through `login`, `signup`, and `verify/[phone]`.

## Navigation And Product Surface

If a screen appears missing:

- Confirm whether it is one of the placeholder tabs before treating it as a regression.
- Check whether the route exists but has only presentation scaffolding.
```

- [ ] **Step 3: Verify issue claims against the codebase**

Run:
```bash
rg -n "reverse\\(|toLocaleDateString\\(|quote\\.EUR|return Response\\.json\\(data\\)|origin|fetch\\('/api|createJSONStorage" app Store app.json
```

Expected: Every issue entry maps back to a real code location.

### Task 5: Validate the finished doc hub and summarize the workspace impact

**Files:**
- Review: `AGENTS.md`
- Review: `docs/project-reference/*.md`

- [ ] **Step 1: List the created docs**

Run:
```bash
find docs/project-reference -maxdepth 1 -type f | sort
```

Expected: The full documentation hub is present.

- [ ] **Step 2: Review the final diff**

Run:
```bash
git diff -- AGENTS.md docs/project-reference docs/superpowers/specs/2026-05-13-project-reference-design.md docs/superpowers/plans/2026-05-13-project-reference-system.md
```

Expected: Only documentation files are added or changed.

- [ ] **Step 3: Verify working tree scope**

Run:
```bash
git status --short
```

Expected: Only the intended documentation files appear as new or modified.

- [ ] **Step 4: Completion checkpoint**

Report:

```text
Created a durable documentation hub and root agent guidance for future sessions. No runtime code was modified in this pass.
```
