# Event-Based Simulation Design

## Status

Approved for planning.

## Goal

Add an event-based mode to the crypto simulator so a user can choose a real historical crypto event, simulate investing after hearing that event, and understand both the financial outcome and the risk journey.

The product moment is:

> You heard the news like a normal person. What if you reacted after it?

V1 optimizes for demo clarity, recruiter readability, and engineering proof. It should feel memorable within 60 seconds without depending on external news APIs.

## Scope

V1 covers the current Simulation product assets:

- BTC
- ETH
- SOL

Each asset gets 5 curated historical events, for 15 total seeded events.

Events should be mixed across positive and negative market contexts, including adoption, regulation, crashes, exchange failures, and protocol or ecosystem milestones. V1 excludes events that cannot resolve to valid historical prices for all supported delay options.

The schema should support future expansion beyond BTC, ETH, and SOL, but the frontend only enables event simulation for the current v1 asset set.

## Non-Goals

- No external news API ingestion in v1.
- No chart event markers in v1.
- No user-generated events.
- No investment advice or trade recommendations.
- No coverage for all 84 ready assets in v1.

## Product Experience

The existing Simulation tab gains a compact segmented control:

```text
Date | Event
```

`Date` keeps the current manual historical-date simulator.

`Event` adds an event feed inside the same Simulation tab.

User flow:

1. User chooses BTC, ETH, or SOL.
2. User switches from `Date` to `Event`.
3. App shows 5 curated news-headline cards for that asset.
4. User selects an event.
5. User chooses reaction delay:
   - same day
   - 1 week later
   - 1 month later
6. User enters a hypothetical USD amount.
7. App runs an event scenario.
8. App shows outcome, risk metrics, plain-English takeaway, and source/data-trust metadata.

Event cards use a news-headline tone, not a decision-prompt tone.

Each card shows:

- headline
- event date
- category
- short plain-English summary
- source count or source labels
- selected state

## Result Experience

The event scenario result shows:

- event headline
- event date
- selected delay
- intended buy date
- resolved buy date
- historical buy price
- current value
- gain/loss dollars
- gain/loss percent
- max drawdown after buy
- longest underwater period
- best 30-day stretch
- worst 30-day stretch
- deterministic plain-English takeaway
- data trust metadata

Example takeaway:

```text
This scenario ended profitable, but you would have sat through a 62% drawdown before the long-term gain.
```

The app must keep the current hypothetical and educational language. It should not imply that users should buy, sell, hold, or copy a historical scenario.

## Data Model

Curated events live in Cloudflare D1, not in frontend-bundled JSON.

### `simulation_events`

- `id`
- `asset_symbol`
- `headline`
- `summary`
- `event_date`
- `category`
- `market_sentiment`
- `sort_order`
- `status`
- `provider`
- `external_id`
- `confidence_score`
- `ingested_at`
- `created_at`
- `updated_at`

V1 uses manually seeded rows. Future ingestion can use `provider`, `external_id`, `confidence_score`, and `ingested_at` without changing the frontend contract.

### `simulation_event_sources`

- `id`
- `event_id`
- `title`
- `publisher`
- `url`
- `published_at`
- `created_at`

Each active event must have at least 2 credible sources.

## Source Standard

V1 uses a strict source standard:

- every event has at least 2 credible sources
- every event has an exact event date
- every event has a plain-English summary explaining why it mattered
- every source includes title, publisher, URL, and published date when available
- events without valid source metadata are not returned as active

This keeps the feature credible and avoids cherry-picked or low-trust event cards.

## Backend API

The Worker owns event validity, delay calculation, date resolution, source metadata, and risk metrics.

### `GET /api/simulation/events?asset=BTC`

Returns active, v1-ready events for the requested asset.

Behavior:

- validates the asset
- returns only active events
- includes source metadata
- includes supported delay options
- excludes events that cannot resolve to valid historical prices for v1 delays

### `GET /api/simulation/event-scenarios?eventId=...&delay=same_day|one_week|one_month&amountUsd=...`

Runs an event-based simulation.

Behavior:

- loads the event from D1
- validates event status and source metadata
- calculates intended buy date from event date plus delay
- resolves intended buy date to a valid historical price date
- reuses existing simulation math where appropriate
- computes risk metrics from daily historical D1 prices
- returns source and data-trust metadata

The API should be shaped so future versions can compare multiple delays side by side, but v1 only returns the selected delay result.

## Risk Metrics

Risk metrics use static historical D1 prices from the resolved buy date through the latest available historical date. Current value may continue using the current CoinGecko price, but risk metrics must be reproducible from the static dataset.

### Max Drawdown After Buy

Largest percentage drop from any post-buy peak to a later low.

Plain-English meaning: the worst fall the user would have had to sit through.

### Longest Underwater Period

Longest continuous period where the investment value stayed below the original invested amount.

Plain-English meaning: how long the user would have waited just to break even again.

### Best 30-Day Stretch

Highest percentage gain across any rolling 30-day period after the resolved buy date.

Plain-English meaning: the strongest short-term run after the user bought.

### Worst 30-Day Stretch

Largest percentage loss across any rolling 30-day period after the resolved buy date.

Plain-English meaning: the roughest short-term period after the user bought.

### Plain-English Takeaway

Generated by deterministic backend templates. No LLM is required for v1.

The takeaway should combine final outcome and risk journey in recruiter-friendly language a non-technical user can understand.

## Frontend Behavior

The Simulation screen owns display and interaction only.

Frontend responsibilities:

- render `Date | Event` mode switch
- fetch event list for selected asset
- render headline event cards
- render delay selector
- collect amount
- call event scenario endpoint
- render event scenario result
- save event-based simulations with event metadata

Saved simulations must distinguish:

- manual date simulations
- event-based simulations

## Error Handling

- If event list fetch fails, show retry and keep Date mode usable.
- If event scenario fetch fails, show an event-specific API error.
- If amount is invalid, reuse current amount validation behavior.
- If event source metadata is incomplete, backend validation excludes the event from active results.
- If a delay cannot resolve to a valid historical price, backend returns an unavailable response; v1 seed data should prevent this from appearing in normal use.
- If D1 event tables are empty, the Event mode should show an empty state without breaking the existing Date simulator.

## Measurement

V1 success is measured across demo, engineering, and resume outcomes.

Demo success:

- user can pick BTC, ETH, or SOL, choose from 5 events, select delay, enter amount, run scenario, and understand the result in under 60 seconds during manual testing

Engineering success:

- D1 event schema and seed migration exist
- Worker event endpoints exist
- shared validators cover event list and scenario responses
- risk metric unit tests cover max drawdown, underwater period, and rolling 30-day windows
- frontend tests cover Event mode, delay selector, headline cards, and event scenario rendering
- `./node_modules/.bin/jest --runInBand --watchman=false` passes
- `./node_modules/.bin/tsc --noEmit` passes

Resume success:

- feature supports 2-3 strong bullets about event-driven simulation, backend-owned historical analytics, data trust, source validation, and user education

## Future Hooks

After v1 proves useful:

- add chart event markers
- add side-by-side delay comparison
- add event ingestion from a historical news provider
- add event confidence scoring and deduplication
- expand seeded events beyond BTC, ETH, and SOL
- add admin tooling or data-quality reports for event curation

## Open Implementation Notes

- Event IDs should be stable slugs or deterministic identifiers so saved simulations remain readable.
- Delay calculation should use UTC date-only arithmetic.
- Event scenario APIs should share existing simulation validation and data-trust patterns where practical.
- Seed data should be reviewed manually before implementation is considered complete.
