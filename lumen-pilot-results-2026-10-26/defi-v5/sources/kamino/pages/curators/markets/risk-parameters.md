> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risk Parameters

> Choose LTV, liquidation thresholds, IR curves, caps, and borrow factors for a reserve

Risk parameters are how a curator expresses a thesis about an asset. They determine how much can be borrowed against it, when liquidations trigger, what the cost of borrowing is at each utilization level, and how much capital can flow into and out of the reserve.

This page is a guide to choosing values. Every field documented here is in [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md); refer there for the full schema and defaults.

## The relationship between LTV and liquidation threshold

```
loanToValuePct  <=  liquidationThresholdPct  <=  100
```

| Field | What it does |
| - | - |
| `loanToValuePct` | Maximum borrowing capacity against the asset, as a percent of its USD value. A user with \$1,000 of an asset at 75% LTV can borrow \$750 of debt. |
| `liquidationThresholdPct` | The point at which the position becomes liquidatable. Must be `>= loanToValuePct`. The gap between the two is the **liquidation buffer** — the cushion a borrower has before being liquidatable. |
| `liquidationThresholdPct - loanToValuePct` | The buffer. Wider buffers reduce liquidation frequency at the cost of borrowing capacity. |

Common reference points used across major Kamino markets:

| Asset class | LTV | LT | Buffer |
| - | - | - | - |
| Major stablecoins (in stables-only group) | 90–95% | 92–97% | 2–3% |
| Major liquid assets (SOL, BTC, ETH) | 70–80% | 75–85% | 5–10% |
| LSTs paired with their underlying (eMode) | 88–92% | 90–95% | 2–5% |
| Long-tail volatile assets | 30–55% | 50–70% | 10–20% |
| Newly listed assets | Start conservative; widen later | | |

These are reference ranges. Tune them to each asset based on its volatility profile, on-chain liquidity, oracle reliability, and historical depeg / recovery behavior.

## Borrow factor

```jsonc theme={null}
{ "borrowFactorPct": 100 }
```

A multiplier on the *debt-side* valuation of an asset. Borrowing 100 units of an asset with `borrowFactorPct: 125` is treated as if you borrowed 125 units for risk purposes — making the position behave more conservatively.

| borrowFactorPct | Effect |
| - | - |
| `100` | No adjustment. Default for stables and major assets. |
| `125` | Debt is treated as 25% larger than its market value. Use for assets where post-liquidation slippage is higher than typical. |
| `200+` | Aggressive overweight. Use for highly volatile or thinly traded debt assets. |

The program enforces `borrowFactorPct >= 100`; values below have no effect.

## The interest rate curve

```jsonc theme={null}
{
  "borrowRateCurve": {
    "points": [
      { "utilizationRateBps": 0,     "borrowRateBps": 0 },
      { "utilizationRateBps": 7000,  "borrowRateBps": 500 },
      { "utilizationRateBps": 8500,  "borrowRateBps": 1500 },
      { "utilizationRateBps": 10000, "borrowRateBps": 8000 }
    ]
  }
}
```

The borrow rate is determined by reserve utilization (`borrowed / deposited`) using a piecewise linear curve. The curve must satisfy:

* Exactly 11 points (pad with the final point repeated if you have fewer breakpoints)
* `utilizationRateBps` strictly non-decreasing from `0` to `10000` (`0%` to `100%`)
* `borrowRateBps` non-decreasing across the curve
* Rate between two breakpoints is linearly interpolated

### Designing the curve

The economics of an IR curve hinge on the **kink** — the breakpoint where the rate starts climbing steeply.

| Region | Purpose |
| - | - |
| `0% → kink` | Mild slope. Lets borrowers access cheap leverage when liquidity is abundant. |
| `kink → 100%` | Steep slope. Penalizes high utilization, pulls borrowers to repay and lenders to deposit. |

For most assets, the kink sits at 70–85% utilization. The slope above the kink is what enforces solvency: at 95% utilization, depositors should earn enough that capital flows in; borrowers should pay enough that capital flows out.

A common shape:

| Utilization | Borrow rate |
| - | - |
| 0% | 0% |
| 70% | 5% (the kink) |
| 85% | 15% |
| 100% | 80%+ |

The exact numbers depend on the asset and demand. Stablecoins with steady deposit demand can run with kinks at 90% and tighter slopes; volatile or thinly-supplied assets need wider slopes to keep utilization in check.

### Padding the array

The on-chain struct expects 11 points. If your curve has fewer real breakpoints, repeat the final point to fill:

```jsonc theme={null}
{
  "points": [
    { "utilizationRateBps": 0,     "borrowRateBps": 0 },
    { "utilizationRateBps": 7000,  "borrowRateBps": 500 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 },
    { "utilizationRateBps": 10000, "borrowRateBps": 8000 }
  ]
}
```

