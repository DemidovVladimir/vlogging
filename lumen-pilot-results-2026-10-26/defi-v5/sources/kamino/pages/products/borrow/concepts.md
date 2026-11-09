> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> The foundational ideas behind Kamino Borrow — from reserves and markets to how variable and fixed rates work

Kamino Borrow operates two distinct rate models: **variable** and **fixed**. Neither is the default or the special case. Variable rates suit flexible, opportunistic positions. Fixed rates suit carry strategies, planned time horizons, and institutional deployment. Both are fully supported, first-class models built on the same underlying infrastructure. The concepts below apply to both unless a section is explicitly labelled otherwise.

***

## Foundations

### The peer-to-pool model

Kamino Borrow is a peer-to-pool lending market. Depositors contribute assets into shared liquidity pools. Borrowers draw from those pools. The protocol mediates automatically — setting rates, tracking position health, and executing liquidations — with no counterparty matching required.

This contrasts with order-book lending, where a specific lender must be matched to a specific borrower before a loan can begin. Peer-to-pool lending has no such requirement. Capital is fungible within the pool, and any borrower can draw from it the moment they post sufficient collateral.

The consequence is permissionless borrowing: no underwriting, no identity check, no credit assessment. The collateral is the only guarantee. As long as the borrower's position remains overcollateralized, the protocol enforces the loan automatically and the lender has no exposure to borrower identity or intent.

***

### What is a reserve

A reserve is a pool for a single asset within a market. All deposits of USDC in the SOL/BTC Market enter the same USDC reserve. All borrows of USDC in the SOL/BTC Market draw from that same pool. The same deposited dollar is lent simultaneously to multiple borrowers through accounting — the reserve tracks total deposits, total amount borrowed, the current rate, and each lender and borrower's proportional share.

Each asset has its own reserve because different assets carry different risk profiles and warrant different rate parameters. SOL and USDC should not share a pool — their volatility, liquidity, and acceptable LTV ratios differ materially.

Reserves exist in both rate models. In the variable model, there is one reserve per asset per market. In the fixed model, there is one reserve per rate-and-duration combination per asset per market — the USDC 5.5% 3-month reserve is completely separate from the USDC 6.0% 6-month reserve. The reserve is the fundamental unit across both models.

***

### What is a market

A market is an isolated collection of reserves governed by shared risk parameters. Collateral deposited in one market cannot be used to borrow from another. Liquidity does not flow between markets. Risk does not either — a liquidation cascade or parameter change in one market has no effect on positions in another.

Kamino currently operates four markets:

| Market | Purpose |
| - | - |
| **SOL/BTC Market** | The primary market. Supports Solana's core assets: SOL, wETH, tBTC, USDC, USDT, JitoSOL, mSOL, bSOL. Deepest liquidity, broadest collateral support. |
| **JLP Market** | Optimised for JLP (Jupiter Liquidity Provider tokens) as collateral. Allows JLP holders to borrow against their LP position without unwinding it. |
| **Altcoins Market** | Supports higher-volatility assets with tighter risk parameters and lower LTV ratios. For assets that do not meet SOL/BTC Market standards. |
| **Prime Market** | Institutional-grade market supporting real-world assets (RWA) and requiring the PRIME token for access. Custom risk configurations for larger positions. |

