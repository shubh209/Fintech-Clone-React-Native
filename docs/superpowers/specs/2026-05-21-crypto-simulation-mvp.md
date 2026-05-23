# Crypto Simulation MVP

## Status

Draft locked for first prototype scope.

## Goal

Build the first usable crypto market simulator workflow: a signed-in user can simulate a past crypto purchase and see what that hypothetical buy would be worth today.

This MVP is intentionally narrow. It proves the core simulation loop before adding portfolio views, purchasing-power comparisons, provider expansion, or real-money behavior.

## First User Story

As a signed-in user, I want to simulate a past crypto purchase so I can understand what a hypothetical investment would be worth today.

## V1 Scope

The user can:

- choose one supported crypto asset.
- enter a USD Simulation Input Amount.
- choose a Historical Buy Date from 2021-01-01 through the latest common imported historical date for BTC, ETH, and SOL.
- run the simulation.
- view a completed simulation result.
- save the completed result as a Saved Simulation.
- revisit saved simulations on the same prototype surface.

## Supported Assets

| Asset | Symbol | CoinMarketCap ID |
| --- | --- | --- |
| Bitcoin | BTC | 1 |
| Ethereum | ETH | 1027 |
| Solana | SOL | 5426 |

No other assets are supported in v1.

## Required Inputs

- Asset: one of BTC, ETH, or SOL.
- Historical Buy Date: 2021-01-01 through the latest common imported historical date for BTC, ETH, and SOL.
- Simulation Input Amount: positive USD amount.

V1 does not accept crypto quantity as an input. The system calculates implied quantity from the historical USD price.

## Completed Simulation Result

A simulation is complete when the user sees a valid result with:

- selected asset.
- historical buy date.
- USD input amount.
- historical USD price.
- current USD price.
- implied crypto quantity.
- current USD value.
- gain/loss in USD and percentage.
- data source/fallback status.

Saving is not required for completion. Saving is measured separately.

## Data Requirements

Simulation v1 must call the Cloudflare Worker for historical and current USD prices. Mobile screens must not own crypto data handlers or provider secrets.

The Worker may serve live provider data or curated fallback data for BTC, ETH, and SOL while the historical provider decision remains open. Every simulation response must expose Data Trust metadata:

- source: live or fallback.
- provider name when known.
- updatedAt timestamp when available.
- fallback reason when fallback data is used.

Current Crypto Market browsing already displays EUR prices in parts of the app. That display currency is outside this MVP except where implementation reuses existing market infrastructure behind the scenes. Simulation v1 is USD-only.

## Auth And Persistence

Simulation v1 is signed-in only. Public users can see the landing page and auth entry points, but they cannot create or save simulations.

Saved Simulations are hypothetical saved results. They are not trades, holdings, orders, transactions, bank records, or real portfolio entries. For the first prototype, saved simulations may be local/prototype persistence; cloud sync is not required.

## Explicitly Unsupported

V1 does not support:

- trading.
- real money movement.
- bank connections.
- brokerage or exchange connections.
- order placement.
- portfolio holdings.
- transaction history.
- crypto quantity input.
- assets outside BTC, ETH, and SOL.
- date ranges before 2021-01-01.
- simulation dates after the latest common imported historical date.
- purchasing-power comparisons.
- tax, fee, slippage, spread, or inflation modeling.
- financial advice or recommendations.

## Success Metrics

### Simulation Completion Rate

Definition: completed simulations divided by started simulations.

Started means the user begins the create-simulation flow. Completed means the user sees the completed simulation result defined above.

Candidate events:

- `crypto.simulation.started`
- `crypto.simulation.completed`
- `crypto.simulation.failed`

### API Success/Fallback Rate

Definition: successful simulation data responses split by live provider success and fallback success.

The metric must distinguish:

- live price response success.
- fallback price response success.
- failed price response.

Candidate events:

- `crypto.api.simulation_prices.upstream`
- `crypto.api.simulation_prices.fallback`
- `crypto.client.simulation_prices.fetch`

### Time To Completed Simulation

Definition: elapsed time from create-simulation flow start to completed simulation result render.

This measures whether the core workflow feels fast enough and whether API latency blocks the user.

Candidate event:

- `crypto.simulation.completed` with `durationMs`.

### Saved Simulation Count

Definition: count of successful Saved Simulation creations.

This is separate from completion rate because a user can complete a simulation without saving it.

Candidate event:

- `crypto.simulation.saved`

## Measurement Baseline

Before v1 implementation:

- simulation completion rate is not measured because the flow does not exist.
- simulation API success/fallback rate is not measured because historical simulation pricing does not exist.
- time to completed simulation is not measured because the flow does not exist.
- saved simulation count is not measured because Saved Simulations do not exist.

After v1 implementation:

- the four success metrics above must be emitted through the centralized frontend metrics layer and backend telemetry where applicable.
- metric event names must be added to `docs/project-reference/metrics.md`.
- tests must cover metric emission for completion, save, and API fallback behavior where code-owned.

## Definition Of Done

Anyone reading this spec should understand exactly what v1 does and does not do.

Implementation is not done until:

- signed-in users can complete the first user story end-to-end.
- BTC, ETH, and SOL are the only selectable assets.
- unsupported behavior is absent from UI copy, routes, and data contracts.
- completed results include all required result fields.
- saved simulations are clearly labeled as hypothetical.
- Data Trust metadata is visible or inspectable for simulation data.
- success metrics are instrumented and documented.
- tests cover supported assets, date validation, USD-only input, unsupported behavior boundaries, and metrics coverage.