## Deposit and borrow caps

```jsonc theme={null}
{
  "depositLimit": "1000000000000",
  "borrowLimit":  "900000000000"
}
```

Limits are denominated in **token base units** (lamports for SOL, smallest unit for the token's decimals).

| Cap | Effect |
| - | - |
| `depositLimit` | Hard ceiling on total deposits. New deposits beyond this revert. Set higher than `borrowLimit` to leave a withdrawal buffer. |
| `borrowLimit` | Hard ceiling on total borrows. New borrows beyond this revert. |

A common pattern for new reserves:

| Phase | depositLimit | borrowLimit |
| - | - | - |
| Initial listing | Conservative (e.g., \$1M equivalent) | 80–90% of `depositLimit` |
| After 30 days of clean operation | 2–5× initial | Same ratio |
| Steady state | Asset-specific; track asset's on-chain liquidity | Same ratio |

`borrowLimit < depositLimit` ensures there is always some unborrowed liquidity (subject to live withdrawals). `borrowLimit == depositLimit` allows full utilization but means depositors may need the [withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md) to redeem.

A focused command exists for adjusting just the borrow cap:

```bash theme={null}
yarn kamino-manager update-reserve-config-debt-cap \
  --reserve <RESERVE_ADDRESS> \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## Utilization-based borrow blocking

```jsonc theme={null}
{ "utilizationLimitBlockBorrowingAbovePct": 80 }
```

Blocks new borrows once utilization exceeds the configured percentage. `0` disables. Useful as a softer alternative to `borrowLimit` for reserves where you want to throttle leverage at high utilization without capping total deposits.

Example: `utilizationLimitBlockBorrowingAbovePct: 90` means borrows revert when utilization is above 90%, while existing borrows and repayments continue unaffected.

## Fees

```jsonc theme={null}
{
  "fees": {
    "borrowFee": "0",
    "flashLoanFee": "0"
  },
  "protocolTakeRatePct": 0,
  "protocolLiquidationFeePct": 0,
  "protocolOrderExecutionFeePct": 0
}
```

| Fee | Charged on | How it accrues |
| - | - | - |
| `fees.borrowFee` | Origination of every borrow, as a decimal string (e.g. `"0.001"` = 0.1%) | Added to borrow's debt at origination |
| `fees.flashLoanFee` | Each flash loan | Charged in the same instruction as the flash repay |
| `protocolTakeRatePct` | Interest accrual on the reserve | Percentage (0–100) of accrued interest routed to protocol fees |
| `protocolLiquidationFeePct` | Liquidations | Percentage (0–100) of liquidation proceeds routed to protocol fees |
| `protocolOrderExecutionFeePct` | Filled obligation orders | Percentage (0–100) of filled order proceeds routed to protocol fees |

Default for curator markets: all zero. Curator-set fees go to the curator-controlled `lending_market_owner` via [`redeem_fees`](https://kamino.com/docs/curators/markets/protocol-fees).

## Reserve status

```jsonc theme={null}
{ "status": 0 }
```

| Value | State | Meaning |
| - | - | - |
| `0` | Active | Normal operation |
| `1` | Obsolete | Deprecated — the program treats this similarly to active for existing positions but signals to integrators not to surface for new activity |
| `2` | Hidden | Hidden from default UIs |

Most reserves stay at `0`. Use `1` when phasing out a reserve while honoring existing obligations.

## Putting it together: a checklist for a new reserve

**1. Pick LTV and liquidation threshold**

Use comparable Kamino reserves as a starting reference. For a never-listed asset, start more conservatively than analogues and widen later.

**2. Set borrow factor**

`100` for major assets and stables. `125`+ for assets with thinner exit liquidity.

**3. Design the IR curve**

Pick a kink (typically 70–85% utilization). Set base rate at the kink (3–8% for stables, 5–15% for volatile assets). Set max rate at 100% utilization (40–80% APR is common).

**4. Choose caps**

`depositLimit` proportional to the asset's verified on-chain liquidity. `borrowLimit` 80–90% of `depositLimit`.

**5. Set fees**

`protocolTakeRatePct` = 0–20% if you want the curator to capture interest revenue. Origination fees default to `0` for most consumer-facing reserves.

**6. Configure the oracle**

Scope is the default. Set TWAP and staleness guards. → [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)

**7. Decide on advanced features**

eMode? Auto-deleverage? Withdrawal queue? Fixed-term? Each is opt-in. → [Lifecycle](https://kamino.com/docs/curators/markets/lifecycle.md#optional-features-and-when-to-enable-them)

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — every field documented
* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — what happens when LT is breached
* [Elevation groups](https://kamino.com/docs/curators/markets/elevation-groups.md) — relaxed parameters for correlated assets


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.