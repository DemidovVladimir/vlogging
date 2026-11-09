> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risk Considerations

> Risks specific to running fixed-rate reserves and the parameters that mitigate them

Running a fixed-rate reserve introduces a few risk surfaces that don't exist for floating reserves. This page is the framework for thinking about them and the parameters you control to manage them.

## Risk-mitigation matrix

| Risk | Description | Mitigation |
| - | - | - |
| **Term too short for asset volatility** | A 1-month term on a volatile collateral may not give borrowers enough time to manage drawdowns through one cycle. | Match term to collateral volatility profile. Stable collateral can carry longer terms; volatile collateral should be capped at shorter durations. |
| **Rate too low → no demand** | Set below floating-market clearing rates and conditional liquidity won't be deployed; reserve sits empty. | Reference the floating reserve's recent borrow rate and add a small term premium. Adjust based on the rate grid's emerging shape. |
| **Rate too high → no fills** | Set well above floating, and vaults won't allocate, borrowers won't post matching orders. | Same — calibrate against the floating curve. |
| **Insufficient rollover window** | Window too short for the keeper bot to clear a maturity cohort. | Set windows long enough to accommodate the largest expected cohort. Watch keeper success rates as live signal. |
| **Throttle ramp too aggressive** | Liquidatable fraction climbs faster than borrowers can react after a missed rollover. | Pair `term_based_full_liquidation_duration_secs` with reasonable bonus parameters. The ramp should give voluntary repay time before forced unwind. |
| **`mature_reserve_debt_liquidation_enabled` flipped on prematurely** | A reserve passes its `debt_maturity_timestamp` and immediately becomes fully liquidatable with no warning. | Coordinate the maturity-liquidation flag with reserve maturity dates. Only enable when liquidator infrastructure is ready and the maturity is intentional. |
| **Stale `host_fixed_interest_rate_bps`** | Setting a non-zero host fixed rate creates a permanent protocol spread on top of the curve, invisible to lenders looking at the curve alone. | Default `host_fixed_interest_rate_bps` to `0` unless the protocol-side spread is intentional. Document publicly when non-zero. |
| **Liquidation bonus parameters unset** | Without `min_deleveraging_bonus_bps` / `deleveraging_bonus_increase_bps_per_day` / `max_liquidation_bonus_bps`, post-maturity liquidations carry no incentive. | Configure all three on every fixed-rate reserve. Mirror typical floating-reserve values, adjusted for the protocol-enforced nature of these liquidations. |

## Pricing the rate

The fixed rate you set should fall in a corridor:

* **Floor:** the floating reserve's expected average borrow rate over the term — below this and lenders prefer floating.
* **Ceiling:** what borrowers will actually accept — above this and demand evaporates.

Read the floating reserve's recent borrow-rate history (over a duration matching your fixed term) and add the term premium you observe in adjacent cells of the rate grid. If you're the first reserve at that duration, start near the floating rate's recent average and adjust as demand develops.

## Calibrating windows

Two windows work together — the pre-expiration rollover window and the post-expiration liquidation throttle.

* **Rollover window** should be long enough that the keeper can rollover an entire maturity cohort even under network congestion. Default suggestion: 24 hours. Shorter than 4 hours starts risking missed cohorts.
* **Liquidation throttle** should be long enough that a borrower who missed the rollover window has time to come back, repay, and exit cleanly. Default suggestion: 2–7 days. Shorter creates a cliff; longer means matured capital sits unproductive.

Together, the two define the borrower's "off-ramp" between voluntary action and forced liquidation. A reasonable shape: rollover window 24h, throttle 3 days, bonus ramp from 50 bps at term-end to 500 bps over the throttle duration.

## Calibrating bonuses

The liquidator's incentive ramp is governed by three reserve-level parameters:

* `min_deleveraging_bonus_bps` — what a liquidator earns at term-end + 0 seconds.
* `deleveraging_bonus_increase_bps_per_day` — how fast the bonus grows.
* `max_liquidation_bonus_bps` — the cap.

Set these such that:

* The bonus is just attractive enough at the start of the throttle that a fast liquidator will take action.
* The bonus grows enough across the throttle window that a slow liquidator is incentivised to act before others outrun them.
* The cap is high enough to ensure the liquidation actually clears even on adverse market movement.

Mirror your floating-reserve liquidation-bonus shape, then tune slightly — protocol-enforced liquidations typically warrant slightly higher bonuses since they're not price-driven.

## Coordinating with vault curators

Vaults are the primary source of fixed-rate liquidity (both Standard and Conditional). Operational coordination matters:

* **Communicate parameter changes ahead of the lock time** so vault curators can adjust.
* **Surface new fixed-rate reserves** through your curator-relations channel before going live, so vault curators can plan allocation strategy.
* **Confirm vault versions support withdrawal-queue accounting** before enabling the queue features. Vaults running older kvault versions cannot interact correctly with queued tickets.

## What's next

> **[Reserve Configuration](https://kamino.com/docs/curators/markets/fixed-rates/reserve-configuration.md)**
>
> Back to the reserve creation walkthrough.

> **[Allocator's view](https://kamino.com/docs/curators/vaults/fixed-rates.md)**
>
> How vault curators allocate into the reserves you create.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.