For full detail on market structure, position modes, and cross-collateralization, see [Markets](https://kamino.com/docs/products/borrow/markets.md).

***

### Overcollateralized lending

Every loan on Kamino is backed by more collateral value than the loan itself is worth. A borrower cannot receive \$1,000 without first depositing collateral worth more than \$1,000.

This requirement exists because DeFi lending has no identity layer. There is no credit history, no legal recourse, and no way to compel repayment beyond the collateral already posted. Overcollateralization is not a tax on the borrower — it is the mechanism that makes anonymous, permissionless lending possible at all. It substitutes collateral for the creditworthiness checks that traditional lenders rely on.

The degree of required overcollateralization varies by asset and market, governed by Max LTV and Liquidation LTV parameters.

***

### LTV — the three values

LTV (Loan-to-Value) measures your debt relative to your collateral.

```
LTV = debt value / collateral value
```

Three distinct LTV values apply to every position:

| LTV value | Definition |
| - | - |
| **Max LTV** | The ceiling at which you can open or increase a borrow. You cannot originate new debt that would push your LTV above this value. |
| **Liquidation LTV** | The threshold at which your position becomes eligible for liquidation. Always higher than Max LTV. |
| **Current LTV** | Your live debt-to-collateral ratio right now. The number that determines position health at every moment. |

**The buffer that actually matters** is the gap between Current LTV and Liquidation LTV — not the gap between Current LTV and Max LTV. Max LTV is already consumed at origination. The real safety margin is how much further your collateral can fall before the protocol can begin liquidating you.

Concrete example:

* Deposit 50 SOL at \$200 = \$10,000 collateral. Borrow \$7,000 USDC → Current LTV = 70%
* SOL drops to \$175 → collateral = \$8,750 → Current LTV = **80%** → eligible for liquidation

The formula for tolerable price decline:

```
Tolerable decline = (Liquidation LTV − Current LTV) / Liquidation LTV
                  = (80% − 70%) / 80% = 12.5%
```

A 12.5% SOL price drop triggered liquidation from a position that started comfortably below Max LTV.

**Interest compounds your risk silently.** At a 10% annual borrow rate on \$7,000 USDC, with collateral prices flat:

| Time | Debt balance | Current LTV |
| - | - | - |
| Day 1 | \$7,002 | 70.02% |
| 6 months | \$7,350 | 73.50% |
| 12 months | \$7,700 | 77.00% |

After a year, the position has drifted from 70% to 77% LTV with no price movement. This applies identically in both variable and fixed rate models — fixed rates eliminate rate uncertainty but not the compounding effect.

> [!WARNING]
>
> Variable borrow rates can spike during high-utilization periods. A rate spike from 10% to 40% makes debt accumulate four times faster than expected. Monitor positions during volatile markets.

***

### Borrow Factors

Borrow Factors are a risk adjustment multiplier applied to debt assets. Stable, liquid assets like USDC carry a Borrow Factor of 1.0 — no adjustment. Higher-risk or less liquid assets carry Borrow Factors above 1.0, which reduce your effective borrowing capacity and raise your risk-adjusted LTV.

```
Risk-adjusted debt = actual debt value × Borrow Factor
```

```
Borrow Capacity = (Collateral Value × Max LTV) / Borrow Factor
```

With \$10,000 collateral and 80% Max LTV:

| Debt asset | Borrow Factor | Available to borrow |
| - | - | - |
| USDC | 1.0 | \$8,000 |
| BONK | 2.0 | \$4,000 |

A Borrow Factor of 2.0 halves your effective borrowing capacity. It also doubles your effective risk-adjusted LTV for an equivalent real debt size — a position that looks healthy by market values may be much closer to liquidation once the Borrow Factor is applied.

> [!WARNING]
>
> Always check the Borrow Factor before borrowing any asset. It may make your effective safety buffer significantly smaller than headline market values suggest.

***

### Liquidation mechanics

When a position's Current LTV exceeds Liquidation LTV, it becomes eligible for liquidation. Two design choices protect borrowers from catastrophic outcomes:

**Close factor — 20% per round.** Liquidators may only close up to 20% of a position in a single liquidation event. If the position remains above Liquidation LTV after the first round, a second round can be applied. A borrower who adds collateral or repays debt between rounds can stop the process entirely. This prevents full wipeout from a brief, shallow breach. If LTV exceeds the market's insolvency-risk threshold (typically 95%), the close factor increases to 100% to prevent bad debt.

**Dynamic liquidation bonus.** The bonus paid to liquidators scales with how far the position's LTV has breached the Liquidation LTV threshold. It starts at a per-reserve minimum bonus for positions just past the threshold, scales upward as the breach deepens, and is capped at a per-reserve maximum. Near 100% LTV, a solvency cap reduces the bonus so that liquidation does not worsen the position's health. Borrowers liquidated promptly near the threshold lose less collateral; deeper breaches carry larger bonuses but more execution risk for the liquidator.

For full liquidation mechanics, eligibility conditions, and how to avoid liquidation, see [Liquidations](https://kamino.com/docs/products/borrow/liquidations.md).

***

### eMode / Elevation Mode

When collateral and borrowed assets are closely correlated — for example, JitoSOL as collateral and SOL as debt — their prices move together. A price shock large enough to push a JitoSOL/SOL position into liquidation is far less likely than a shock to a JitoSOL/USDC position. eMode (Elevation Mode) recognizes this by permitting significantly higher Max LTV for approved correlated pairs.

| Mode | Example pair | Approximate Max LTV | Approximate max leverage |
| - | - | - | - |
| Standard | SOL / USDC | \~75% | \~4x |
| eMode Main | mSOL, bSOL, JupSOL / SOL | \~87% | \~7.7x |
| eMode Jito | JitoSOL / SOL | \~90% | \~10x |

eMode is the mechanism that powers Kamino's [Multiply](https://kamino.com/docs/products/multiply.md) product — capital-efficient leveraged exposure to correlated asset pairs. For configuration and eligibility, see [Markets](https://kamino.com/docs/products/borrow/markets.md).

***

## Variable Rate Model

### How variable rates work

Variable rates are governed by a single observable signal: **utilization** — the fraction of a reserve's total deposits that is currently borrowed.

```
Utilization = borrowed amount / total deposited amount
```

The system is self-correcting. High utilization pushes rates up, which simultaneously discourages new borrowing and attracts new deposits — both effects reduce utilization. Low utilization pushes rates down, which stimulates borrowing and may prompt lenders to redeploy capital elsewhere — both effects raise utilization. Over time, rates tend toward an equilibrium where the reserve operates within a target utilization band.

Two extremes to understand:

* **100% utilization** — all deposited capital is borrowed. No withdrawals are possible until borrowers repay. This is the failure mode the rate curve is designed to prevent.
* **0% utilization** — no capital is borrowed. Lenders earn nothing. This resolves naturally as borrowers arrive.

***

### The interest rate curve and the kink

Kamino uses a two-segment rate curve with a **kink** at the target utilization level.

**Below the kink** — rates rise gradually. The pool is healthy: borrowing is affordable, withdrawal liquidity is available, lenders earn competitive yield.

**Above the kink** — rates escalate steeply. This is a correction mechanism, not a punishment. The steep rates create strong pressure for borrowers to repay and for new lenders to deposit, which pulls utilization back below the kink. The high rates are temporary — they resolve as the market responds.

Illustrative borrow rates for a USDC reserve:

| Utilization | Approximate borrow rate |
| - | - |
| 40% | 3–5% |
| 80% (kink) | 12–18% |
| 90% | 35–60% |
| 95% | 90–160% |

**What lenders actually earn:**

```
Supply APY ≈ Borrow Rate × Utilization × (1 − Protocol Spread)
```

At 12% borrow rate, 80% utilization, 15% protocol spread:

```
Supply APY = 12% × 80% × (1 − 0.15) = 8.16%
```

Supply APY is always below the borrow rate because the idle portion of the pool earns nothing but still sits in the denominator of the utilization calculation. Higher utilization means more of the pool is earning, which is why high-utilization reserves offer better lender yields.

**Trade-off summary:** Variable rates offer maximum flexibility — borrow and repay at any time, no fixed term, no maturity to manage. The cost is zero rate certainty. A 5% borrow rate today can be 20% tomorrow if utilization spikes.

***

## Fixed Rate Model

### Why fixed rates exist — and what they trade off

Variable rates are capital-efficient and self-correcting, but they are unpredictable. A leveraged carry strategy that earns 8% annualised can flip to a loss overnight if the borrow rate spikes from 5% to 20%. For treasury management or institutional deployment, unpredictable borrowing costs are a planning problem, not just a risk.

Fixed rates solve this by locking the borrow cost for a defined term. A 5.5% 3-month loan charges 5.5% through the end of its term regardless of what utilization does in the variable pool. The cost is flexibility — you are committed to a term, and exiting early carries a penalty during the first term.

Neither model is inherently superior. They serve different needs:

| | Variable | Fixed |
| - | - | - |
| Rate certainty | None | Full — for the term |
| Flexibility | Full — repay any time | Limited — early exit penalty in first term |
| Best for | Opportunistic positions, short-horizon trades | Carry strategies, treasury deployment, structured positions |
| Complexity | Low | Higher — terms, rollover, withdrawal queue |

***

### The rate grid

Fixed rates are not a modification of the variable pool. They are a separate structure: multiple independent reserves per debt token, each defined by a specific rate AND a specific duration.

The USDC 5.0% 3-month reserve and the USDC 5.5% 6-month reserve are entirely distinct:

* Own liquidity pool
* Own set of borrowers
* Own set of lenders
* No interaction between them

Example rate grid for USDC in a single market:

| Rate | 1 month | 3 months | 6 months | 12 months |
| - | - | - | - | - |
| 5.0% | USDC 5.0% 1m | USDC 5.0% 3m | — | — |
| 5.5% | — | USDC 5.5% 3m | USDC 5.5% 6m | — |
| 6.0% | — | USDC 6.0% 3m | USDC 6.0% 6m | USDC 6.0% 12m |
| 7.0% | — | — | USDC 7.0% 6m | USDC 7.0% 12m |

Not every cell is populated. Curators and governance determine which rate-duration combinations exist. A large repayment in one reserve does not affect liquidity in any other. Reserve isolation is complete.

***

### The yield curve and term premium

The rate grid creates a visible, on-chain term structure — what the market currently prices for 1-month, 3-month, 6-month, and 12-month USDC lending. This is the yield curve for that asset.

The **term premium** is the additional yield lenders require to lock capital for a longer duration. If the 3-month USDC rate is 5.0% and the 6-month rate is 5.5%, the term premium for the additional 3 months is 0.5%. It reflects the lender's compensation for reduced liquidity and increased uncertainty over a longer horizon.

When demand for longer-duration borrowing rises, rates in longer-duration reserves rise relative to shorter ones — the market signals that long-term capital is scarce. This is how traditional fixed-income markets work. Kamino's rate grid brings this price discovery on-chain for the first time in DeFi.

***

### Conditional Liquidity — the key innovation

Fixed-rate reserves have an inherent problem for lenders: capital sitting in a fixed-rate reserve earns nothing until a borrower arrives. A vault pre-positioning into the USDC 5.5% 6-month reserve before any borrowers appear destroys yield — all that capital sits idle.

Conditional Liquidity solves this. Capital remains in a variable-rate reserve, earning the live variable yield. The vault simultaneously posts a conditional signal on one or more fixed-rate reserves, declaring that it can fill up to a specified amount at that rate and duration. No capital moves. No yield is lost.

When a matching Borrow Order is submitted:

1. The protocol pulls the required amount from the vault's variable-rate position
2. Deposits it into the target fixed-rate reserve
3. Delivers it to the borrower

The entire move is atomic. Between signal and fill, the capital earns variable-rate yield.

A single pool of capital can signal across multiple rate-duration pairs simultaneously. If the USDC 5.5% 3-month reserve fills first, the remaining signal on USDC 6.0% 6-month is satisfied from the same capital pool — first match wins, and only that portion moves.

> [!NOTE]
>
> Conditional Liquidity is a vault-level feature. Retail lenders depositing directly into a reserve provide committed liquidity to that specific reserve immediately and do not post conditional signals.

***

### Borrow Orders

In the variable model, borrowing is immediate: collateral posted, borrow executed in the same transaction (subject to available liquidity).

In the fixed-rate model, borrowers express demand via a standing Borrow Order. A Borrow Order specifies:

* **Debt token** — e.g., USDC
* **Maximum acceptable rate** — the order will not fill at any rate above this ceiling
* **Minimum duration** — the shortest term the borrower will accept
* **Expiry** — how long the order remains open before auto-cancelling

When matching Conditional Liquidity exists, the fill is atomic — the order executes immediately. When no matching liquidity exists, the order remains open as visible on-chain demand that vault managers can observe and respond to.

**Partial fills are allowed.** A large order can fill in tranches over time as liquidity enters the market. Each filled portion begins accruing interest immediately. The unfilled remainder stays open.

**Fill order is random.** There is no priority by order size, submission time, or any other factor. Large orders have no advantage over small ones.

No interest accrues on unfilled portions. An open order that never fills costs nothing.

***

### Rollover and the withdrawal queue

Fixed-rate loans have a defined term with an end date. Loans are created with auto-rollover on by default, and at the end date the protocol rolls the loan into a new fixed-rate term in the same reserve, at the same rate. Rollover succeeds when the reserve has liquidity available and no withdrawal tickets are queued, and the loan extends for another full term at the same rate.

Rollover happens during a window that opens before the end date, with its length configured per market, and completes shortly after opening when liquidity is available. If the fixed-rate rollover does not succeed and the market has an open-term rollover window configured, the protocol attempts a **variable-rate fallback**: the position migrates into the variable-rate reserve for the same asset. If neither path succeeds, the loan does not roll over and there is no pending state. You can also repay and close the loan at any time before the end date.

**Rollover is not guaranteed.** It requires available liquidity in the target reserve and no lenders queued for withdrawal.

**The withdrawal queue** is how lenders signal intent to exit before term end. Lenders cannot withdraw on demand mid-term, because capital is committed for the duration. Instead, they submit a withdrawal ticket specifying the amount they want returned. Tickets enter a per-reserve FIFO queue and fill as capital re-enters through repayments.

The queue directly gates borrower rollover. **Any queued withdrawal ticket in a reserve blocks rollover for all borrowers in that reserve.** Lenders wanting out take priority over borrowers wanting to stay. Borrowers planning to roll should check for queued tickets before the term ends.

**Auto-repay.** A position that reaches its end date without rolling over, and that the borrower does not close, enters Auto-repay: Kamino gradually repays the debt using the borrower's collateral, subject to fees, over a window configured per market, in small increments. Auto-repay begins at the end date, and its cost ramps with time, so closing early in the window costs less than letting it run, and closing before the end date avoids Auto-repay entirely.

> [!WARNING]
>
> Taking no action at the end date is only safe when there is liquidity for the loan to roll over. If it cannot roll over and you do not close it, Auto-repay begins at the end date. Confirm the state of the relevant reserves ahead of the end date, and close the position if it cannot roll over.

***

### Early repayment

You can repay a fixed-rate loan at any time before the term ends. During the **first term only**, an Early Repay Penalty applies.

The penalty compensates lenders for the early return of capital they committed for the agreed duration. It is calculated based on the minimum interest that would have accrued had the loan run its full term.

After a rollover into a subsequent term, there is no Early Repay Penalty. You can exit at any time without cost.

> [!NOTE]
>
> The Early Repay Penalty applies during the first term only. Once a loan rolls over into a new term, you can exit at any time without penalty.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.