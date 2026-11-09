> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Lifecycle Operations

> Updating an existing fixed-rate reserve, what can and cannot be changed, and sunsetting patterns

This page covers operating an existing fixed-rate reserve over its lifecycle: making parameter changes, what's mutable vs. immutable, and how to wind a reserve down when it's no longer needed.

## Updating an existing fixed-rate reserve

The general reserve-update flow at [Reserve Management](https://kamino.com/docs/curators/markets/reserve-management.md) applies — download config, edit, preview, apply. A few constraints are specific to fixed-rate reserves:

| Change | Constraint |
| - | - |
| Lower the borrow rate | Allowed. Affects only new borrows; existing borrows keep their original rate. |
| Raise the borrow rate | Allowed. Same — affects only new borrows. |
| Shorten `debt_term_seconds` | **Blocked** if the reserve has any active borrows. Existing commitments are protected from retroactive shortening. |
| Lengthen `debt_term_seconds` | Allowed. Affects only new borrows. |
| Set `debt_maturity_timestamp` to the past | Blocked — must not be in the past at update time. |
| Move `debt_maturity_timestamp` later | Allowed. Reserve sunset extends. |
| Move `debt_maturity_timestamp` earlier | Allowed, but only to a future timestamp. Existing borrows past the new maturity become liquidatable when the maturity arrives. |
| Change `early_repay_remaining_interest_pct` | Allowed. Penalty for new borrows uses the new value. |
| Change `host_fixed_interest_rate_bps` | Allowed. Affects new borrow accrual. |

> [!WARNING]
>
> **Existing borrows keep the rate they were originated at.** If you change the rate or term on a reserve, current positions are unaffected — the change applies only to new borrows. This means a "USDC 5.5% 3M" reserve can simultaneously hold borrows at 5.5%, 5.0%, and 6.0% if the rate has been changed over time. Plan rate adjustments around expected position turnover.

## Sunsetting a fixed-rate reserve

Two patterns:

### Soft sunset — gradual wind-down

Set `debt_maturity_timestamp` to a future date. New borrows are blocked from that moment; existing borrows continue running. As they hit their per-borrow term ends, they roll, repay, or get protocol-liquidated. Once the reserve maturity hits and `mature_reserve_debt_liquidation_enabled` is on, any remaining debt becomes fully liquidatable with no throttle.

This is the normal path. It gives existing borrowers fair notice and lets the reserve unwind through normal maturity flow.

### Hard sunset — immediate stop

Set the reserve `status` to `Inactive` (1) — blocks all new operations. Existing debt remains and must wind down through normal repayment, rollover (if pointed elsewhere), or liquidation paths.

Use this only when the reserve must stop serving new borrowers immediately for risk reasons. Hard sunset is a circuit breaker — reach for it only when there's an active reason to halt activity, because it prevents borrowers from rolling within the reserve.

## Operational notes

* **Lock time.** Reserve config updates typically have a \~4-hour lock between commitment and on-chain effect. Plan parameter changes around testing windows.
* **Simulate first.** Always use `--mode inspect` before `--mode execute`. The simulation will surface invalid parameter combinations (e.g. attempts to shorten an active reserve's term) before they hit the chain.
* **Rate changes don't affect existing borrows.** This is a feature, not a bug — borrowers locked in a rate keep that rate. Adjust rates expecting the change to flow through over time as positions turn over.
* **Rollover-in-elevation-groups is unsupported.** Borrowers using elevation modes (eMode) on the market cannot have their fixed-term positions rolled over. If your market makes heavy use of eMode, expect those positions to require manual repayment at maturity.
* **The withdrawal queue requires the kvault program to be on a recent version.** Vaults integrating with your market need their kvault upgraded before they can interact with FR reserves correctly. Coordinate the rollout with vault curators.
* **Penalty interest accrues to protocol fees on the debt reserve**, not to the lender side. The early-repay penalty design protects lenders by discouraging premature exits but doesn't directly compensate them.

## What's next

> **[Risk Considerations](https://kamino.com/docs/curators/markets/fixed-rates/risk.md)**
>
> Risks specific to running fixed-rate reserves and how to set parameters that mitigate them.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.