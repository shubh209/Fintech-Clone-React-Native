# Crypto Market Simulator

This context defines the product language for a demo-ready crypto market simulator. It exists so product planning, code structure, tests, and docs use the same terms.

## Language

**Auth**:
The user access area for signup, login, verification, and signed-in routing.
_Avoid_: Account system, banking login

**Crypto Market**:
The market browsing area where a user inspects crypto assets, current prices, source metadata, and detail data.
_Avoid_: Exchange, trading desk

**Simulation**:
The experience where a user chooses a past date, asset, and amount or quantity to estimate what that holding would be worth today.
_Avoid_: Real purchase, investment order, transaction

**Simulation Input Amount**:
The fiat amount a user hypothetically spent on a past crypto purchase. For the first prototype this is a USD amount, not crypto quantity.
_Avoid_: Order amount, trade size, cash transfer

**Historical Buy Date**:
The past calendar date used by a Simulation to look up the asset price at that time. For the first prototype, supported dates run from 2021-01-01 through the latest common imported historical date for BTC, ETH, and SOL.
_Avoid_: Trade date, settlement date, transaction date

**Historical Price Explorer**:
The chart-driven Simulation control that lets a user choose a year, inspect historical USD prices, and press/drag across the chart to select a Historical Buy Date.
_Avoid_: Trading chart, exchange chart, technical analysis tool

**Resolved Historical Date**:
The actual historical price date used by a Simulation when the requested Historical Buy Date is missing from the curated dataset. It may be the requested date or the next available date, and must be shown as part of the result.
_Avoid_: Hidden adjustment, approximate date

**Historical Price Source**:
The curated source of past crypto prices used to calculate a Simulation. It is historical reference data, not live market data.
_Avoid_: Live quote, exchange feed, trading data

**Saved Simulation**:
A stored hypothetical simulation result that lets a user revisit a past-purchase estimate later. It is not a trade, portfolio holding, transaction, or synced financial record.
_Avoid_: Saved trade, holding, transaction history

**Purchasing Power**:
The comparison area where simulated crypto value is translated into real-world assets for a chosen region.
_Avoid_: Shopping, checkout, marketplace

**Data Trust**:
The shared language for whether market data is live, fallback, stale, fresh, valid, or failed.
_Avoid_: Hidden API state, silent fallback

**Shared**:
Cross-feature code that supports multiple product domains without owning a product job itself.
_Avoid_: Misc, common dumping ground

## Example Dialogue

Developer: "Should this historical Bitcoin calculator live in Crypto Market?"

Domain expert: "No. Crypto Market helps the user inspect assets and current market data. The historical buy-date calculation is Simulation."

Developer: "Where do source and freshness labels live?"

Domain expert: "That is Data Trust. It is shared because Crypto Market, Simulation, and Purchasing Power all need to explain whether their numbers are reliable."

Developer: "If the user saves the result, did they create a transaction?"

Domain expert: "No. They created a Saved Simulation: a hypothetical result they can revisit, not a trade or portfolio holding."

Developer: "Can the user enter 0.25 BTC instead of dollars?"

Domain expert: "Not in the first prototype. Simulation starts from a USD Simulation Input Amount and calculates the implied quantity."

Developer: "Can the user simulate buying Solana in 2018?"

Domain expert: "No. The first prototype uses a shared Historical Buy Date range from 2021-01-01 through the latest common imported historical date for BTC, ETH, and SOL."

Developer: "Is the chart an investing/trading tool?"

Domain expert: "No. It is a Historical Price Explorer for choosing a Simulation date, not a technical analysis surface or trading chart."

Developer: "If the exact requested date is missing, can the app quietly use another date?"

Domain expert: "No. A Simulation may use the next available Resolved Historical Date, but the result must show both the requested date and the resolved date."
