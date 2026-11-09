> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> The rate grid, term premium, and how borrowers consume fixed-rate liquidity

This page explains the structural and economic concepts that shape how a curator should think about fixed-rate reserves. If you're new to fixed rates, read this before [Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md).

## The rate grid

A single market now serves each debt token through multiple reserves:

* One **floating-rate reserve** — rate fluctuates with utilization (existing behaviour)
* Zero or more **fixed-rate reserves** — each with a constant borrow rate and a fixed term, e.g. `USDC 5.0% 1M`, `USDC 5.5% 3M`, `USDC 6.0% 6M`

These reserves sit on a **rate grid** organised by rate × duration. Example for USDC in a single market:

| Rate | 1 month | 3 months | 6 months | 12 months |
| - | - | - | - | - |
| 5.0% | USDC 5.0% 1M | USDC 5.0% 3M | — | — |
| 5.5% | — | USDC 5.5% 3M | USDC 5.5% 6M | — |
| 6.0% | — | USDC 6.0% 3M | USDC 6.0% 6M | USDC 6.0% 12M |
| 7.0% | — | — | USDC 7.0% 6M | USDC 7.0% 12M |

Not every cell is populated. The market manager decides which rate × duration cells exist (see [Markets → Fixed Rates](https://kamino.com/docs/curators/markets/fixed-rates.md)).

Each fixed-rate reserve is **fully isolated**. It has its own liquidity pool, its own borrowers, its own lenders, and its own utilization. A position in `USDC 5.5% 3M` has no interaction with `USDC 6.0% 6M`. A large repayment or withdrawal in one reserve does not affect liquidity in adjacent ones.

The allocations UI shows reserve type, rate, term, supply APY, TVL, and utilization for each reserve. Use those as your primary allocation signals.

## Term premium and the emerging yield curve

The rate grid creates a visible, on-chain term structure: what the market currently prices for 1-month, 3-month, 6-month, and 12-month USDC lending. This is the yield curve for that debt token.

The **term premium** is the additional yield lenders require to commit capital for a longer duration. If 3-month USDC clears at 5.0% and 6-month clears at 5.5%, the term premium for the additional 3 months is 50 bps — compensation for reduced liquidity and increased uncertainty over the longer horizon.

For curators, the practical implication: the longer cells of the grid tend to clear at higher rates. If your depositor profile tolerates duration, the marginal yield is there. Reading the grid across maturities (1M → 3M → 6M → 12M) shows where the market currently prices duration. To act on a signal — add or expand an FR allocation — see [Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md) and [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## How borrowers take fixed-rate liquidity

Two independent paths bring borrow demand into a fixed-rate reserve. Your allocation responds the same way to either.

### Direct borrow

A borrower with sufficient collateral sees available liquidity in the fixed-rate reserve and borrows it in a single atomic transaction. This is the same flow as borrowing from any reserve — there is no "order" sitting on-chain, no standing intent. The borrower acts now: collateral posted, debt taken, transaction lands in one slot.

For a curator, this means:

* A Standard allocation is immediately usable by direct borrows from the moment it lands.
* A Conditional allocation can also satisfy a direct borrow — the vault's atomic-fill path triggers as part of the borrow transaction, moving capital from a floating source into the FR reserve and serving the borrow in one shot.

### Borrow order

A borrower posts a standing intent: "I want to borrow X tokens at a max rate of Y for at least Z duration, fillable until T." The order doesn't borrow anything yet — it sits on-chain until matching reserve liquidity is available, at which point a fill bot (or anyone, since the fill instruction is permissionless) executes the borrow on the borrower's behalf.

Borrow order parameters:

| Field | Meaning |
| - | - |
| `debtLiquidityMint` | Token the borrower wants |
| `requestedDebtAmount` | Originally requested size |
| `remainingDebtAmount` | Still unfilled |
| `maxBorrowRateBps` | Ceiling rate the borrower accepts |
| `minDebtTermSeconds` | Minimum acceptable term (`0` = open-term only) |
| `fillableUntilTimestamp` | Expiry |
| `filledDebtDestination` | Borrower-owned token account where filled funds land |

Orders fill atomically against any matching reserve. Fill ordering between competing reserves is **random** — first transaction to execute wins; no priority by submission time, order size, or any other factor.

Partial fills are allowed: if the matching reserve has only some of the requested liquidity, the available portion fills immediately and the order remains open for the remainder. Each filled portion accrues interest from the slot it fills.

For a curator, the borrow-order book is a source of **demand signal**. An order that's been sitting unfilled for hours at `5.5% / 6M` is the market telling you there's appetite at that cell. Adding capacity there (Conditional or Standard) lets your vault capture the fill — see [Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md) for the FR-specific allocation guidance, and [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md) for the workflow.

## Why FR yields can be higher

The general yield formula `Supply APY ≈ Borrow Rate × Utilization × (1 − Protocol Take Rate)` is covered in [Concepts → Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#how-yield-is-generated). The FR-specific observation:

**Fixed-rate reserves can run at high utilization when matched with active borrow demand.** At 100% utilization, the `× utilization` factor disappears and lenders earn the borrow rate net of the protocol take for the full term:

* A floating reserve at 70% utilization paying a 6% borrow rate passes roughly 4.2% to lenders before protocol take.
* A fixed reserve at 100% utilization paying 5.5% passes 5.5% × (1 − take rate) for the locked duration.

The economics depend on demand actually showing up. An empty fixed-rate reserve is idle capital regardless of the headline rate — which is the central reason curators typically use Conditional rather than Standard allocation for fixed-rate exposure: capital earns floating yield while waiting for demand instead of sitting idle in the FR reserve. The term premium compounds this — longer-duration reserves clear at higher rates than shorter ones, and capturing it is one of the structural alpha sources FR enables.

## What's next

> **[Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md)**
>
> Standard vs. Conditional in the FR context, fill mechanics, priority, setup.

> **[Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)**
>
> What your capital experiences from fill through exits.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.