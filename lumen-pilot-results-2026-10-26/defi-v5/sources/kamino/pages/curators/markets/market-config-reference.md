> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Config Reference

> Every editable field on the LendingMarket account

This is the canonical reference for `LendingMarket` — the on-chain struct that holds market-level settings. Field names below use snake\_case as they appear in the JSON returned by `download-lending-market-config` (which mirrors the on-chain Rust struct directly).

For guidance on which fields to set, see [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) and the topic-specific guides linked below.

## Identity and naming

| Field | Type | Description |
| - | - | - |
| `version` | u64 | Program version, fixed at init |
| `bump_seed` | u64 | PDA bump seed. Set at init |
| `name` | UTF-8 string (≤32 bytes) | Human-readable market name. Editable via `update-lending-market-name` or full config update |
| `quote_currency` | UTF-8 string (≤32 bytes) | Reference unit prices are denominated in. Almost always `"USD"` |

## Ownership

| Field | Type | Description |
| - | - | - |
| `lending_market_owner` | Pubkey | Active market owner. Authorized for all updates |
| `lending_market_owner_cached` | Pubkey | Staging slot for ownership transfer. The current owner sets it; only that pubkey can finalize the swap via `update-lending-market-owner` |
| `emergency_council` | Pubkey | Optional separate authority for emergency-only handlers (e.g., `socialize_loss`) |
| `proposer_authority` | Pubkey | Authority that can propose certain config updates without holding full owner privileges |
| `immutable` | u8 (bool) | If `1`, all owner-side updates are permanently disabled. **Irreversible.** |

## Feature flags

| Field | Type | Description |
| - | - | - |
| `borrow_disabled` | u8 (bool) | If `1`, new borrows are rejected market-wide. Existing positions continue |
| `emergency_mode` | u8 (bool) | If `1`, market-wide emergency mode |
| `autodeleverage_enabled` | u8 (bool) | If `1`, enables auto-deleverage market-wide. Per-reserve flag must also be set |
| `price_triggered_liquidation_disabled` | u8 (bool) | If `1`, blocks all price-triggered liquidations |
| `mature_reserve_debt_liquidation_enabled` | u8 (bool) | If `1`, allows liquidations of mature fixed-term debt |
| `obligation_borrow_debt_term_liquidation_enabled` | u8 (bool) | If `1`, enables term-based liquidation flow specifically |

## Withdrawal queue

| Field | Type | Description |
| - | - | - |
| `withdraw_ticket_issuance_enabled` | u8 (bool) | If `1`, users can call `enqueue-to-withdraw` |
| `withdraw_ticket_redemption_enabled` | u8 (bool) | If `1`, users can call `withdraw-queued-liquidity` |
| `withdraw_ticket_cancellation_enabled` | u8 (bool) | If `1`, users can call `cancel-withdraw-ticket` |
| `min_withdraw_queued_liquidity_value` | u64 | Minimum USD value (scaled fraction) for a single ticket. Below this, `enqueue-to-withdraw` reverts |

See [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md).

## Borrow orders

| Field | Type | Description |
| - | - | - |
| `borrow_order_creation_enabled` | u8 (bool) | If `1`, users can call `set-borrow-order` |
| `borrow_order_execution_enabled` | u8 (bool) | If `1`, lenders can call `fill-borrow-order` |
| `min_borrow_order_fill_value` | u64 | Minimum USD value (scaled fraction) for a single fill |

See [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md).

## Obligation orders

| Field | Type | Description |
| - | - | - |
| `obligation_order_creation_enabled` | u8 (bool) | If `1`, users can call `set-obligation-order` |
| `obligation_order_execution_enabled` | u8 (bool) | If `1`, executors can call `fill-obligation-order` |

See [Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md).

## Fixed-term rollover

