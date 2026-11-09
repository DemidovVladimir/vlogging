> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Settings

> Feature flags, rollover windows, and the post-maturity liquidation throttle

Fixed-rate reserves require several **market-level** flags and parameters to be set before borrowers can place orders, fills can execute, withdrawal tickets can be issued, and rollovers can run. These live on the `LendingMarket` account and apply to every reserve in the market.

## Feature flags — turn capabilities on

Every flag defaults to **off** at market init. You enable each one explicitly when the market is ready for that capability.

| Flag | Effect when enabled |
| - | - |
| `borrow_order_creation_enabled` | Borrowers can place new borrow orders |
| `borrow_order_execution_enabled` | Permissionless fillers (and fill bots) can execute borrow orders |
| `withdraw_ticket_issuance_enabled` | Lenders and vaults can submit withdrawal tickets |
| `withdraw_ticket_redemption_enabled` | Queued tickets can be redeemed |
| `withdraw_ticket_cancellation_enabled` | Tickets can be cancelled before fill |
| `mature_reserve_debt_liquidation_enabled` | Liquidation triggers when a reserve passes its `debt_maturity_timestamp` |
| `obligation_borrow_debt_term_liquidation_enabled` | Liquidation triggers when a per-borrow term ends |
| `obligation_borrow_rollover_configuration_enabled` | Borrowers can opt into rollover on their existing borrows |
| `obligation_borrow_migration_to_fixed_execution_enabled` | Allows rollover from open-term to fixed-term |

### Recommended enablement sequence

When standing up fixed rates on a market:

1. Create the fixed-rate reserves (with terms and rates set, but features still off).
2. Enable `borrow_order_creation_enabled` and `borrow_order_execution_enabled` together.
3. Enable `withdraw_ticket_issuance_enabled` + `withdraw_ticket_redemption_enabled` + `withdraw_ticket_cancellation_enabled` together.
4. Enable `obligation_borrow_rollover_configuration_enabled` and the rollover window durations (below) before the first borrow's maturity arrives.
5. Enable `mature_reserve_debt_liquidation_enabled` and `obligation_borrow_debt_term_liquidation_enabled` last — these activate the protocol-enforced liquidation paths.

> [!NOTE]
>
> Borrower interactions with a fixed-rate reserve fall back to standard floating behaviour if the matching feature flags aren't on. In practice, leaving rollover or liquidation flags off means borrowers must repay manually at maturity, and matured loans cannot be force-closed — keep this in mind during a phased rollout.

## Rate-grid sizing parameters

| Parameter | Default | Meaning |
| - | - | - |
| `min_borrow_order_fill_value` | `2` | Minimum value of any partial fill, and the minimum stump value left after a partial fill. Anti-dust. Adjust upward to discourage thin orders. |
| `min_withdraw_queued_liquidity_value` | `2` | Minimum value for any withdrawal ticket and any partial-fill remainder. Same anti-dust function for the queue side. |

Both values are denominated in the market's quote currency scaling (effectively dollars for a USD-quote market). For most markets the default `2` is the right floor; only raise these if you're seeing dust attacks against the queue or the order book.

## Rollover windows

Rollover is a **pre-expiration** operation. The market defines two distinct windows, each governing one rollover mode:

| Parameter | Effect |
| - | - |
| `fixed_term_rollover_window_duration_seconds` | The window before a fixed-term borrow's maturity during which rollover *into the same or another fixed-term reserve* is allowed. `0` disables fixed→fixed rollover entirely. |
| `open_term_rollover_window_duration_seconds` | The window before maturity during which rollover *from a fixed-term borrow into an open-term (floating) reserve* is allowed. `0` disables fixed→open rollover. |

A typical configuration sets both windows to the same duration (e.g. 24 hours). The windows must be long enough that the rollover keeper bot can complete the operation across all eligible positions before each cohort of maturities passes. Past the term end, rollover is no longer possible — the borrow transitions directly to liquidation eligibility.

`obligation_borrow_migration_to_fixed_execution_enabled` enables a third, separate rollover mode — open-term to fixed-term — which has no time window; it can be performed at any time once the flag is on.

## Post-maturity liquidation throttle

| Parameter | Effect |
| - | - |
| `term_based_full_liquidation_duration_secs` | When a borrow passes its term without rollover or repay, the liquidatable fraction ramps linearly from 0% (at term end) to 100% over this duration. `0` disables the throttle (full liquidation immediately at term end). |
| `min_partial_rollover_value` | Minimum value for a partial rollover. Below this, partial rollover is rejected to avoid dust state. |

The throttle gives borrowers a graceful window to react after they've missed the rollover window — partial liquidation provides increasing pressure rather than a cliff. Set it long enough that a missed-rollover position has time to be repaid voluntarily before being fully unwound, but short enough that capital doesn't sit indefinitely against expired terms. A few days is typical.

The per-reserve `min_deleveraging_bonus_bps`, `max_liquidation_bonus_bps`, and `deleveraging_bonus_increase_bps_per_day` (set on each reserve, not the market) drive the *bonus* paid to liquidators across the throttle window. If those are zero, liquidators have no incentive — set them to produce meaningful per-day increase capped at a reasonable maximum.

## Configuring market settings

All of the above parameters live in the market config JSON and are applied through the standard `update-lending-market-from-config` flow:

```bash theme={null}
# Download current config
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# Edit ./configs/{MARKET_ADDRESS}/market-{MARKET_ADDRESS}.json
# Set the FR-related flags and durations

# Preview
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json \
  --mode inspect

# Apply
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json \
  --mode execute
```

See [Market Settings](https://kamino.com/docs/curators/markets/market-settings.md) for the broader market-config workflow including ownership transfer and multisig mode.

## What's next

> **[Lifecycle Operations](https://kamino.com/docs/curators/markets/fixed-rates/lifecycle-operations.md)**
>
> Updating an existing fixed-rate reserve and sunsetting patterns.

> **[Risk Considerations](https://kamino.com/docs/curators/markets/fixed-rates/risk.md)**
>
> Risks specific to running fixed-rate reserves.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.