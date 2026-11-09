> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Reserve Config Reference

> Every editable field on a Kamino reserve

This is the canonical reference for `ReserveConfig` — the on-chain struct that defines every parameter of a Kamino reserve. Field names below match the JSON used by the kamino-manager CLI (camelCase). The on-chain Rust struct uses snake\_case; the SDK handles the conversion.

For guidance on choosing values, see [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md), [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md), and the topic-specific guides linked from each section below.

## Reserve status

| Field | Type | Description |
| - | - | - |
| `status` | u8 enum | `0` Active (normal operation), `1` Obsolete (existing positions continue; signals not for new activity), `2` Hidden (hidden from default UIs) |

## Risk parameters

| Field | Type | Description |
| - | - | - |
| `loanToValuePct` | u8 (0–100) | Maximum borrowing capacity against this asset as collateral, in percent of USD value |
| `liquidationThresholdPct` | u8 (0–100) | LTV at which a position becomes liquidatable. Must be ≥ `loanToValuePct` |
| `borrowFactorPct` | u64 (≥100) | Risk multiplier on debt-side valuation. `100` = no adjustment; higher values shrink effective borrow capacity |
| `disableUsageAsCollOutsideEmode` | u8 (bool) | If `1`, this asset can be used as collateral only inside elevation groups |
| `utilizationLimitBlockBorrowingAbovePct` | u8 (0–100) | Block new borrows when utilization is above this percent. `0` disables |

## Capacity limits

| Field | Type | Description |
| - | - | - |
| `depositLimit` | u64 (token base units) | Maximum total deposits accepted. `0` = no limit |
| `borrowLimit` | u64 (token base units) | Maximum total borrows. `0` = no borrows allowed |
| `borrowLimitOutsideElevationGroup` | u64 | Borrow cap against this asset as collateral when borrower is outside any eMode group. `u64::MAX` = no cap |
| `borrowLimitAgainstThisCollateralInElevationGroup` | array of 32 u64 | Per-group borrow cap against this asset as collateral. Index = `group_id - 1` |

## Withdrawal caps

Each cap is a `WithdrawalCaps` struct with these fields:

| Field | Type | Description |
| - | - | - |
| `configCapacity` | i64 (token base units) | Maximum net flow per interval. `0` disables the cap |
| `currentTotal` | i64 | Net flow within the current interval (program-managed) |
| `lastIntervalStartTimestamp` | u64 | Unix timestamp when the current interval started (program-managed) |
| `configIntervalLengthSeconds` | u64 | Interval length in seconds. Common: `86400` (1 day) |

Two caps per reserve:

| Field | Throttles |
| - | - |
| `depositWithdrawalCap` | Net deposit / withdrawal flow on the collateral side |
| `debtWithdrawalCap` | Net borrow / repay flow on the debt side |

## Liquidation parameters

| Field | Type | Description |
| - | - | - |
| `minLiquidationBonusBps` | u16 (0–10000) | Minimum bonus paid to liquidators |
| `maxLiquidationBonusBps` | u16 (0–10000) | Maximum bonus paid to liquidators |
| `badDebtLiquidationBonusBps` | u16 (0–10000) | Bonus when liquidating bad-debt positions (debt > collateral) |
| `protocolLiquidationFeePct` | u8 (0–100) | Protocol's cut of liquidation proceeds |

## Auto-deleverage

| Field | Type | Description |
| - | - | - |
| `autodeleverageEnabled` | u8 (bool) | Per-reserve enablement (market-level flag must also be `1`) |
| `deleveragingMarginCallPeriodSecs` | u64 | Per-reserve override for the margin-call grace period. `0` falls back to the market default |
| `deleveragingThresholdDecreaseBpsPerDay` | u64 | Effective liquidation threshold drops by this many bps per day after margin call |
| `deleveragingBonusIncreaseBpsPerDay` | u64 | Liquidator bonus rises by this many bps per day after margin call |
| `minDeleveragingBonusBps` | u16 | Floor on the deleverage-specific bonus |

## Interest rate curve

```jsonc theme={null}
"borrowRateCurve": {
  "points": [
    { "utilizationRateBps": 0, "borrowRateBps": 0 },
    // up to 11 points
  ]
}
```

| Field | Type | Description |
| - | - | - |
| `borrowRateCurve.points` | array (exactly 11 entries) | Piecewise linear curve. Each entry: `{ utilizationRateBps, borrowRateBps }`. The curve must be non-decreasing in both fields. |
| `utilizationRateBps` | u16 (0–10000) | Utilization at this breakpoint, in basis points |
| `borrowRateBps` | u32 | Borrow rate at this utilization, in basis points |

The first point should be `(0, 0)` or `(0, 1)`. The last point should be `(10000, max_rate)`. Pad unused slots by repeating the final point.

## Fees

| Field | Type | Description |
| - | - | - |
| `fees.borrowFee` | string (decimal) | Origination fee charged on each borrow. `"0.001"` = 0.1% |
| `fees.flashLoanFee` | string (decimal) | Flash loan fee. `"0.001"` = 0.1% |
| `protocolTakeRatePct` | u8 (0–100) | Percent of accrued interest routed to protocol fees (depositors receive the remainder) |
| `protocolOrderExecutionFeePct` | u8 (0–100) | Percent of obligation order execution proceeds routed to protocol fees |

## Token info / oracle config

```jsonc theme={null}
"tokenInfo": {
  "name": "USDC",
  "heuristic": { "lower": 0, "upper": 0, "exp": 0 },
  "maxAgePriceSeconds": 120,
  "maxAgeTwapSeconds": 240,
  "maxTwapDivergenceBps": 4050,
  "scopeConfiguration": { /* ... */ },
  "blockPriceUsage": 0
}
```

