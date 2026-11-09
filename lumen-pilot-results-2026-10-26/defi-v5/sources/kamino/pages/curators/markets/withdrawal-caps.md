> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdrawal Caps

> Throttle deposits, withdrawals, and debt activity on a per-reserve, per-interval basis

Each reserve can configure two independent caps that throttle activity over a sliding interval. Caps are useful for newly-listed assets, regulated tokens, and any reserve where you want to limit how much can flow in or out per day without imposing a hard `depositLimit`/`borrowLimit` ceiling.

## The two caps

Each reserve has two `WithdrawalCaps` structs:

```jsonc theme={null}
{
  "depositWithdrawalCap": {
    "configCapacity": "1000000000000",
    "configIntervalLengthSeconds": "86400"
  },
  "debtWithdrawalCap": {
    "configCapacity": "500000000000",
    "configIntervalLengthSeconds": "86400"
  }
}
```

| Cap | Throttles |
| - | - |
| `depositWithdrawalCap` | Net deposit / withdrawal flow on the reserve's collateral side |
| `debtWithdrawalCap` | Net borrow / repay flow on the debt side |

Both are denominated in **token base units** of the reserve's mint.

## Field semantics

| Field | What it stores |
| - | - |
| `configCapacity` | Maximum net flow allowed within the interval. The cap counts both directions: deposits add to the running total, withdrawals subtract. The same applies for borrow / repay on the debt cap. |
| `configIntervalLengthSeconds` | Length of the rolling interval, in seconds. `86400` = 24 hours. |
| `currentTotal` | The current net flow within the active interval. Maintained on-chain; you don't set it manually. |
| `lastIntervalStartTimestamp` | Unix timestamp when the active interval started. Maintained on-chain. |

When the interval elapses (i.e., `now > lastIntervalStartTimestamp + configIntervalLengthSeconds`), `currentTotal` resets to zero on the next operation.

## Setting `configCapacity` to disable

`configCapacity = 0` disables the cap (the program treats `0` as no limit). To enable a cap, set a positive value.

To temporarily lock down a reserve, set `configCapacity` to a small positive value during a config update — the next operation that would push net flow above the cap will revert. Avoid `0`, which disables the cap entirely.

## Worked example

A new reserve for a long-tail asset listed with `depositLimit = 10M tokens`. The curator wants to limit per-day inflows to 1M tokens during the first month to keep TVL growth proportionate to the asset's available on-chain liquidity.

```jsonc theme={null}
{
  "depositLimit": "10000000000000",   // hard ceiling: 10M tokens
  "depositWithdrawalCap": {
    "configCapacity": "1000000000000", // per-day: 1M tokens
    "configIntervalLengthSeconds": "86400"
  }
}
```

Day 1: the reserve fills up to 1M tokens, then further deposits revert until the interval resets.
Day 2: the cap resets, another 1M tokens are accepted.
After 30 days: increase `configCapacity` to scale with comfort.

## Common configurations

| Reserve type | depositWithdrawalCap | debtWithdrawalCap |
| - | - | - |
| Newly-listed asset | Cap to \~10% of `depositLimit` per day | Cap to \~10% of `borrowLimit` per day |
| Established stable | Disabled (`0`) | Disabled (`0`) |
| Tokenized off-chain asset | Cap aligned with off-chain redemption capacity | Often disabled if not borrowable |
| Regulated token (Token-2022) | Cap aligned with regulator-imposed flow constraints | Same |
| Reserve with a vault on top | Disabled or very generous; vault-side rate limits handle UX | Same |

## Updating caps

Edit the reserve config, run `update-reserve-config`:

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/updated.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

Updates take effect immediately. The `currentTotal` and `lastIntervalStartTimestamp` are not reset by a config update — the interval continues running with the new capacity.

## Caps vs. utilization-based blocking

Two related fields throttle different things:

| Mechanism | What it does |
| - | - |
| `depositWithdrawalCap` / `debtWithdrawalCap` | Limit *total* net flow per interval, regardless of utilization |
| `utilizationLimitBlockBorrowingAbovePct` | Block new borrows when utilization is *currently* above the threshold, regardless of historical flow |

Use caps when you want predictable per-day flow limits (e.g., asset-issuer agreements). Use the utilization limit when you care about preventing leverage at high utilization levels.

The two work together: caps throttle volume, the utilization limit shapes the curve.

## Reading current cap state

`download-reserve-config` returns `currentTotal` and `lastIntervalStartTimestamp` along with the configured fields. Use it to inspect how much of the current interval's capacity has been consumed.

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS>
```

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — `depositWithdrawalCap` and `debtWithdrawalCap` fields
* [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) — `depositLimit`, `borrowLimit`, `utilizationLimitBlockBorrowingAbovePct`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.