| Field | Type | Description |
| - | - | - |
| `fixed_term_rollover_window_duration_seconds` | u64 | Window before maturity allowing fixed→fixed rollover. `0` disables |
| `open_term_rollover_window_duration_seconds` | u64 | Window before maturity allowing fixed→open rollover. `0` disables |
| `obligation_borrow_migration_to_fixed_execution_enabled` | u8 (bool) | If `1`, allows open→fixed migration anytime |
| `obligation_borrow_rollover_configuration_enabled` | u8 (bool) | If `1`, allows borrowers to pre-configure rollover behavior |
| `min_partial_rollover_value` | u64 | Minimum USD value for a partial rollover. `0` requires full rollovers only |
| `term_based_full_liquidation_duration_secs` | u64 | Time after maturity before full (close-factor-bypassing) liquidation is available. `0` disables |

See [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md).

## Liquidation tunables

| Field | Type | Description |
| - | - | - |
| `liquidation_max_debt_close_factor_pct` | u8 (0–100) | Maximum portion of debt liquidatable per round |
| `max_liquidatable_debt_market_value_at_once` | u64 | Hard ceiling on market value liquidated per liquidation |
| `min_full_liquidation_value_threshold` | u64 | Below this debt market value, the close-factor cap is bypassed |
| `insolvency_risk_unhealthy_ltv_pct` | u8 (0–100) | LTV threshold for the insolvency-risk auto-deleverage path |
| `min_value_skip_liquidation_ltv_checks` | u64 | Below this market value, skip LTV health checks during liquidation |
| `min_value_skip_liquidation_bf_checks` | u64 | Below this market value, skip borrow-factor health checks |
| `individual_autodeleverage_margin_call_period_secs` | u64 | Default grace period (seconds) between margin call and forced liquidation |

See [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) and [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md).

## Elevation groups

```jsonc theme={null}
"elevation_groups": [
  {
    "id": 1,
    "ltv_pct": 90,
    "liquidation_threshold_pct": 92,
    "max_liquidation_bonus_bps": 200,
    "allow_new_loans": 1,
    "max_reserves_as_collateral": 8,
    "debt_reserve": "<DEBT_RESERVE_PUBKEY>"
  }
  // ... up to 32 entries
]
```

| Field | Type | Description |
| - | - | - |
| `id` | u8 (1–32) | Group identifier. `0` is the "no group" sentinel |
| `ltv_pct` | u8 (0–100) | Group LTV; replaces per-reserve LTV for in-group positions |
| `liquidation_threshold_pct` | u8 (0–100) | Group liquidation threshold |
| `max_liquidation_bonus_bps` | u16 | Cap on liquidator bonus inside the group |
| `allow_new_loans` | u8 (bool) | `0` blocks new borrows in the group; existing positions persist |
| `max_reserves_as_collateral` | u8 | Maximum distinct collateral reserves a group-position may hold |
| `debt_reserve` | Pubkey | Single permitted debt asset for the group |

See [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md).

## Position thresholds

| Field | Type | Description |
| - | - | - |
| `min_initial_deposit_amount` | u64 | Minimum amount required for a brand-new deposit to a reserve |
| `min_net_value_in_obligation_sf` | u128 (scaled fraction) | Minimum USD value an obligation must hold after any operation |
| `global_allowed_borrow_value` | u64 | Maximum total borrow value across all users on the market |

## Fees

| Field | Type | Description |
| - | - | - |
| `referral_fee_bps` | u16 | Referral fee in basis points, shared with registered referrers |

## Oracle policy

| Field | Type | Description |
| - | - | - |
| `price_refresh_trigger_to_max_age_pct` | u8 (0–100) | Percentage of `maxAgePriceSeconds` at which off-chain bots refresh proactively. `0` = on-demand only |

## Runtime / read-only

These fields are program-managed and not user-editable:

| Field | Type | Description |
| - | - | - |
| `version` | u64 | Program version |
| `bump_seed` | u64 | PDA bump |
| `reserved0`, `reserved1`, `padding1`, `padding2`, `elevation_group_padding` | varies | Struct alignment / future-use slots |

## Reading the live config

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

For market + every reserve in one call:

```bash theme={null}
yarn kamino-manager download-lending-market-config-and-all-reserves-configs \
  --lending-market <MARKET_ADDRESS>
```

## Reference

* [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) — the workflow for editing these fields
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — per-reserve fields
* [CLI command index](https://kamino.com/docs/curators/markets/cli-command-index.md) — all market-related commands


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.