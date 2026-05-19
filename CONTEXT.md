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
