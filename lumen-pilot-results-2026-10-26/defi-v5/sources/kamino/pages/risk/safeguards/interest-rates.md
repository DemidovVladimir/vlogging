> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Interest Rate Model

> How Kamino's poly-linear interest rate curve manages liquidity risk and maintains withdrawal availability

Interest rates are the protocol's primary defense against liquidity risk — the risk that lenders cannot withdraw because all supply is being borrowed. The interest rate model creates automatic economic pressure that prevents utilization from reaching 100%, ensuring that lenders can always access their funds.

## What Liquidity Risk Means

Liquidity risk in a lending protocol is distinct from insolvency risk. When utilization reaches 100% — all deposited tokens are borrowed — lenders cannot withdraw. This does not cause financial loss. In fact, 100% utilization produces the highest possible interest rates for lenders. But it temporarily prevents withdrawals until borrowers repay or new supply arrives.

While not catastrophic, extended high utilization is suboptimal:

* Lenders who need to access their funds are locked out
* Lending Vault curators cannot rebalance allocations
* New deposits that could bring utilization down are discouraged (why deposit if you might get locked?)

The interest rate model is designed to make 100% utilization economically unsustainable — rates spike so aggressively that borrowers are compelled to repay and new lenders are attracted by the elevated yields.

## The Poly-Linear Curve

Kamino employs a **poly-linear interest rate curve** — a piecewise linear function that maps utilization to interest rates with configurable breakpoints (knot points). The curve is designed with a sharp "kink" at the target utilization level:

* **Below target utilization:** Rates increase gradually. Borrowing is encouraged, and rates are competitive.
* **Above target utilization:** Rates increase steeply. Borrowing becomes expensive rapidly, creating strong economic pressure to repay.

This kink structure ensures that utilization naturally gravitates toward the target level. If utilization exceeds the target, the interest rate spike makes borrowing prohibitively expensive — borrowers repay, utilization drops back to target. If utilization is well below target, low rates attract borrowers until utilization rises.

## Borrow Rate Formula

The current borrowing rate is determined by interpolating between configured knot points on the curve:

```
Bₜ = B_F + (B_C - B_F) / (U_C - U_F) × (Uₜ - U_F)
```

Where:

| Variable | Definition |
| - | - |
| `Bₜ` | Current borrow interest rate |
| `B_C` | Borrow rate at the ceiling utilization knot point |
| `B_F` | Borrow rate at the floor utilization knot point |
| `Uₜ` | Current utilization rate |
| `U_C` | Utilization rate at the ceiling knot point |
| `U_F` | Utilization rate at the floor knot point |

**Example:** A typical stablecoin curve might have:

* Floor knot: 80% utilization → 5% borrow rate
* Ceiling knot: 95% utilization → 150% borrow rate

At 85% utilization (slightly above target):

```
Bₜ = 0.05 + (1.50 - 0.05) / (0.95 - 0.80) × (0.85 - 0.80)
Bₜ = 0.05 + 1.45 / 0.15 × 0.05
Bₜ = 0.05 + 0.483
Bₜ ≈ 53.3%
```

The rate jumps dramatically once utilization exceeds the floor knot point — this is the "kink" that makes overcrowded reserves self-correcting.

## Supply Rate Formula

The supply rate — what lenders earn — is derived from the borrow rate:

```
Sₜ = Uₜ × Bₜ × (1 - Rₜ)
```

Where:

| Variable | Definition |
| - | - |
| `Sₜ` | Current supply interest rate |
| `Uₜ` | Current utilization rate |
| `Bₜ` | Current borrow interest rate |
| `Rₜ` | Reserve factor (protocol take rate) |

The supply rate is always lower than the borrow rate because:

1. **Utilization \< 100%:** Not all supply is being borrowed, so interest income is distributed across a larger base
2. **Reserve factor:** A portion of the interest goes to the protocol treasury

**Example:** Continuing from above with 85% utilization, 53.3% borrow rate, and 15% reserve factor:

```
Sₜ = 0.85 × 0.533 × (1 - 0.15)
Sₜ = 0.85 × 0.533 × 0.85
Sₜ ≈ 38.5%
```

Lenders earn 38.5% APY — a significant yield that attracts new deposits and reduces utilization.

## Target Utilization

The Risk Council calibrates curve parameters to achieve a target utilization for each asset. Target utilization varies by asset class:

| Asset Class | Typical Target Utilization | Rationale |
| - | - | - |
| **Stablecoins** (USDC, USDT) | 80-90% | High demand, predictable repayment patterns, low volatility |
| **Major assets** (SOL, ETH) | 60-75% | Moderate demand, need more withdrawal buffer during volatility |
| **Volatile assets** | 40-60% | Lower demand, need substantial buffer for rapid deleveraging |

Higher target utilization means more capital efficiency (more of the deposited supply is earning interest). Lower target utilization means more liquidity buffer (lenders are more likely to be able to withdraw at any time).

The curve parameters are set such that the equilibrium utilization — where borrowing demand balances with the interest rate — naturally settles near the target.

## Reserve Factor

The reserve factor is the protocol's take rate — the percentage of interest income that accrues to the Kamino treasury rather than being distributed to lenders. This serves as:

* **Protocol revenue:** Funds operations, development, and potential future insurance mechanisms
* **Rate buffer:** A small reduction in lender yield in exchange for protocol sustainability

Reserve factors are typically in the 10-20% range, varying by asset and market. Higher reserve factors reduce lender yield but increase protocol revenue; lower reserve factors maximize lender yield but reduce protocol sustainability.

## How the Curve Self-Corrects

The interest rate model creates a negative feedback loop that maintains utilization near target:

1. **Utilization rises above target** → borrow rates spike → borrowers repay (expensive to hold debt) → new lenders deposit (yields are attractive) → utilization falls back to target

2. **Utilization falls below target** → borrow rates drop → new borrowers enter (cheap to borrow) → some lenders withdraw (yields are low) → utilization rises back to target

This self-correcting property means the protocol does not need active management to maintain healthy utilization under normal conditions. The curve does the work automatically.

## When the Curve Isn't Enough

In extreme scenarios, the interest rate curve alone may not prevent prolonged high utilization:

* **Market-wide stress:** During a crash, borrowers may be unable to repay (their collateral is losing value), even though rates are high
* **Intentional utilization attacks:** An attacker could borrow the entire supply and hold it, paying the high interest rate, to prevent other users from withdrawing

For these edge cases, other safeguards intervene:

* **[Daily caps](https://kamino.com/docs/risk/safeguards/daily-caps.md)** prevent rapid utilization increases
* **[Auto-deleverage](https://kamino.com/docs/risk/safeguards/auto-deleverage.md)** can be triggered to forcibly unwind positions
* **Supply caps** limit total deposits, bounding the maximum amount at risk

The interest rate model is the first line of defense — it handles 99%+ of utilization management automatically. The other safeguards are backstops for the remaining edge cases.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.