| Field | Type | Description |
| - | - | - |
| `name` | UTF-8 string (≤32 bytes) | Token symbol. Surfaced in tooling |
| `heuristic.lower` | u64 | Sanity bound: minimum acceptable price = `lower * 10^exp`. `0` disables |
| `heuristic.upper` | u64 | Sanity bound: maximum acceptable price |
| `heuristic.exp` | u64 | Decimal exponent for the heuristic bounds |
| `maxAgePriceSeconds` | u64 | Reject prices older than this many seconds |
| `maxAgeTwapSeconds` | u64 | Reject TWAPs older than this many seconds. Required if TWAP is enabled |
| `maxTwapDivergenceBps` | u64 (0–10000) | Reject prices that deviate from TWAP by more than this. `0` disables the TWAP guard |
| `blockPriceUsage` | u8 (bool) | If `1`, every operation needing this reserve's price is rejected. Emergency switch |

### Scope configuration

```jsonc theme={null}
"scopeConfiguration": {
  "priceFeed": "<SCOPE_ORACLE_PRICES_PUBKEY>",
  "priceChain": [0, 65535, 65535, 65535],
  "twapChain": [52, 65535, 65535, 65535]
}
```

| Field | Type | Description |
| - | - | - |
| `priceFeed` | Pubkey | Scope `OraclePrices` account |
| `priceChain` | u16 array (length 4) | Indices into the Scope feed forming the price chain. `65535` is the unused-slot sentinel |
| `twapChain` | u16 array (length 4) | TWAP indices for the same chain |

## Fixed-Rate Parameters

Fixed-rate reserves use the same primitives as floating reserves plus four config fields that pin the rate and impose a term. See [Fixed Rates](https://kamino.com/docs/curators/markets/fixed-rates.md) for the full configuration workflow.

| Parameter | Type | Description |
| - | - | - |
| `hostFixedInterestRateBps` | Basis points (u16) | Optional protocol-side spread layered on top of `borrowRateCurve`. Charged to the borrower and accruing 100% to the protocol. Default `0`. |
| `debtTermSeconds` | u64 (seconds) | Per-borrow term. Each borrow matures at `last_borrowed_at_timestamp + debtTermSeconds`. `0` = open-term (the reserve behaves as floating). Cannot be shortened on a reserve with active borrows. |
| `debtMaturityTimestamp` | u64 (Unix seconds) | Reserve-wide sunset. After this, no new borrows are accepted and existing borrows become liquidatable (gated by market flag). `0` = no sunset. Must not be set in the past. |
| `earlyRepayRemainingInterestPct` | Integer (0–100) | Penalty for repaying inside the first term. Penalty = projected interest for the remaining term × this percentage. Accrues to protocol fees on the debt reserve. |

For a fixed-rate reserve, configure `borrowRateCurve` as a flat curve at the target rate (both endpoints set to the same `borrowRateBps`) and leave `hostFixedInterestRateBps` at `0` unless an intentional protocol spread is required.

## Elevation groups

| Field | Type | Description |
| - | - | - |
| `elevationGroups` | u8 array (length 20) | List of elevation group IDs this reserve participates in. `0` slots are unused |

See [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md).

## Fixed-term

| Field | Type | Description |
| - | - | - |
| `debtTermSeconds` | u64 | Duration of fixed-term borrows on this reserve. `0` = open-term (default) |
| `debtMaturityTimestamp` | u64 | Absolute Unix timestamp when all debt on this reserve matures (cohort mode). `0` = per-borrow rolling term |
| `hostFixedInterestRateBps` | u16 | Fixed-rate component (bps) added on top of the IR curve rate |
| `earlyRepayRemainingInterestPct` | u8 (0–100) | Percent of remaining interest owed on early repay |

See [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md).

## Emergency

| Field | Type | Description |
| - | - | - |
| `emergencyMode` | u8 (bool) | Per-reserve emergency mode. `1` halts operations on this reserve |
| `proposerAuthorityLocked` | u8 (bool) | If `1`, blocks the proposer authority from updating this reserve config |
| `blockCtokenUsage` | u8 (bool) | If `1`, blocks using this reserve's cTokens as collateral |

See [Emergency controls](https://kamino.com/docs/curators/markets/emergency-controls.md).

## Fields to ignore

The following appear in some example JSON files but are not part of the current `ReserveConfig` struct. Treat them as no-ops; the program ignores them on update:

| Stale field | Status |
| - | - |
| `assetTier` | Deprecated. Replaced by elevation groups. |
| `multiplierSideBoost` | Removed. |
| `multiplierTagBoost` | Removed. |

If you encounter these in older configs, you can leave them in place (the on-chain struct ignores unrecognized fields during update) or strip them for clarity.

## Reading the live config

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS>
```

Saves the canonical, on-chain config to a JSON file. Use this as the source of truth before editing.

## Reference

* [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) — choosing LTV, threshold, IR curve, caps
* [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md) — TWAP and staleness setup
* [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md) — eMode setup
* [Fixed rate reserves](https://kamino.com/docs/curators/markets/fixed-rate-reserves.md) — fixed-rate, fixed-term lending
* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — liquidation tunables
* [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md) — margin-call grace window (advanced, rarely used)
* [Withdrawal caps](https://kamino.com/docs/curators/markets/withdrawal-caps.md) — per-interval rate limits
* [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) — the update workflow


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.