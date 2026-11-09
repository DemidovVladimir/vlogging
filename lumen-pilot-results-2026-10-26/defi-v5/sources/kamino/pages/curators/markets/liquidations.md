> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidations

> Configure liquidation thresholds, close factors, bonuses, and bad-debt handling

When a borrower's health crosses `liquidationThresholdPct`, their position becomes liquidatable. klend exposes a set of curator-tunable parameters governing how aggressively liquidations happen and how much liquidators earn for clearing positions.

This page covers the market-level and reserve-level fields that shape liquidator behavior. For threshold setting and IR curve choices, see [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md). For the auto-deleverage (margin call) mechanism, see [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md).

## The liquidation flow at a glance

When a borrower's LTV crosses `liquidationThresholdPct`, the position becomes liquidatable. Any wallet can call `liquidate-obligation-and-redeem-reserve-collateral` against it. In a single instruction, the liquidator repays up to `close_factor × debt`, seizes collateral of equal value plus the configured bonus, and the obligation is restored at or above the liquidation threshold. Liquidations are permissionless: the program holds the safety net, an open market of liquidators races to act on it.

## Close factor and value caps (market-level)

Tunables on `LendingMarket`:

```jsonc theme={null}
{
  "liquidation_max_debt_close_factor_pct": 25,
  "max_liquidatable_debt_market_value_at_once": "<u64>",
  "min_full_liquidation_value_threshold": "<u64>",
  "min_value_skip_liquidation_ltv_checks": "<u64>",
  "min_value_skip_liquidation_bf_checks": "<u64>"
}
```

| Field | What it does |
| - | - |
| `liquidation_max_debt_close_factor_pct` | Maximum portion of debt a liquidator can repay in a single liquidation, in percent. Default `25` means a borrower's position can be liquidated by 25% per round. Lower values protect borrowers from one-shot wipeout; higher values let liquidators clear damaged positions faster |
| `max_liquidatable_debt_market_value_at_once` | Hard ceiling on market-value liquidated per liquidation (in the market's quote currency, scaled). Throttles whale liquidations to prevent a single liquidator from clearing too much at once |
| `min_full_liquidation_value_threshold` | Below this debt market value, the close-factor cap is bypassed and the entire position can be liquidated. Used to cleanly clear dust positions where partial liquidation is uneconomical |
| `min_value_skip_liquidation_ltv_checks` | Below this market value, the program skips the LTV health check during liquidation. Allows a liquidator to clear a dust position regardless of whether it's underwater on standard checks |
| `min_value_skip_liquidation_bf_checks` | Same idea for the borrow-factor check |

### Tuning the close factor

Default close factor of 25% is sized so a borrower has multiple rounds to add collateral or repay before being fully wiped out. Each liquidation round drives the position back toward health; if the market continues moving against them, subsequent rounds re-engage.

Reasons to deviate:

| Setting | Use case |
| - | - |
| `15-25%` | Default. Borrower-protective |
| `30-50%` | Faster cleanup of unhealthy positions; appropriate for high-volatility assets where multi-round liquidation creates more risk than it prevents |
| `100%` | Single-round full liquidation. Use only for fixed-term reserves at maturity, or in incident response |

## Liquidation bonus (reserve-level)

Liquidator incentive lives on each reserve:

```jsonc theme={null}
{
  "minLiquidationBonusBps": 500,
  "maxLiquidationBonusBps": 1000,
  "badDebtLiquidationBonusBps": 99,
  "protocolLiquidationFeePct": 0
}
```

| Field | What it does |
| - | - |
| `minLiquidationBonusBps` | Floor on the bonus a liquidator earns. Applied when a position is just past Liquidation LTV |
| `maxLiquidationBonusBps` | Cap on the bonus. The bonus scales with the LTV breach depth but cannot exceed this value |
| `badDebtLiquidationBonusBps` | Near-insolvency bonus applied when LTV reaches 99% or higher. Set low (\~1%) because near-insolvent positions cannot sustain a large bonus without creating bad debt |
| `protocolLiquidationFeePct` | Percentage (0–100) of liquidation proceeds that route to protocol fees; the liquidator receives the remainder |

Reference values:

| Asset class | min | max | bad debt |
| - | - | - | - |
| Stablecoins (in eMode) | 100 (1%) | 200 (2%) | 99 (≈1%) |
| Major liquid (SOL, BTC, ETH) | 300–500 (3–5%) | 700–1000 (7–10%) | 99 |
| Long-tail | 500–800 | 1500–2500 | 99 |

The on-chain bonus is calculated in three steps (all values in bps, where 10,000 bps = 100%):

1. **Floor**: `bonus = max(minLiquidationBonusBps, currentLTV_bps - liquidationLTV_bps)`. The bonus is at least the min, and grows with the depth of the LTV breach.
2. **Cap**: `bonus = min(bonus, maxLiquidationBonusBps)`. The bonus cannot exceed the reserve's max.
3. **Solvency cap**: `bonus = min(bonus, 10000 - currentLTV_bps)`. Near 100% LTV, the bonus is reduced so that the liquidation does not push the position into bad debt.

When LTV exceeds the market's insolvency-risk threshold (typically \~95%), the close factor increases to 100% to allow full liquidation. When LTV reaches 99% or higher, the bonus switches to `badDebtLiquidationBonusBps`, enabling full liquidation at a minimal bonus to maximize recovery before insolvency; the solvency cap above still applies.

## Pausing liquidations

```jsonc theme={null}
{
  "price_triggered_liquidation_disabled": 0
}
```

| Value | Effect |
| - | - |
| `0` | Default. Liquidations triggered by price movement are allowed |
| `1` | All price-triggered liquidations are blocked. Use during oracle incidents to prevent cascading liquidations on bad prices |

This is a market-level kill switch. Combine with `borrow_disabled` for full incident-mode posture. See [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md).

## Liquidations on mature fixed-term debt

```jsonc theme={null}
{
  "mature_reserve_debt_liquidation_enabled": 1,
  "obligation_borrow_debt_term_liquidation_enabled": 1,
  "term_based_full_liquidation_duration_secs": 0
}
```

These flags govern liquidation of fixed-term positions. See [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md) for details.

## Bad debt and socialized loss

If a position can't be liquidated cleanly — collateral falls below debt and even the bad-debt bonus doesn't cover the gap — the curator (or `emergency_council`) can call `socialize-loss` to spread the loss across the affected reserve's depositors.

This is an irreversible, depositor-affecting action. Use it only when:

* The position is genuinely unrecoverable
* All standard liquidation paths have been exhausted
* The affected reserve has a credible loss-recovery plan (insurance, treasury backfill, etc.)

`socialize-loss` is callable by the `lending_market_owner` or, if configured, the `emergency_council`. See [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md).

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — every reserve-level liquidation field
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every market-level liquidation field
* [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) — choosing LTV, threshold, IR curve
* [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md) — margin-call grace window (advanced)
* [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md) — pausing the market, socialize-loss


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.